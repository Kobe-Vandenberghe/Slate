import { useEffect, useState } from 'react'
import { isEditableTarget } from '../model/dom'

/** Tracks whether the space bar is held (temporary hand tool, like Figma/Miro). */
export function useSpaceHeld() {
  const [held, setHeld] = useState(false)

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== ' ' || isEditableTarget(e.target)) return
      e.preventDefault()
      setHeld(true)
    }
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === ' ') setHeld(false)
    }
    const release = () => setHeld(false)
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    window.addEventListener('blur', release)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      window.removeEventListener('blur', release)
    }
  }, [])

  return held
}
