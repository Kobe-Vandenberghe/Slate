import { useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import { useDocumentStore } from '@/features/document'
import { colorFor, finishCreation, placeShape } from '@/features/editor'
import { getSelectedShapes, useSelectionStore } from '@/features/selection'
import {
  boundsOf,
  connectorEndAt,
  createConnector,
  createShape,
  isConnector,
  pinConnectorEnds,
  resizeBounds,
  resizeShape,
  rotateShapes,
  scaleShapes,
  setConnectorEnd,
  shapeAABB,
  snapRotation,
  translateShapes,
} from '@/features/shapes'
import type { ResizeHandle } from '@/features/shapes'
import { useEditingStore } from '@/features/text-editing'
import { useToolStore } from '@/features/tools'
import { panCamera, screenToWorld, useViewportStore } from '@/features/viewport'
import { angleBetween, centerOf, dist, intersects, rectFromPoints, toRadians } from '@/shared/math'
import type { Bounds, Vec } from '@/shared/math'
import { handleAt, isInsideTextEditor, shapeIdAt } from '../model/dom'
import { CREATE_THRESHOLD, DOUBLE_CLICK_MS, DOUBLE_CLICK_SLOP, MOVE_THRESHOLD, SNAP_DISTANCE } from '../model/dragSession'
import type {
  ConnectSession,
  CreateSession,
  DragSession,
  EndpointSession,
  MarqueeSession,
  MoveSession,
  ResizeSession,
  RotateSession,
} from '../model/dragSession'

type CanvasPointerEvent = ReactPointerEvent<HTMLDivElement>

const MOUSE_LEFT = 0
const MOUSE_MIDDLE = 1
const MOUSE_RIGHT = 2

const doc = () => useDocumentStore.getState()

const snapDistance = () => SNAP_DISTANCE / useViewportStore.getState().camera.z

/** Canvas-local screen coordinates (the handlers are attached to the canvas element). */
function toLocal(e: CanvasPointerEvent): Vec {
  const r = e.currentTarget.getBoundingClientRect()
  return { x: e.clientX - r.left, y: e.clientY - r.top }
}

/**
 * The canvas pointer state machine: pan, select, marquee, move, resize, rotate and draw.
 * Reads stores via `getState()` so handlers never go stale. Returns handlers to spread on the
 * Canvas plus transient UI state for rendering.
 */
export function usePointerInteractions(spaceHeld: boolean) {
  const sessionRef = useRef<DragSession | null>(null)
  const lastPressRef = useRef<{ time: number; at: Vec } | null>(null)
  const [marquee, setMarquee] = useState<Bounds | null>(null)
  const [panning, setPanning] = useState(false)
  /** True while shapes are being manipulated; used to hide floating UI. */
  const [interacting, setInteracting] = useState(false)

  // Native dblclick is unreliable here: pointer capture retargets it to the canvas element.
  function registerPress(at: Vec) {
    const now = performance.now()
    const last = lastPressRef.current
    const isDouble = !!last && now - last.time < DOUBLE_CLICK_MS && dist(last.at, at) < DOUBLE_CLICK_SLOP
    lastPressRef.current = isDouble ? null : { time: now, at }
    return isDouble
  }

  function begin(e: CanvasPointerEvent, session: DragSession) {
    sessionRef.current = session
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  // ---- pointer down -------------------------------------------------------

  function onPointerDown(e: CanvasPointerEvent) {
    const target = e.target as HTMLElement
    if (isInsideTextEditor(target)) return
    // Blurring commits any open text edit; preventDefault then stops focus/selection side effects.
    ;(document.activeElement as HTMLElement | null)?.blur?.()
    e.preventDefault()

    const camera = useViewportStore.getState().camera
    const screen = toLocal(e)
    const world = screenToWorld(screen, camera)
    const { tool } = useToolStore.getState()

    if (e.button === MOUSE_MIDDLE || e.button === MOUSE_RIGHT || tool === 'hand' || spaceHeld) {
      setPanning(true)
      begin(e, { type: 'pan', startScreen: screen, startCamera: camera })
      return
    }
    if (e.button !== MOUSE_LEFT) return

    if (registerPress(screen) && tool === 'select') {
      handleDoubleClick(target, world)
      return
    }

    if (tool === 'connector') {
      const snapshot = doc().shapes
      const start = connectorEndAt(snapshot, world, snapDistance())
      begin(e, { type: 'connect', startWorld: world, startScreen: screen, start, connectorId: null, snapshot })
      return
    }

    if (tool !== 'select') {
      begin(e, { type: 'create', shape: tool, startWorld: world, startScreen: screen, shapeId: null, snapshot: doc().shapes })
      return
    }

    const handle = handleAt(target)
    const transform = handle ? startTransform(handle, world) : null
    if (transform) {
      setInteracting(true)
      begin(e, transform)
      return
    }

    const id = shapeIdAt(target)
    if (id) {
      pressShape(e, id, screen, world)
      return
    }

    const selection = useSelectionStore.getState()
    if (!e.shiftKey) selection.clear()
    begin(e, { type: 'marquee', startWorld: world, baseSelection: e.shiftKey ? selection.selectedIds : [] })
  }

  function handleDoubleClick(target: HTMLElement, world: Vec) {
    const id = shapeIdAt(target)
    if (id) useEditingStore.getState().startEditing(id)
    else if (!handleAt(target)) placeShape('text', world)
  }

  function startTransform(handle: string, world: Vec): ResizeSession | RotateSession | EndpointSession | null {
    const selected = getSelectedShapes()
    const bounds = boundsOf(selected)
    if (!bounds) return null
    const single = selected.length === 1 ? selected[0] : null
    const common = { ids: new Set(selected.map((s) => s.id)), snapshot: doc().shapes }

    if (handle === 'start' || handle === 'end') {
      if (!single || !isConnector(single)) return null
      return { type: 'endpoint', connectorId: single.id, which: handle, snapshot: common.snapshot }
    }

    if (handle === 'rotate') {
      const center = centerOf(single ?? bounds)
      return {
        type: 'rotate',
        center,
        startAngle: angleBetween(center, world),
        baseRotation: toRadians(single?.rotation ?? 0),
        ...common,
      }
    }
    return { type: 'resize', handle: handle as ResizeHandle, startWorld: world, bounds, single, ...common }
  }

  /** Press on a shape: update the selection (Shift toggles) and get ready to move it. */
  function pressShape(e: CanvasPointerEvent, id: string, screen: Vec, world: Vec) {
    const { selectedIds, select } = useSelectionStore.getState()
    const isSelected = selectedIds.includes(id)
    let next = selectedIds
    if (e.shiftKey) next = isSelected ? selectedIds.filter((s) => s !== id) : [...selectedIds, id]
    else if (!isSelected) next = [id]
    select(next)
    if (!next.includes(id)) return
    begin(e, {
      type: 'move',
      startWorld: world,
      startScreen: screen,
      ids: new Set(next),
      snapshot: doc().shapes,
      started: false,
    })
  }

  // ---- pointer move -------------------------------------------------------

  function onPointerMove(e: CanvasPointerEvent) {
    const session = sessionRef.current
    if (!session) return
    const screen = toLocal(e)
    const world = screenToWorld(screen, useViewportStore.getState().camera)

    switch (session.type) {
      case 'pan':
        useViewportStore
          .getState()
          .setCamera(panCamera(session.startCamera, screen.x - session.startScreen.x, screen.y - session.startScreen.y))
        break
      case 'move':
        dragMove(session, screen, world)
        break
      case 'resize':
        dragResize(session, world, e.shiftKey)
        break
      case 'rotate':
        dragRotate(session, world, e.shiftKey)
        break
      case 'marquee':
        dragMarquee(session, world)
        break
      case 'create':
        dragCreate(session, screen, world)
        break
      case 'connect':
        dragConnect(session, screen, world)
        break
      case 'endpoint':
        dragEndpoint(session, world)
        break
    }
  }

  function dragMove(s: MoveSession, screen: Vec, world: Vec) {
    if (!s.started && dist(screen, s.startScreen) < MOVE_THRESHOLD) return
    s.started = true
    setInteracting(true)
    const dx = world.x - s.startWorld.x
    const dy = world.y - s.startWorld.y
    doc().update(() => translateShapes(s.snapshot, s.ids, dx, dy), false)
  }

  function dragResize(s: ResizeSession, world: Vec, keepAspect: boolean) {
    const delta = { x: world.x - s.startWorld.x, y: world.y - s.startWorld.y }
    doc().update(() => {
      if (s.single) return resizeShape(s.snapshot, s.single, s.handle, delta, keepAspect)
      const next = resizeBounds(s.bounds, s.handle, delta.x, delta.y, keepAspect)
      return scaleShapes(s.snapshot, s.ids, s.bounds, next)
    }, false)
  }

  function dragRotate(s: RotateSession, world: Vec, fineSnap: boolean) {
    const raw = s.baseRotation + angleBetween(s.center, world) - s.startAngle
    const delta = snapRotation(raw, fineSnap) - s.baseRotation
    doc().update(() => rotateShapes(s.snapshot, s.ids, s.center, delta), false)
  }

  function dragMarquee(s: MarqueeSession, world: Vec) {
    const rect = rectFromPoints(s.startWorld, world)
    setMarquee(rect)
    setInteracting(true)
    const hits = doc().shapes.filter((shape) => intersects(rect, shapeAABB(shape))).map((shape) => shape.id)
    useSelectionStore.getState().select([...new Set([...s.baseSelection, ...hits])])
  }

  function dragCreate(s: CreateSession, screen: Vec, world: Vec) {
    if (!s.shapeId && dist(screen, s.startScreen) < CREATE_THRESHOLD) return
    const isNew = !s.shapeId
    s.shapeId ??= crypto.randomUUID()
    const shape = createShape(s.shape, rectFromPoints(s.startWorld, world), colorFor(s.shape), s.shapeId)
    doc().update(() => [...s.snapshot, shape], false)
    if (isNew) {
      useSelectionStore.getState().select([shape.id])
      setInteracting(true)
    }
  }

  function dragConnect(s: ConnectSession, screen: Vec, world: Vec) {
    if (!s.connectorId && dist(screen, s.startScreen) < CREATE_THRESHOLD) return
    const isNew = !s.connectorId
    s.connectorId ??= crypto.randomUUID()
    const end = connectorEndAt(s.snapshot, world, snapDistance(), s.start.shapeId)
    const connector = createConnector(s.start, end, s.connectorId)
    doc().update(() => [...s.snapshot, connector], false)
    if (isNew) {
      useSelectionStore.getState().select([connector.id])
      setInteracting(true)
    }
  }

  function dragEndpoint(s: EndpointSession, world: Vec) {
    const connector = s.snapshot.find((shape) => shape.id === s.connectorId)
    const other = connector?.[s.which === 'start' ? 'end' : 'start']
    const end = connectorEndAt(s.snapshot, world, snapDistance(), other?.shapeId)
    setInteracting(true)
    doc().update(() => setConnectorEnd(s.snapshot, s.connectorId, s.which, end), false)
  }

  // ---- pointer up ---------------------------------------------------------

  function onPointerUp(e: CanvasPointerEvent) {
    const session = sessionRef.current
    if (!session) return
    sessionRef.current = null
    setInteracting(false)
    if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId)

    switch (session.type) {
      case 'pan':
        setPanning(false)
        break
      case 'move':
      case 'resize':
      case 'rotate':
        doc().checkpoint(session.snapshot)
        break
      case 'endpoint':
        doc().update((shapes) => pinConnectorEnds(shapes, session.connectorId), false)
        doc().checkpoint(session.snapshot)
        break
      case 'marquee':
        setMarquee(null)
        break
      case 'create':
        if (session.shapeId) {
          doc().checkpoint(session.snapshot)
          finishCreation(session.shapeId, session.shape)
        } else {
          placeShape(session.shape, session.startWorld)
        }
        break
      case 'connect':
        if (session.connectorId) {
          const id = session.connectorId
          doc().update((shapes) => pinConnectorEnds(shapes, id), false)
          doc().checkpoint(session.snapshot)
          finishCreation(session.connectorId, 'connector')
        }
        break
    }
  }

  return {
    marquee,
    panning,
    interacting,
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel: onPointerUp,
    },
  }
}
