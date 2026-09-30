import { useEffect, useRef, useState } from 'react'
import './text-editing.css'

type TextEditorProps = {
  initialText: string
  onCommit: (text: string) => void
}

/**
 * In-place plain-text editor for a shape's label. Selects all on open, commits on blur.
 * Escape or Ctrl/⌘+Enter finishes; plain Enter inserts a newline. Tagged `data-text-editor`
 * so canvas pointer handlers ignore presses inside it.
 */
export function TextEditor({ initialText, onCommit }: TextEditorProps) {
  const ref = useRef<HTMLDivElement>(null)
  // Captured once: the editor is uncontrolled so React never fights the caret.
  const [startText] = useState(initialText)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.innerText = startText
    el.focus()
    const range = document.createRange()
    range.selectNodeContents(el)
    const selection = window.getSelection()
    selection?.removeAllRanges()
    selection?.addRange(range)
  }, [startText])

  return (
    <div
      ref={ref}
      className="shape-editor"
      data-text-editor
      contentEditable="plaintext-only"
      suppressContentEditableWarning
      spellCheck={false}
      onBlur={(e) => onCommit(e.currentTarget.innerText.replace(/\n$/, ''))}
      onPointerDown={(e) => e.stopPropagation()}
      onKeyDown={(e) => {
        e.stopPropagation()
        if (e.key === 'Escape' || (e.key === 'Enter' && (e.ctrlKey || e.metaKey))) {
          e.currentTarget.blur()
        }
      }}
    />
  )
}
