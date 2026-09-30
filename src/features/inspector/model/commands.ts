import { useDocumentStore } from '@/features/document'
import { editItem } from '@/features/shapes'

type MeaningEdit = Parameters<typeof editItem>[2]

/** Applies one meaning edit to an element or connection as a single undo step (a no-op records nothing). */
export const editMeaning = (id: string, fn: MeaningEdit) =>
  useDocumentStore.getState().update((d) => editItem(d, id, fn))
