import { cloudflareTest } from '@cloudflare/vitest-pool-workers'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [cloudflareTest({
    wrangler: { configPath: './workers/visitor-api/wrangler.toml' },
  })],
  test: {
    include: ['tests/worker/**/*.test.js'],
  },
})
