import 'dotenv/config'
import { defineConfig } from 'prisma/config'

export default defineConfig({
  schema: 'prisma/sqlite-import.schema.prisma',
  datasource: {
    url: 'file:./data/hsn2026.sqlite'
  }
})
