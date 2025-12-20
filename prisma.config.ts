import { defineConfig } from '@prisma/config'

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    name: 'db',
    provider: 'sqlite',
    url: process.env.DATABASE_URL ?? 'file:./dev.db',
  },
})
