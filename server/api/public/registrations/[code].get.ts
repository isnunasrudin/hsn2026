import { createError, defineEventHandler, getRouterParam } from 'h3'
import { db } from '../../../database/client'

export default defineEventHandler(async (event) => {
  const code = getRouterParam(event, 'code')?.trim().toUpperCase()
  const registration = code ? await db.registration.findUnique({ where: { code }, include: { activity: { select: { title: true, slug: true } } } }) : null

  if (!registration) throw createError({ statusCode: 404, statusMessage: 'Kode pendaftaran tidak ditemukan.' })

  return {
    registration: {
      code: registration.code,
      registrantName: registration.registrantName,
      participantCount: registration.participantCount,
      teamName: registration.teamName,
      status: registration.status,
      createdAt: registration.createdAt.toISOString()
    },
    activity: registration.activity
  }
})
