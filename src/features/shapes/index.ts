/**
 * shapes — the Shape data model, the catalog/palette, pure shape operations and shape rendering.
 * Stateless: no stores live here. See ./AGENTS.md.
 */

// Types
export type { CatalogItem } from './model/catalog'
export type { ConnectorEnd, PaletteColor, ResizeHandle, Shape, ShapeKind } from './model/types'
export type { ConnectorEndName } from './model/connectors'

// Catalog & palette
export { SHAPE_CATALOG, defaultSize, isShapeKind, opensEditorOnCreate } from './model/catalog'
export {
  DEFAULT_SHAPE_COLOR,
  DEFAULT_STICKY_COLOR,
  SHAPE_COLORS,
  STICKY_COLORS,
  findStickyColor,
} from './model/palette'

// Creation
export { cloneShapes, createShape, placementBounds } from './model/shapeFactory'

// Pure list operations (return the same array when nothing changed)
export {
  recolorShapes,
  removeShapes,
  reorderShapes,
  resizeShape,
  rotateShapes,
  scaleShapes,
  setShapeHeight,
  setShapeText,
  translateShapes,
} from './model/shapeOps'

// Connectors (arrows)
export {
  boundaryPoint,
  connectorEndAt,
  createConnector,
  isConnector,
  pinConnectorEnds,
  setConnectorEnd,
  syncConnectors,
} from './model/connectors'

// Geometry
export { boundsOf, shapeAABB } from './model/shapeBounds'
export { resizeBounds, resizeRotated, snapRotation } from './model/transform'

// Rendering
export { ConnectorView } from './components/ConnectorView'
export { ShapeGeometry } from './components/ShapeGeometry'
export { ShapePreview } from './components/ShapePreview'
export { ShapeView } from './components/ShapeView'
