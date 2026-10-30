import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import jsxA11y from 'eslint-plugin-jsx-a11y'

export default [
  { ignores: ['dist'] },
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      'jsx-a11y': jsxA11y,
    },
    rules: {
      // Regras base do ESLint (mantidas do Vite)
      ...js.configs.recommended.rules,
      // Regras de hooks do React (mantidas)
      ...reactHooks.configs.recommended.rules,
      // Regras recomendadas de acessibilidade jsx-a11y (NOVO)
      ...jsxA11y.flatConfigs.recommended.rules,
      // Regra de hot-reload do Vite (mantida)
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
    },
  },
]