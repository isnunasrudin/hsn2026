import { mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import * as schema from './schema'

const configuredPath = process.env.NUXT_DATABASE_PATH ?? './data/hsn2026.sqlite'

export const databasePath = resolve(process.cwd(), configuredPath)

mkdirSync(dirname(databasePath), { recursive: true })

export const sqliteClient = new Database(databasePath)

sqliteClient.pragma('foreign_keys = ON')
sqliteClient.pragma('journal_mode = WAL')
sqliteClient.pragma('busy_timeout = 5000')

export const db = drizzle({ client: sqliteClient, schema })
