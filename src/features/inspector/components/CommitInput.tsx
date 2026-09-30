import { useId, useRef, useState } from 'react'

type CommitInputProps = {
  value: string
  onCommit: (value: string) => void
  label: string
  placeholder?: string
  /** Autocomplete options (rendered as a `<datalist>`). */
  options?: string[]
  /** Returns an error message to show; invalid drafts are never committed. */
  validate?: (draft: string) => string | null
  inputMode?: 'text' | 'decimal'
}

/**
 * A text field that edits a draft and commits it on blur or Enter (one undo step per commit); Escape reverts.
 * Remounts when `value` changes from outside (e.g. undo), so the draft never goes stale.
 */
export function CommitInput(props: CommitInputProps) {
  return <DraftInput key={props.value} {...props} />
}

function DraftInput({ value, onCommit, label, placeholder, options, validate, inputMode }: CommitInputProps) {
  const [draft, setDraft] = useState(value)
  // Escape resets the draft and blurs; the blur handler still sees the old draft, so skip it once.
  const skipCommit = useRef(false)
  const listId = useId()
  const error = validate?.(draft) ?? null

  function commit() {
    if (skipCommit.current) {
      skipCommit.current = false
      return
    }
    if (error) setDraft(value)
    else if (draft !== value) onCommit(draft)
  }

  return (
    <div className="inspector-input">
      <input
        value={draft}
        aria-label={label}
        aria-invalid={!!error}
        placeholder={placeholder}
        inputMode={inputMode}
        list={options?.length ? listId : undefined}
        spellCheck={false}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') e.currentTarget.blur()
          if (e.key === 'Escape') {
            skipCommit.current = true
            setDraft(value)
            e.currentTarget.blur()
          }
        }}
      />
      {!!options?.length && (
        <datalist id={listId}>
          {options.map((o) => (
            <option key={o} value={o} />
          ))}
        </datalist>
      )}
      {error && <div className="inspector-error">{error}</div>}
    </div>
  )
}
