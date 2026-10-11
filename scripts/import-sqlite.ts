import 'dotenv/config'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { Prisma as PostgreSQLPrisma } from '../server/generated/prisma/client'
import { PrismaClient as SQLitePrismaClient } from '../server/generated/sqlite-import/client'
import { db } from '../server/database/client'

const asDate = (value: bigint): Date => new Date(Number(value))
const asNullableDate = (value: bigint | null): Date | null => value === null ? null : asDate(value)
const asJson = (value: string): PostgreSQLPrisma.InputJsonValue => JSON.parse(value) as PostgreSQLPrisma.InputJsonValue

const main = async (): Promise<void> => {
  const sourceArgument = process.argv.slice(2).find(argument => argument !== '--')
  const sqlitePath = resolve(sourceArgument ?? './data/hsn2026.sqlite')
  const sourceAdapter = new PrismaBetterSqlite3({ url: pathToFileURL(sqlitePath).href })
  const source = new SQLitePrismaClient({ adapter: sourceAdapter })

  try {
    const [users, activities, assignments, registrations, members, loginAttempts] = await Promise.all([
      source.legacyUser.findMany({ orderBy: { id: 'asc' } }),
      source.legacyActivity.findMany({ orderBy: { id: 'asc' } }),
      source.legacyActivityUser.findMany({ orderBy: [{ activityId: 'asc' }, { userId: 'asc' }] }),
      source.legacyRegistration.findMany({ orderBy: { id: 'asc' } }),
      source.legacyRegistrationMember.findMany({ orderBy: { id: 'asc' } }),
      source.legacyLoginAttempt.findMany({ orderBy: { id: 'asc' } })
    ])

    const existingRows = await Promise.all([
      db.user.count(), db.activity.count(), db.activityUser.count(), db.registration.count(),
      db.registrationMember.count(), db.loginAttempt.count()
    ])
    if (existingRows.some(count => count > 0)) throw new Error('Database PostgreSQL tujuan harus kosong sebelum impor SQLite.')

    await db.$transaction(async transaction => {
      const userIds = new Map<number, number>()
      const activityIds = new Map<number, number>()
      const registrationIds = new Map<number, number>()

      for (const row of users) {
        const created = await transaction.user.create({ data: {
          name: row.name,
          email: row.email,
          passwordHash: row.passwordHash,
          role: row.role as 'SUPER_ADMIN' | 'OPERATOR',
          isActive: row.isActive === 1,
          lastLoginAt: asNullableDate(row.lastLoginAt),
          createdAt: asDate(row.createdAt),
          updatedAt: asDate(row.updatedAt)
        } })
        userIds.set(row.id, created.id)
      }

      for (const row of activities) {
        const createdBy = userIds.get(row.createdBy)
        if (createdBy === undefined) throw new Error(`Pembuat kegiatan sumber ${row.createdBy} tidak ditemukan.`)
        const created = await transaction.activity.create({ data: {
          type: row.type as 'LOMBA' | 'EVENT',
          title: row.title,
          organizer: row.organizer,
          slug: row.slug,
          description: row.description,
          juknisFileName: row.juknisFileName,
          juknisStorageName: row.juknisStorageName,
          juknisMimeType: row.juknisMimeType,
          juknisSize: row.juknisSize,
          image: row.image,
          imageZoom: row.imageZoom,
          imagePosition: row.imagePosition,
          displayOrder: row.displayOrder,
          location: row.location,
          startsAt: asDate(row.startsAt),
          endsAt: asNullableDate(row.endsAt),
          registrationOpensAt: asDate(row.registrationOpensAt),
          registrationClosesAt: asDate(row.registrationClosesAt),
          registrationMode: row.registrationMode as 'INDIVIDUAL' | 'TEAM',
          quotaMode: row.quotaMode as 'REGISTRATION' | 'PERSON',
          capacity: row.capacity,
          minTeamMembers: row.minTeamMembers,
          maxTeamMembers: row.maxTeamMembers,
          registrationFields: asJson(row.registrationFields),
          status: row.status as 'DRAFT' | 'PUBLISHED' | 'CLOSED' | 'CANCELLED',
          createdBy,
          createdAt: asDate(row.createdAt),
          updatedAt: asDate(row.updatedAt)
        } })
        activityIds.set(row.id, created.id)
      }

      for (const row of assignments) {
        const activityId = activityIds.get(row.activityId)
        const userId = userIds.get(row.userId)
        if (activityId === undefined || userId === undefined) throw new Error('Penugasan operator sumber memiliki relasi yang tidak ditemukan.')
        await transaction.activityUser.create({ data: { activityId, userId, createdAt: asDate(row.createdAt) } })
      }

      for (const row of registrations) {
        const activityId = activityIds.get(row.activityId)
        const verifiedBy = row.verifiedBy === null ? null : userIds.get(row.verifiedBy)
        if (activityId === undefined || (row.verifiedBy !== null && verifiedBy === undefined)) throw new Error(`Relasi pendaftaran sumber ${row.code} tidak ditemukan.`)
        const created = await transaction.registration.create({ data: {
          code: row.code,
          activityId,
          registrantName: row.registrantName,
          email: row.email,
          phone: row.phone,
          institution: row.institution,
          teamName: row.teamName,
          participantCount: row.participantCount,
          answers: asJson(row.answers),
          status: row.status as 'PENDING' | 'VERIFIED' | 'REJECTED' | 'CANCELLED',
          operatorNotes: row.operatorNotes,
          verifiedBy: verifiedBy ?? null,
          verifiedAt: asNullableDate(row.verifiedAt),
          createdAt: asDate(row.createdAt),
          updatedAt: asDate(row.updatedAt)
        } })
        registrationIds.set(row.id, created.id)
      }

      for (const row of members) {
        const registrationId = registrationIds.get(row.registrationId)
        if (registrationId === undefined) throw new Error(`Pendaftaran sumber untuk anggota ${row.id} tidak ditemukan.`)
        await transaction.registrationMember.create({ data: {
          registrationId,
          name: row.name,
          identityNumber: row.identityNumber,
          metadata: asJson(row.metadata)
        } })
      }

      for (const row of loginAttempts) {
        await transaction.loginAttempt.create({ data: {
          email: row.email,
          ipAddress: row.ipAddress,
          attemptedAt: asDate(row.attemptedAt)
        } })
      }
    })

    console.info(`Impor selesai: ${users.length} pengguna, ${activities.length} kegiatan, ${registrations.length} pendaftaran.`)
  } finally {
    await source.$disconnect()
    await db.$disconnect()
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? `Impor gagal: ${error.message}` : 'Impor gagal karena error yang tidak dikenali.')
  process.exitCode = 1
})
