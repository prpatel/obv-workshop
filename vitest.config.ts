import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'

// Pure StepFlow modules (geometry, palettes, icons) live under
// decks/stepflow-demo/components/stepflow/ — tests land alongside them.
// The Vue plugin compiles StepFlow.vue for the component render test.
export default defineConfig({
  plugins: [vue()],
  test: {
    include: ['decks/stepflow-demo/**/*.{spec,test}.ts'],
    // Process SFC <style> blocks so the component test can assert the shipped CSS.
    css: true,
    passWithNoTests: true,
  },
})
