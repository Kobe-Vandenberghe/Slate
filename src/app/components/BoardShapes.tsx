import { useDocumentStore } from '@/features/document'
import { ConnectorView, ShapeView, isConnector } from '@/features/shapes'
import { TextEditor, syncMeasuredHeight, useEditingStore } from '@/features/text-editing'

/** Renders every shape in stacking order, swapping in the text editor for the shape being edited. */
export function BoardShapes() {
  const shapes = useDocumentStore((s) => s.shapes)
  const editingId = useEditingStore((s) => s.editingId)
  const commitText = useEditingStore((s) => s.commitText)

  return shapes.map((shape) =>
    isConnector(shape) ? (
      <ConnectorView key={shape.id} shape={shape} />
    ) : (
      <ShapeView
        key={shape.id}
        shape={shape}
        onMeasureHeight={syncMeasuredHeight}
        editor={
          shape.id === editingId ? (
            <TextEditor initialText={shape.text} onCommit={(text) => commitText(shape.id, text)} />
          ) : undefined
        }
      />
    ),
  )
}
