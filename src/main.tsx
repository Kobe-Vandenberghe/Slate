import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Whiteboard } from '@/app/Whiteboard'
import '@/shared/styles/tokens.css'
import '@/shared/styles/global.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Whiteboard />
  </StrictMode>,
)
