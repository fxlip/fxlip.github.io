import { defineWorkersConfig } from '@cloudflare/vitest-pool-workers/config'

export default defineWorkersConfig({
  test: {
    poolOptions: {
      workers: {
        wrangler: { configPath: './workers/visitor-api/wrangler.toml' },
      },
    },
    include: ['tests/worker/**/*.test.js'],
  },
})
