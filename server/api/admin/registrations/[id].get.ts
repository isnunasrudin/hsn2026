import { eq } from 'drizzle-orm'
import { createError, defineEventHandler } from 'h3'
import { db } from '../../../database/client'
import { activities, registrationMembers, registrations } from '../../../database/schema'
import { requireActivityAccess } from '../../../utils/authorization'

export default defineEventHandler(async (event) => {
  const id = Number(event.context.params?.id)
  if (!Number.isInteger(id) || id <= 0) throw createError({ statusCode: 400, statusMessage: 'ID pendaftar tidak valid.' })

  const result = db.select({ registration: registrations, activityId: activities.id, activityTitle: activities.title, activitySlug: activities.slug }).from(registrations).innerJoin(activities, eq(activities.id, registrations.activityId)).where(eq(registrations.id, id)).get()
  if (!result) throw createError({ statusCode: 404, statusMessage: 'Pendaftar tidak ditemukan.' })

  await requireActivityAccess(event, result.activityId)
  const members = db.select().from(registrationMembers).where(eq(registrationMembers.registrationId, id)).all()

  return {
    registration: {
      ...result.registration,
      createdAt: result.registration.createdAt.toISOString(),
      updatedAt: result.registration.updatedAt.toISOString(),
      verifiedAt: result.registration.verifiedAt?.toISOString() ?? null
    },
    members,
    activity: { id: result.activityId, title: result.activityTitle, slug: result.activitySlug }
  }
})
