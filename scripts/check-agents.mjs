// Keeps the agent docs honest: every feature is documented and indexed, skills and ADRs are well-formed.
import { existsSync, readFileSync, readdirSync } from 'node:fs'

const ROOT_DOC = 'AGENTS.md'
const ROOT_MAX_LINES = 150
const FEATURE_MAX_LINES = 80
const SKILL_MAX_LINES = 60
const FEATURE_HEADINGS = ['Owns', 'Public API', 'Depends on', 'Invariants', 'Gotchas', 'Tests']

const errors = []
const read = (path) => readFileSync(path, 'utf8')
const dirs = (path) =>
  existsSync(path) ? readdirSync(path, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name) : []
const lineCount = (text) => text.trimEnd().split('\n').length

// Root AGENTS.md
if (!existsSync(ROOT_DOC)) errors.push(`${ROOT_DOC} is missing`)
const root = existsSync(ROOT_DOC) ? read(ROOT_DOC) : ''
if (lineCount(root) > ROOT_MAX_LINES) errors.push(`${ROOT_DOC} has ${lineCount(root)} lines (max ${ROOT_MAX_LINES})`)

// Features
for (const feature of dirs('src/features')) {
  const dir = `src/features/${feature}`
  if (!existsSync(`${dir}/index.ts`)) errors.push(`${dir}: missing index.ts (public barrel)`)
  if (!root.includes(`src/features/${feature}`)) errors.push(`${ROOT_DOC}: feature index does not list ${dir}`)

  const doc = `${dir}/AGENTS.md`
  if (!existsSync(doc)) {
    errors.push(`${doc}: missing`)
    continue
  }
  const text = read(doc)
  for (const heading of FEATURE_HEADINGS) {
    if (!text.includes(`## ${heading}`)) errors.push(`${doc}: missing "## ${heading}" section`)
  }
  if (lineCount(text) > FEATURE_MAX_LINES) errors.push(`${doc}: ${lineCount(text)} lines (max ${FEATURE_MAX_LINES})`)
}

// Skills: .agents/skills/<name>/SKILL.md with front matter `name` matching the folder + a description
for (const skill of dirs('.agents/skills')) {
  const file = `.agents/skills/${skill}/SKILL.md`
  if (!existsSync(file)) {
    errors.push(`${file}: missing`)
    continue
  }
  const text = read(file)
  const front = text.match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1] ?? ''
  if (!new RegExp(`^name:\\s*${skill}\\s*$`, 'm').test(front)) errors.push(`${file}: front matter "name" must be ${skill}`)
  if (!/^description:\s*\S/m.test(front)) errors.push(`${file}: front matter needs a description`)
  if (lineCount(text) > SKILL_MAX_LINES) errors.push(`${file}: ${lineCount(text)} lines (max ${SKILL_MAX_LINES})`)
  if (!root.includes(skill)) errors.push(`${ROOT_DOC}: skills index does not mention ${skill}`)
}

// ADRs: every NNNN-*.md is listed in docs/adr/README.md
const adrIndex = existsSync('docs/adr/README.md') ? read('docs/adr/README.md') : ''
for (const file of existsSync('docs/adr') ? readdirSync('docs/adr') : []) {
  if (/^\d{4}-.+\.md$/.test(file) && !adrIndex.includes(file)) errors.push(`docs/adr/README.md: index does not list ${file}`)
}

if (errors.length) {
  console.error(`check:agents found ${errors.length} problem(s):\n  - ${errors.join('\n  - ')}`)
  process.exit(1)
}
console.log('check:agents OK')
