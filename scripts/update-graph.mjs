// Regenerates the module dependency graph inside docs/ARCHITECTURE.md (between the graph markers).
import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'

const DOC = 'docs/ARCHITECTURE.md'
const START = '<!-- graph:start -->'
const END = '<!-- graph:end -->'

const mermaid = execFileSync(
  process.execPath,
  [
    'node_modules/dependency-cruiser/bin/dependency-cruiser.mjs',
    'src',
    '--config', '.dependency-cruiser.cjs',
    '--include-only', '^src',
    '--collapse', '^src/(features|shared)/[^/]+|^src/app',
    '--exclude', '\\.test\\.ts$|\\.css$|^src/main\\.tsx$',
    '--output-type', 'mermaid',
  ],
  { encoding: 'utf8' },
).trim()

const doc = readFileSync(DOC, 'utf8')
const start = doc.indexOf(START)
const end = doc.indexOf(END)
if (start === -1 || end === -1) {
  console.error(`${DOC} is missing the ${START} / ${END} markers.`)
  process.exit(1)
}

const block = `${START}\n\n\`\`\`mermaid\n${mermaid}\n\`\`\`\n\n${END}`
writeFileSync(DOC, doc.slice(0, start) + block + doc.slice(end + END.length))
console.log(`Updated dependency graph in ${DOC}`)
