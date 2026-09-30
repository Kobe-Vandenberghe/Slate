import { useEffect } from 'react'
import { DEFAULT_TITLE, useDocumentStore } from '../store/documentStore'

const MAX_LENGTH = 80

/** Inline-editable board name; mirrored into the browser tab title. */
export function BoardTitle() {
  const title = useDocumentStore((s) => s.board.title)
  const setTitle = useDocumentStore((s) => s.setTitle)

  useEffect(() => {
    document.title = `${title} – MiroClone`
  }, [title])

  return (
    <input
      className="board-title"
      value={title}
      maxLength={MAX_LENGTH}
      spellCheck={false}
      size={Math.max(title.length, 4)}
      aria-label="Board title"
      onChange={(e) => setTitle(e.target.value)}
      onBlur={() => setTitle(title.trim() || DEFAULT_TITLE)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === 'Escape') e.currentTarget.blur()
      }}
    />
  )
}
