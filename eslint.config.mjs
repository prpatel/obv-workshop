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
)
