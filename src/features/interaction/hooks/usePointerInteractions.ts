import { useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import { useDocumentStore } from '@/features/document'
import { colorFor, finishCreation, placeShape } from '@/features/editor'
import { getSelection, useSelectionStore } from '@/features/selection'
import {
  connectionEndAt,
  createConnection,
  createShape,
  diagramBounds,
  endElement,
  idsInRect,
  mapElements,
  pinConnectionEnds,
  resizeBounds,
  resizeShape,
  rotateDiagram,
  scaleDiagram,
  setConnectionEnd,
  snapRotation,
  translateDiagram,
} from '@/features/shapes'
import type { ResizeHandle } from '@/features/shapes'
import { useEditingStore } from '@/features/text-editing'
import { useToolStore } from '@/features/tools'
import { panCamera, screenToWorld, useViewportStore } from '@/features/viewport'
import { angleBetween, centerOf, dist, rectFromPoints, toRadians } from '@/shared/math'
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
      const snapshot = doc().diagram
      const from = connectionEndAt(snapshot.elements, world, snapDistance())
      begin(e, { type: 'connect', startWorld: world, startScreen: screen, from, connectionId: null, snapshot })
      return
    }

    if (tool !== 'select') {
      begin(e, { type: 'create', shape: tool, startWorld: world, startScreen: screen, shapeId: null, snapshot: doc().diagram })
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
    const snapshot = doc().diagram
    const { ids, elements, connections } = getSelection()
    const bounds = diagramBounds(snapshot, ids)
    if (!bounds) return null
    const single = ids.size === 1 && elements.length === 1 ? elements[0] : null
    const common = { ids, snapshot }

    if (handle === 'from' || handle === 'to') {
      if (ids.size !== 1 || connections.length !== 1) return null
      return { type: 'endpoint', connectionId: connections[0].id, which: handle, snapshot }
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
      snapshot: doc().diagram,
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
    doc().update(() => translateDiagram(s.snapshot, s.ids, dx, dy), false)
  }

  function dragResize(s: ResizeSession, world: Vec, keepAspect: boolean) {
    const delta = { x: world.x - s.startWorld.x, y: world.y - s.startWorld.y }
    doc().update(() => {
      const { single } = s
      if (single) return mapElements(s.snapshot, (elements) => resizeShape(elements, single, s.handle, delta, keepAspect))
      const next = resizeBounds(s.bounds, s.handle, delta.x, delta.y, keepAspect)
      return scaleDiagram(s.snapshot, s.ids, s.bounds, next)
    }, false)
  }

  function dragRotate(s: RotateSession, world: Vec, fineSnap: boolean) {
    const raw = s.baseRotation + angleBetween(s.center, world) - s.startAngle
    const delta = snapRotation(raw, fineSnap) - s.baseRotation
    doc().update(() => rotateDiagram(s.snapshot, s.ids, s.center, delta), false)
  }

  function dragMarquee(s: MarqueeSession, world: Vec) {
    const rect = rectFromPoints(s.startWorld, world)
    setMarquee(rect)
    setInteracting(true)
    const hits = idsInRect(doc().diagram, rect)
    useSelectionStore.getState().select([...new Set([...s.baseSelection, ...hits])])
  }

  function dragCreate(s: CreateSession, screen: Vec, world: Vec) {
    if (!s.shapeId && dist(screen, s.startScreen) < CREATE_THRESHOLD) return
    const isNew = !s.shapeId
    s.shapeId ??= crypto.randomUUID()
    const shape = createShape(s.shape, rectFromPoints(s.startWorld, world), colorFor(s.shape), s.shapeId)
    doc().update(() => ({ ...s.snapshot, elements: [...s.snapshot.elements, shape] }), false)
    if (isNew) {
      useSelectionStore.getState().select([shape.id])
      setInteracting(true)
    }
  }

  function dragConnect(s: ConnectSession, screen: Vec, world: Vec) {
    if (!s.connectionId && dist(screen, s.startScreen) < CREATE_THRESHOLD) return
    const isNew = !s.connectionId
    s.connectionId ??= crypto.randomUUID()
    const to = connectionEndAt(s.snapshot.elements, world, snapDistance(), endElement(s.from))
    const connection = createConnection(s.from, to, s.connectionId)
    doc().update(() => ({ ...s.snapshot, connections: [...s.snapshot.connections, connection] }), false)
    if (isNew) {
      useSelectionStore.getState().select([connection.id])
      setInteracting(true)
    }
  }

  function dragEndpoint(s: EndpointSession, world: Vec) {
    const connection = s.snapshot.connections.find((c) => c.id === s.connectionId)
    const other = connection?.[s.which === 'from' ? 'to' : 'from']
    const end = connectionEndAt(s.snapshot.elements, world, snapDistance(), other && endElement(other))
    setInteracting(true)
    doc().update(() => setConnectionEnd(s.snapshot, s.connectionId, s.which, end), false)
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
        doc().update((d) => pinConnectionEnds(d, session.connectionId), false)
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
        if (session.connectionId) {
          const id = session.connectionId
          doc().update((d) => pinConnectionEnds(d, id), false)
          doc().checkpoint(session.snapshot)
          finishCreation(id)
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
