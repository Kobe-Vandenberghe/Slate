import { useDocumentStore } from '@/features/document'
import { ConnectionView, FrameView, ShapeView, connectionPaths, isFrame, worldElements } from '@/features/shapes'
import { TextEditor, syncMeasuredHeight, useEditingStore } from '@/features/text-editing'

/**
 * Renders every element in world coordinates and draw order (each frame followed by its children), then every
 * connection above them, swapping in the text editor for the element being edited.
 */
export function BoardShapes() {
  const diagram = useDocumentStore((s) => s.diagram)
  const editingId = useEditingStore((s) => s.editingId)
  const commitText = useEditingStore((s) => s.commitText)
  const paths = connectionPaths(diagram)

  return (
    <>
      {worldElements(diagram).ordered.map((shape) => {
        const editor =
          shape.id === editingId ? (
            <TextEditor initialText={shape.text} onCommit={(text) => commitText(shape.id, text)} />
          ) : undefined
        return isFrame(shape) ? (
          <FrameView key={shape.id} frame={shape} editor={editor} />
        ) : (
          <ShapeView key={shape.id} shape={shape} onMeasureHeight={syncMeasuredHeight} editor={editor} />
        )
      })}
      {diagram.connections.map((c) => (
        <ConnectionView key={c.id} connection={c} path={paths.get(c.id)!} />
      ))}
    </>
  )
}
