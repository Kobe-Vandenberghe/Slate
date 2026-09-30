import { renameProperty, withProperty, withoutProperty } from '@/features/archdoc'
import type { Properties, PropertyValue, Vocabulary } from '@/features/archdoc'
import { editMeaning } from '../model/commands'
import { CommitInput } from './CommitInput'

type ValueType = 'text' | 'number' | 'boolean'

const typeOf = (v: PropertyValue): ValueType => (typeof v === 'number' ? 'number' : typeof v === 'boolean' ? 'boolean' : 'text')

function convert(value: PropertyValue, to: ValueType): PropertyValue {
  if (to === 'text') return String(value)
  if (to === 'boolean') return value === true || value === 'true' || (typeof value === 'number' && value !== 0)
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}

const numberProblem = (draft: string) => (draft.trim() !== '' && Number.isFinite(Number(draft)) ? null : 'Enter a number')

type PropertyListProps = { id: string; properties: Properties | undefined; vocabulary: Vocabulary }

/** Editable key-value tags: text, number or yes/no values, with autocomplete from the board's own vocabulary. */
export function PropertyList({ id, properties = {}, vocabulary }: PropertyListProps) {
  const keys = Object.keys(properties)
  const unusedKeys = vocabulary.keys.filter((k) => !keys.includes(k))
  const keyProblem = (current: string) => (draft: string) => {
    const key = draft.trim()
    if (!key) return current ? 'A key is required' : null
    return key !== current && keys.includes(key) ? 'Already set' : null
  }

  return (
    <div className="inspector-properties">
      {keys.map((key) => {
        const value = properties[key]
        const type = typeOf(value)
        return (
          <div key={key} className="inspector-property">
            <CommitInput
              label="Property key"
              value={key}
              options={unusedKeys}
              validate={keyProblem(key)}
              onCommit={(to) => editMeaning(id, (item) => renameProperty(item, key, to))}
            />
            {type === 'boolean' ? (
              <label className="inspector-check">
                <input
                  type="checkbox"
                  checked={value as boolean}
                  onChange={(e) => editMeaning(id, (item) => withProperty(item, key, e.target.checked))}
                />
                {value ? 'Yes' : 'No'}
              </label>
            ) : (
              <CommitInput
                label={`Value of ${key}`}
                value={String(value)}
                options={type === 'text' ? vocabulary.values[key] : undefined}
                inputMode={type === 'number' ? 'decimal' : 'text'}
                validate={type === 'number' ? numberProblem : undefined}
                onCommit={(v) => editMeaning(id, (item) => withProperty(item, key, type === 'number' ? Number(v) : v))}
              />
            )}
            <select
              aria-label={`Type of ${key}`}
              value={type}
              onChange={(e) => editMeaning(id, (item) => withProperty(item, key, convert(value, e.target.value as ValueType)))}
            >
              <option value="text">Text</option>
              <option value="number">Number</option>
              <option value="boolean">Yes/No</option>
            </select>
            <button
              className="inspector-remove"
              title={`Remove ${key}`}
              aria-label={`Remove ${key}`}
              onClick={() => editMeaning(id, (item) => withoutProperty(item, key))}
            >
              ×
            </button>
          </div>
        )
      })}
      <CommitInput
        key={keys.join('\n')}
        label="Add property"
        value=""
        placeholder="+ Add property"
        options={unusedKeys}
        validate={keyProblem('')}
        onCommit={(key) => editMeaning(id, (item) => withProperty(item, key.trim(), ''))}
      />
    </div>
  )
}
