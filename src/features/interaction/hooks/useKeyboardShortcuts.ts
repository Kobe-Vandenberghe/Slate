import { useEffect } from 'react'
import { exportBoard, useDocumentStore } from '@/features/document'
import {
  copySelection,
  deleteSelection,
  deleteSelectionWithContents,
  duplicateSelection,
  paste,
  reorderSelection,
  selectAll,
  zoomToContent,
} from '@/features/editor'
import { getSelection, useSelectionStore } from '@/features/selection'
import { useEditingStore } from '@/features/text-editing'
import { TOOL_SHORTCUTS, useToolStore } from '@/features/tools'
import { useViewportStore } from '@/features/viewport'
import { isEditableTarget } from '../model/dom'

const ZOOM_STEP = 1.25

/** Ctrl/⌘ + key commands. */
function modifiedCommand(key: string, shift: boolean): (() => void) | undefined {
  const { undo, redo } = useDocumentStore.getState()
  const viewport = useViewportStore.getState()
  const commands: Record<string, () => void> = {
    z: shift ? redo : undo,
    y: redo,
    a: selectAll,
    d: duplicateSelection,
    c: copySelection,
    v: paste,
    s: exportBoard,
    '=': () => viewport.zoomBy(ZOOM_STEP),
    '+': () => viewport.zoomBy(ZOOM_STEP),
    '-': () => viewport.zoomBy(1 / ZOOM_STEP),
    '0': viewport.resetZoom,
  }
  return commands[key]
}

/**
 * Global keyboard shortcuts (ignored while typing in inputs/text editors):
 * - Ctrl/⌘: Z undo, Shift+Z / Y redo, A select all, C/V copy/paste, D duplicate, S save as .slate.json, +/−/0 zoom
 * - Delete/Backspace delete (Shift: frames with their contents), Enter edit text, Escape deselect, ] / [ front/back, Shift+1 fit
 * - Tool keys from `TOOL_SHORTCUTS`. Space-to-pan lives in `useSpaceHeld`.
 */
export function useKeyboardShortcuts() {
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (isEditableTarget(e.target)) return
      const key = e.key.toLowerCase()

      if (e.ctrlKey || e.metaKey) {
        const command = modifiedCommand(key, e.shiftKey)
        // Leave native copy alone when nothing on the board is selected.
        if (!command || (key === 'c' && !getSelection().ids.size)) return
        e.preventDefault()
        command()
        return
      }

      switch (e.key) {
        case 'Delete':
        case 'Backspace':
          e.preventDefault()
          if (e.shiftKey) deleteSelectionWithContents()
          else deleteSelection()
          return
        case 'Escape':
          useSelectionStore.getState().clear()
          useToolStore.getState().setTool('select')
          return
        case 'Enter': {
          const { ids, elements } = getSelection()
          if (ids.size !== 1 || elements.length !== 1) return
          e.preventDefault()
          useEditingStore.getState().startEditing(elements[0].id)
          return
        }
        case ']':
          reorderSelection(true)
          return
        case '[':
          reorderSelection(false)
          return
      }

      if (e.shiftKey && e.code === 'Digit1') zoomToContent()
      else if (TOOL_SHORTCUTS[key] && !e.altKey && !e.shiftKey) useToolStore.getState().setTool(TOOL_SHORTCUTS[key])
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])
}
