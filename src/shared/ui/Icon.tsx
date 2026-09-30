import type { ReactNode } from 'react'

/** 24×24 line icons (stroke = currentColor). Add new icons here. */
const ICONS = {
  select: <path d="M5 3l14 8-6 1.5L10 19z" />,
  hand: (
    <path d="M8 12V5.5a1.5 1.5 0 013 0V11m0-6.5V4a1.5 1.5 0 013 0v7m0-5.5a1.5 1.5 0 013 0V12m0-3.5a1.5 1.5 0 013 0V15a6 6 0 01-6 6h-1.5a6 6 0 01-4.9-2.6L4.4 14a1.5 1.5 0 012.4-1.8L8 13.5" />
  ),
  text: <path d="M5 6V4h14v2M12 4v16M9 20h6" />,
  connector: <path d="M5 19L19 5M11 5h8v8" />,
  frame: <path d="M7 3v18M17 3v18M3 7h18M3 17h18" />,
  shapes: (
    <>
      <rect x="3" y="3" width="8" height="8" rx="1" />
      <circle cx="17" cy="7" r="4" />
      <path d="M7 14l4 7H3z" />
      <rect x="13" y="13" width="8" height="8" rx="4" />
    </>
  ),
  undo: (
    <>
      <path d="M9 14L4 9l5-5" />
      <path d="M4 9h10a6 6 0 010 12h-3" />
    </>
  ),
  redo: (
    <>
      <path d="M15 14l5-5-5-5" />
      <path d="M20 9H10a6 6 0 000 12h3" />
    </>
  ),
  bringToFront: (
    <>
      <rect x="8" y="8" width="12" height="12" rx="1" fill="currentColor" />
      <path d="M4 16V4h12" />
    </>
  ),
  sendToBack: (
    <>
      <rect x="8" y="8" width="12" height="12" rx="1" />
      <rect x="4" y="4" width="12" height="12" rx="1" fill="currentColor" />
    </>
  ),
  duplicate: (
    <>
      <rect x="8" y="8" width="12" height="12" rx="2" />
      <path d="M16 8V5a1 1 0 00-1-1H5a1 1 0 00-1 1v10a1 1 0 001 1h3" />
    </>
  ),
  trash: <path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />,
  trashFrame: (
    <>
      <path d="M4 7h16M6 7l1 13h10l1-13M9 7V4h6v3" />
      <rect x="9.5" y="11" width="5" height="5" rx="0.5" />
    </>
  ),
} satisfies Record<string, ReactNode>

export type IconName = keyof typeof ICONS

export function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {ICONS[name]}
    </svg>
  )
}
