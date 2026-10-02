import { and, eq } from 'drizzle-orm'
import { createError, defineEventHandler, readBody } from 'h3'
import { z } from 'zod'
import { db, sqliteClient } from '../../../database/client'
import { activities, registrationStatuses, registrations } from '../../../database/schema'
import { assertSameOrigin, getAuthenticatedUser } from '../../../utils/auth'
import { requireActivityAccess } from '../../../utils/authorization'
import { getQuotaUsed } from '../../../utils/registration'

const statusSchema = z.object({
  status: z.enum(registrationStatuses),
  operatorNotes: z.string().trim().max(2000).nullable().optional()
})

export default defineEventHandler(async (event) => {
  assertSameOrigin(event)
  const user = await getAuthenticatedUser(event)
  const id = Number(event.context.params?.id)
  if (!Number.isInteger(id) || id <= 0) throw createError({ statusCode: 400, statusMessage: 'ID pendaftar tidak valid.' })

  const current = db.select({ registration: registrations, activity: activities }).from(registrations).innerJoin(activities, eq(activities.id, registrations.activityId)).where(eq(registrations.id, id)).get()
  if (!current) throw createError({ statusCode: 404, statusMessage: 'Pendaftar tidak ditemukan.' })
  await requireActivityAccess(event, current.activity.id)

  const parsedInput = statusSchema.safeParse(await readBody(event))
  if (!parsedInput.success) throw createError({ statusCode: 400, statusMessage: 'Perubahan status tidak valid.' })

  const input = parsedInput.data
  const result = sqliteClient.transaction(() => {
    const registration = db.select().from(registrations).where(eq(registrations.id, id)).get()
    const activity = db.select().from(activities).where(eq(activities.id, current.activity.id)).get()
    if (!registration || !activity) throw createError({ statusCode: 404, statusMessage: 'Pendaftar tidak ditemukan.' })

    const activeBefore = registration.status === 'PENDING' || registration.status === 'VERIFIED'
    const activeAfter = input.status === 'PENDING' || input.status === 'VERIFIED'
    if (!activeBefore && activeAfter && activity.capacity !== null) {
      const used = getQuotaUsed(activity.id, activity.quotaMode)
      const requestedSlots = activity.quotaMode === 'PERSON' ? registration.participantCount : 1
      if (used + requestedSlots > activity.capacity) throw createError({ statusCode: 409, statusMessage: 'Kuota kegiatan sudah penuh.' })
    }

    const updated = db.update(registrations).set({
      status: input.status,
      ...(input.operatorNotes !== undefined ? { operatorNotes: input.operatorNotes || null } : {}),
      verifiedBy: input.status === 'VERIFIED' ? (registration.verifiedBy ?? user.id) : null,
      verifiedAt: input.status === 'VERIFIED' ? (registration.verifiedAt ?? new Date()) : null,
      updatedAt: new Date()
    }).where(and(eq(registrations.id, id), eq(registrations.activityId, activity.id))).returning().get()

    if (!updated) throw createError({ statusCode: 409, statusMessage: 'Status pendaftar tidak berhasil diperbarui.' })
    return updated
  }).immediate()

  return {
    registration: {
      ...result,
      createdAt: result.createdAt.toISOString(),
      updatedAt: result.updatedAt.toISOString(),
      verifiedAt: result.verifiedAt?.toISOString() ?? null
    }
  }
})
