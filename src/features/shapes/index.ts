/**
 * shapes — the element (Shape) and connection geometry, the catalog/palette, pure element and diagram operations,
 * and rendering. Stateless: no stores live here. See ./AGENTS.md.
 */

// Types
export type { CatalogItem } from './model/catalog'
export type { Diagram, PaletteColor, ResizeHandle, Shape, ShapeType } from './model/types'
export type { ConnectionEndName, ConnectionPath } from './model/connections'

// Catalog & palette
export { SHAPE_CATALOG, defaultSize, isShapeType, opensEditorOnCreate } from './model/catalog'
export {
  DEFAULT_SHAPE_COLOR,
  DEFAULT_STICKY_COLOR,
  SHAPE_COLORS,
  STICKY_COLORS,
  connectionColor,
  findStickyColor,
  shapeColors,
} from './model/palette'

// Creation
export { createShape, placementBounds } from './model/shapeFactory'

// Pure element-list operations (return the same array when nothing changed)
export { resizeShape, setShapeHeight, setShapeText } from './model/shapeOps'

// Pure diagram operations (elements + connections; return the same diagram when nothing changed)
export {
  EMPTY_DIAGRAM,
  cloneDiagram,
  diagramBounds,
  editItem,
  extractSelection,
  idsInRect,
  mapElements,
  recolorDiagram,
  removeFromDiagram,
  reorderDiagram,
  rotateDiagram,
  scaleDiagram,
  translateDiagram,
} from './model/diagram'

// Connections (arrows)
export {
  boundaryPoint,
  connectionEndAt,
  connectionPath,
  connectionPaths,
  createConnection,
  endElement,
  pinConnectionEnds,
  setConnectionEnd,
} from './model/connections'

// Geometry
export { boundsOf, shapeAABB } from './model/shapeBounds'
export { resizeBounds, resizeRotated, snapRotation } from './model/transform'

// Rendering
export { ConnectionView } from './components/ConnectionView'
export { ShapeGeometry } from './components/ShapeGeometry'
export { ShapePreview } from './components/ShapePreview'
export { ShapeView } from './components/ShapeView'
