import { useDocumentStore } from '@/features/document'
import { ConnectionView, ShapeView, connectionPaths } from '@/features/shapes'
import { TextEditor, syncMeasuredHeight, useEditingStore } from '@/features/text-editing'

/** Renders every element in stacking order, then every connection above them, swapping in the text editor. */
export function BoardShapes() {
  const diagram = useDocumentStore((s) => s.diagram)
  const editingId = useEditingStore((s) => s.editingId)
  const commitText = useEditingStore((s) => s.commitText)
  const paths = connectionPaths(diagram)

  return (
    <>
      {diagram.elements.map((shape) => (
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
      ))}
      {diagram.connections.map((c) => (
        <ConnectionView key={c.id} connection={c} path={paths.get(c.id)!} />
      ))}
    </>
  )
}
