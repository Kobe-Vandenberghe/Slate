export type Swatch = { name: string; fill: string; stroke: string }

type ColorSwatchesProps<T extends Swatch> = {
  colors: T[]
  onPick: (color: T) => void
}

/** Round color buttons (fill = background, stroke = ring). */
export function ColorSwatches<T extends Swatch>({ colors, onPick }: ColorSwatchesProps<T>) {
  return colors.map((color) => (
    <button
      key={color.name}
      className="swatch"
      title={color.name}
      aria-label={color.name}
      style={{ background: color.fill, borderColor: color.stroke }}
      onClick={() => onPick(color)}
    />
  ))
}
