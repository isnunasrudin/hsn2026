import 'dotenv/config'
import { defineConfig } from 'prisma/config'

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx server/database/seed.ts'
  },
  datasource: {
    url: process.env.DATABASE_URL ?? 'postgresql://hsn2026:change-me@localhost:5432/hsn2026?schema=public'
  }
})
