import { create } from 'zustand'
import { DEFAULT_STICKY_COLOR } from '@/features/shapes'
import type { PaletteColor } from '@/features/shapes'
import type { Tool } from '../model/tools'

type ToolState = {
  tool: Tool
  /** Color used for the next sticky note. */
  stickyColor: PaletteColor
  setTool: (tool: Tool) => void
  /** Choose a sticky color and arm the sticky tool. */
  pickStickyColor: (color: PaletteColor) => void
}

export const useToolStore = create<ToolState>()((set) => ({
  tool: 'select',
  stickyColor: DEFAULT_STICKY_COLOR,
  setTool: (tool) => set({ tool }),
  pickStickyColor: (color) => set({ stickyColor: color, tool: 'sticky' }),
}))
