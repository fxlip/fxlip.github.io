import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['tests/js/**/*.test.js', 'tests/html/**/*.test.js'],
    globals: true,
  },
})
