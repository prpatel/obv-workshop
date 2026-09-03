import { defineConfig } from 'vitest/config'

// Pure StepFlow modules (geometry, palettes, icons) live under
// decks/stepflow-demo/components/stepflow/ — tests land alongside them.
export default defineConfig({
  test: {
    include: ['decks/stepflow-demo/**/*.{spec,test}.ts'],
    // Scaffold PR: unit tests arrive with the component PRs; keep `npm test` green meanwhile.
    passWithNoTests: true,
  },
})
