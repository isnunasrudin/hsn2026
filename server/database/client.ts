import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '../generated/prisma/client'

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error('DATABASE_URL wajib diatur untuk koneksi PostgreSQL.')
}

const adapter = new PrismaPg({ connectionString })

const globalForPrisma = globalThis as typeof globalThis & { prisma?: PrismaClient }

export const db = globalForPrisma.prisma ?? new PrismaClient({ adapter })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
