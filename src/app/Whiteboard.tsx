import { useState } from 'react'
import { ContextToolbar, zoomToContent } from '@/features/editor'
import { TopBar } from '@/features/document'
import { cursorFor, useKeyboardShortcuts, usePointerInteractions, useSpaceHeld } from '@/features/interaction'
import { MarqueeBox, SelectionOverlay, useSelectedShapes } from '@/features/selection'
import { ShapeLibrary, useShapeDrop } from '@/features/shape-library'
import { useEditingStore } from '@/features/text-editing'
import { Toolbar, useToolStore } from '@/features/tools'
import { Canvas, ZoomControls, useViewportStore } from '@/features/viewport'
import { BoardShapes } from './components/BoardShapes'
import { ShortcutHint } from './components/ShortcutHint'
import './app.css'

/** Composition root: wires input hooks to the canvas and lays out the UI panels. */
export function Whiteboard() {
  const spaceHeld = useSpaceHeld()
  const pointer = usePointerInteractions(spaceHeld)
  const drop = useShapeDrop()
  useKeyboardShortcuts()

  const [libraryOpen, setLibraryOpen] = useState(true)
  const tool = useToolStore((s) => s.tool)
  const editingId = useEditingStore((s) => s.editingId)
  const zoom = useViewportStore((s) => s.camera.z)
  const selectedShapes = useSelectedShapes()

  return (
    <>
      <Canvas
        cursor={cursorFor(tool, spaceHeld, pointer.panning)}
        selectMode={tool === 'select' && !spaceHeld}
        handlers={{ ...pointer.handlers, ...drop }}
      >
        <BoardShapes />
        <SelectionOverlay shapes={selectedShapes} zoom={zoom} showHandles={!editingId} />
        {pointer.marquee && <MarqueeBox bounds={pointer.marquee} zoom={zoom} />}
      </Canvas>

      <TopBar />
      <Toolbar libraryOpen={libraryOpen} onToggleLibrary={() => setLibraryOpen((open) => !open)} />
      {libraryOpen && <ShapeLibrary />}
      <ContextToolbar hidden={pointer.interacting} />
      <ZoomControls onFit={zoomToContent} />
      <ShortcutHint />
    </>
  )
}
