import { eq, inArray } from 'drizzle-orm'
import { createError, defineEventHandler } from 'h3'
import { db, sqliteClient } from '../../../database/client'
import { activities, activityUsers, registrationMembers, registrations } from '../../../database/schema'
import { assertSameOrigin } from '../../../utils/auth'
import { requireSuperAdmin } from '../../../utils/authorization'
import { getActivityId, getActivityOrThrow } from '../../../utils/activity'
import { removeRegistrationUpload } from '../../../utils/registration-upload'

export default defineEventHandler(async (event) => {
  assertSameOrigin(event)
  await requireSuperAdmin(event)
  const activityId = getActivityId(event)
  getActivityOrThrow(activityId)

  const result = sqliteClient.transaction(() => {
    const registrationRecords = db.select({ id: registrations.id, code: registrations.code }).from(registrations).where(eq(registrations.activityId, activityId)).all()
    const registrationIds = registrationRecords.map(registration => registration.id)
    if (registrationIds.length > 0) db.delete(registrationMembers).where(inArray(registrationMembers.registrationId, registrationIds)).run()
    db.delete(registrations).where(eq(registrations.activityId, activityId)).run()
    db.delete(activityUsers).where(eq(activityUsers.activityId, activityId)).run()
    const deleted = db.delete(activities).where(eq(activities.id, activityId)).returning({ id: activities.id }).get()
    if (!deleted) throw createError({ statusCode: 404, statusMessage: 'Kegiatan tidak ditemukan.' })
    return { deleted, registrationRecords }
  }).immediate()

  await Promise.all(result.registrationRecords.map(registration => removeRegistrationUpload(registration.code)))
  return { id: result.deleted.id }
})
