import globals from 'globals'

export default [
  // Ignora tudo que não é source JS do projeto
  {
    ignores: [
      'node_modules/**',
      '_site/**',
      'vendor/**',
      'tests/**',
      'workers/**',
    ],
  },

  // Assets do browser (carregados como <script>, não ES modules)
  {
    files: ['assets/js/**/*.js'],
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: 'script',
      globals: globals.browser,
    },
    rules: {
      // Erros que indicam bugs reais
      'no-undef':          'error',
      'no-eval':           'error',
      'no-unused-vars':    ['warn', { varsIgnorePattern: '^_', argsIgnorePattern: '^_' }],
      'no-constant-condition': 'error',
      'no-duplicate-case': 'error',

      // Console: warn em produção (não bloqueia CI, mas aparece)
      'no-console':        'warn',
    },
  },
]
