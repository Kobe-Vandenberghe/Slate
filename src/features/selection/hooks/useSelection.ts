import { useMemo } from 'react'
import type { Connection } from '@/features/archdoc'
import { useDocumentStore } from '@/features/document'
import type { Diagram, Shape } from '@/features/shapes'
import { useSelectionStore } from '../store/selectionStore'

/** The selected elements and connections, in stacking order. Ids of deleted items are dropped. */
export type Selection = { ids: ReadonlySet<string>; elements: Shape[]; connections: Connection[] }

function pickSelected(d: Diagram, selectedIds: string[]): Selection {
  const wanted = new Set(selectedIds)
  const elements = d.elements.filter((e) => wanted.has(e.id))
  const connections = d.connections.filter((c) => wanted.has(c.id))
  return { ids: new Set([...elements, ...connections].map((x) => x.id)), elements, connections }
}

export function useSelection(): Selection {
  const diagram = useDocumentStore((s) => s.diagram)
  const ids = useSelectionStore((s) => s.selectedIds)
  return useMemo(() => pickSelected(diagram, ids), [diagram, ids])
}

/** Non-reactive read for event handlers and commands. */
export const getSelection = () =>
  pickSelected(useDocumentStore.getState().diagram, useSelectionStore.getState().selectedIds)
