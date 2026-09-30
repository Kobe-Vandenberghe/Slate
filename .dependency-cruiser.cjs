/**
 * Architecture rules (docs/ARCHITECTURE.md, docs/adr/0006-feature-sliced-structure.md).
 * Run: npm run deps   ·   Graph: npm run graph
 */
module.exports = {
  forbidden: [
    {
      name: 'no-circular',
      severity: 'error',
      comment: 'Circular dependencies make load order and ownership ambiguous.',
      from: {},
      to: { circular: true },
    },
    {
      name: 'shared-is-a-leaf',
      severity: 'error',
      comment: 'src/shared must not know about features or the app.',
      from: { path: '^src/shared/' },
      to: { path: '^src/(features|app)/' },
    },
    {
      name: 'features-do-not-import-app',
      severity: 'error',
      from: { path: '^src/features/' },
      to: { path: '^src/app/' },
    },
    {
      name: 'feature-public-api-only',
      severity: 'error',
      comment: 'Another feature may only be imported through its index.ts.',
      from: { path: '^src/features/([^/]+)/' },
      to: {
        path: '^src/features/[^/]+/',
        pathNot: ['^src/features/$1/', '^src/features/[^/]+/index\\.ts$'],
      },
    },
    {
      name: 'app-uses-public-api-only',
      severity: 'error',
      comment: 'The app shell composes features through their index.ts only.',
      from: { path: '^src/app/' },
      to: { path: '^src/features/[^/]+/', pathNot: '^src/features/[^/]+/index\\.ts$' },
    },
    {
      name: 'no-imports-from-tests',
      severity: 'error',
      from: { pathNot: '\\.test\\.tsx?$' },
      to: { path: '\\.test\\.tsx?$' },
    },
  ],
  options: {
    doNotFollow: { path: 'node_modules' },
    exclude: { path: '\\.css$' },
    tsPreCompilationDeps: true,
    tsConfig: { fileName: 'tsconfig.app.json' },
    enhancedResolveOptions: {
      exportsFields: ['exports'],
      conditionNames: ['import', 'require', 'node', 'default', 'types'],
      extensions: ['.ts', '.tsx', '.js', '.mjs'],
    },
  },
}
