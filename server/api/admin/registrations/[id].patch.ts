import { createError, defineEventHandler, readBody } from 'h3'
import { z } from 'zod'
import { Prisma } from '../../../generated/prisma/client'
import { db } from '../../../database/client'
import { registrationStatuses } from '../../../database/schema'
import { assertSameOrigin, getAuthenticatedUser } from '../../../utils/auth'
import { requireActivityAccess } from '../../../utils/authorization'

const statusSchema = z.object({
  status: z.enum(registrationStatuses),
  operatorNotes: z.string().trim().max(2000).nullable().optional()
})

export default defineEventHandler(async (event) => {
  assertSameOrigin(event)
  const user = await getAuthenticatedUser(event)
  const id = Number(event.context.params?.id)
  if (!Number.isInteger(id) || id <= 0) throw createError({ statusCode: 400, statusMessage: 'ID pendaftar tidak valid.' })

  const current = await db.registration.findUnique({ where: { id }, include: { activity: true } })
  if (!current) throw createError({ statusCode: 404, statusMessage: 'Pendaftar tidak ditemukan.' })
  await requireActivityAccess(event, current.activity.id)

  const parsedInput = statusSchema.safeParse(await readBody(event))
  if (!parsedInput.success) throw createError({ statusCode: 400, statusMessage: 'Perubahan status tidak valid.' })

  const input = parsedInput.data
  const result = await db.$transaction(async transaction => {
    const registration = await transaction.registration.findUnique({ where: { id } })
    const activity = await transaction.activity.findUnique({ where: { id: current.activity.id } })
    if (!registration || !activity) throw createError({ statusCode: 404, statusMessage: 'Pendaftar tidak ditemukan.' })

    const activeBefore = registration.status === 'PENDING' || registration.status === 'VERIFIED'
    const activeAfter = input.status === 'PENDING' || input.status === 'VERIFIED'
    if (!activeBefore && activeAfter && activity.capacity !== null) {
      const where = { activityId: activity.id, status: { in: ['PENDING', 'VERIFIED'] as const } }
      const used = activity.quotaMode === 'PERSON'
        ? (await transaction.registration.aggregate({ where, _sum: { participantCount: true } }))._sum.participantCount ?? 0
        : await transaction.registration.count({ where })
      const requestedSlots = activity.quotaMode === 'PERSON' ? registration.participantCount : 1
      if (used + requestedSlots > activity.capacity) throw createError({ statusCode: 409, statusMessage: 'Kuota kegiatan sudah penuh.' })
    }

    return transaction.registration.update({
      where: { id },
      data: {
        status: input.status,
        ...(input.operatorNotes !== undefined ? { operatorNotes: input.operatorNotes || null } : {}),
        verifiedBy: input.status === 'VERIFIED' ? (registration.verifiedBy ?? user.id) : null,
        verifiedAt: input.status === 'VERIFIED' ? (registration.verifiedAt ?? new Date()) : null
      }
    })
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable })

  return {
    registration: {
      ...result,
      createdAt: result.createdAt.toISOString(),
      updatedAt: result.updatedAt.toISOString(),
      verifiedAt: result.verifiedAt?.toISOString() ?? null
    }
  }
})
