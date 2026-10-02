import { eq } from 'drizzle-orm'
import { createError, defineEventHandler, getRouterParam } from 'h3'
import { db } from '../../../database/client'
import { activities, registrations } from '../../../database/schema'

export default defineEventHandler((event) => {
  const code = getRouterParam(event, 'code')?.trim().toUpperCase()
  const registration = code ? db.select({ registration: registrations, activityTitle: activities.title, activitySlug: activities.slug }).from(registrations).innerJoin(activities, eq(activities.id, registrations.activityId)).where(eq(registrations.code, code)).get() : null

  if (!registration) throw createError({ statusCode: 404, statusMessage: 'Kode pendaftaran tidak ditemukan.' })

  return {
    registration: {
      code: registration.registration.code,
      registrantName: registration.registration.registrantName,
      participantCount: registration.registration.participantCount,
      teamName: registration.registration.teamName,
      status: registration.registration.status,
      createdAt: registration.registration.createdAt.toISOString()
    },
    activity: { title: registration.activityTitle, slug: registration.activitySlug }
  }
})
