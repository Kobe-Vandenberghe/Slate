import { ShapeGrid } from './ShapeGrid'
import { StickyNotePicker } from './StickyNotePicker'
import './shape-library.css'

/** Side panel listing everything that can be placed on the board. */
export function ShapeLibrary() {
  return (
    <div className="shape-library panel">
      <h2 className="library-heading">Sticky notes</h2>
      <StickyNotePicker />
      <h2 className="library-heading">Shapes</h2>
      <ShapeGrid />
    </div>
  )
}
