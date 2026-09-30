# MiroClone

A Miro-style infinite whiteboard built from scratch with React 19, TypeScript, Vite and Zustand.

```bash
npm install
npm run dev       # http://localhost:5173
npm run verify    # typecheck + lint + tests + architecture rules + docs check
```

**Features:** infinite canvas (pan/zoom), diagram shapes and sticky notes (click or drag from the library),
text boxes and in-shape labels, move/resize/rotate with snapping, context toolbar (colors, duplicate, order,
delete), undo/redo, copy/paste, an editable board title and automatic local save.

## Where to look

- **[AGENTS.md](AGENTS.md)**: the index for humans and coding agents (commands, rules, feature map).
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md): how the pieces fit together.
- [docs/adr/](docs/adr/README.md): why things are built this way.
- `src/features/<feature>/AGENTS.md`: the rules for each feature.
