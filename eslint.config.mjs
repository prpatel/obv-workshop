// Flat ESLint config — @eslint/js base + typescript-eslint for *.ts (StepFlow pure modules).
import js from '@eslint/js'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  {
    // Build outputs and manual PDF exports are generated, never authored.
    ignores: ['**/dist/**', '**/export/**'],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    // Node runtime for repo scripts — flat config has no built-in env, and
    // no-undef (js.recommended) applies to plain .mjs files.
    files: ['scripts/**/*.mjs'],
    languageOptions: {
      globals: {
        AbortSignal: 'readonly',
        clearTimeout: 'readonly',
        console: 'readonly',
        fetch: 'readonly',
        process: 'readonly',
        setTimeout: 'readonly',
      },
    },
  },
)
