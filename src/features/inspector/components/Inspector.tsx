import { useMemo } from 'react'
import type { ReactNode } from 'react'
import { collectVocabulary, slugify, withAlias, withKind, withLabel } from '@/features/archdoc'
import { useDocumentStore } from '@/features/document'
import { SHAPE_CATALOG } from '@/features/shapes'
import { useSelection } from '@/features/selection'
import { aliasProblem } from '../model/alias'
import { editMeaning } from '../model/commands'
import { CommitInput } from './CommitInput'
import { PropertyList } from './PropertyList'
import './inspector.css'

/** How many of the board's most used kinds are offered as one-click chips. */
const KIND_CHIPS = 4

const shapeLabel = (shape: string) =>
  SHAPE_CATALOG.find((c) => c.shape === shape)?.label ?? shape.charAt(0).toUpperCase() + shape.slice(1)

/**
 * Right-hand panel for the meaning of the single selected item: kind, alias and properties for an element,
 * label and properties for a connection. Every field commits as one undo step. Hidden during gestures.
 */
export function Inspector({ hidden }: { hidden: boolean }) {
  const diagram = useDocumentStore((s) => s.diagram)
  const { ids, elements, connections } = useSelection()
  const vocabulary = useMemo(() => collectVocabulary([...diagram.elements, ...diagram.connections]), [diagram])
  if (hidden || ids.size !== 1) return null

  const element = elements[0]
  const connection = connections[0]
  const item = element ?? connection
  const suggestedAlias = element ? slugify(element.text) : ''

  return (
    <aside className="inspector panel" aria-label="Inspector">
      <div className="inspector-title">{element ? shapeLabel(element.shape) : 'Connection'}</div>

      {element && (
        <>
          <Field label="Kind">
            <CommitInput
              label="Kind"
              value={element.kind ?? ''}
              placeholder="e.g. service"
              options={vocabulary.kinds}
              onCommit={(kind) => editMeaning(item.id, (x) => withKind(x, kind))}
            />
            {!element.kind && (
              <div className="inspector-chips">
                {vocabulary.kinds.slice(0, KIND_CHIPS).map((kind) => (
                  <button key={kind} className="inspector-chip" onClick={() => editMeaning(item.id, (x) => withKind(x, kind))}>
                    {kind}
                  </button>
                ))}
              </div>
            )}
          </Field>
          <Field label="Alias">
            <CommitInput
              label="Alias"
              value={element.alias ?? ''}
              placeholder={suggestedAlias || 'e.g. orders-api'}
              validate={(draft) => aliasProblem(diagram.elements, element.id, draft)}
              onCommit={(alias) => editMeaning(item.id, (x) => withAlias(x, alias))}
            />
            {!element.alias && suggestedAlias && !aliasProblem(diagram.elements, element.id, suggestedAlias) && (
              <button className="inspector-chip" onClick={() => editMeaning(item.id, (x) => withAlias(x, suggestedAlias))}>
                Use “{suggestedAlias}”
              </button>
            )}
          </Field>
        </>
      )}

      {connection && (
        <Field label="Label">
          <CommitInput
            label="Label"
            value={connection.label ?? ''}
            placeholder="e.g. reads/writes"
            onCommit={(label) => editMeaning(item.id, (x) => withLabel(x, label))}
          />
        </Field>
      )}

      <Field label="Properties">
        <PropertyList id={item.id} properties={item.properties} vocabulary={vocabulary} />
      </Field>
    </aside>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <section className="inspector-field">
      <h3 className="inspector-heading">{label}</h3>
      {children}
    </section>
  )
}
