import { createError, defineEventHandler } from 'h3'
import { db } from '../../../database/client'
import { requireActivityAccess } from '../../../utils/authorization'

export default defineEventHandler(async (event) => {
  const id = Number(event.context.params?.id)
  if (!Number.isInteger(id) || id <= 0) throw createError({ statusCode: 400, statusMessage: 'ID pendaftar tidak valid.' })

  const result = await db.registration.findUnique({ where: { id }, include: { activity: { select: { id: true, title: true, slug: true } }, members: true } })
  if (!result) throw createError({ statusCode: 404, statusMessage: 'Pendaftar tidak ditemukan.' })

  await requireActivityAccess(event, result.activity.id)
  const { activity, members, ...registration } = result

  return {
    registration: {
      ...registration,
      createdAt: registration.createdAt.toISOString(),
      updatedAt: registration.updatedAt.toISOString(),
      verifiedAt: registration.verifiedAt?.toISOString() ?? null
    },
    members,
    activity
  }
})
