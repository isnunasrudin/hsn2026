import { eq } from 'drizzle-orm'
import { createError, defineEventHandler, readBody } from 'h3'
import { db } from '../../../database/client'
import { activities } from '../../../database/schema'
import { assertSameOrigin } from '../../../utils/auth'
import { requireActivityAccess } from '../../../utils/authorization'
import { activityInputSchema, activityPatchSchema, activityPayload, assertStatusTransition, getActivityId, getActivityOrThrow } from '../../../utils/activity'

export default defineEventHandler(async (event) => {
  assertSameOrigin(event)
  await requireActivityAccess(event, getActivityId(event))
  const activityId = getActivityId(event)
  const current = getActivityOrThrow(activityId)
  const parsedPatch = activityPatchSchema.safeParse(await readBody(event))

  if (!parsedPatch.success) {
    throw createError({ statusCode: 400, statusMessage: 'Perubahan kegiatan tidak valid.' })
  }

  const merged = activityInputSchema.safeParse({ ...current, ...parsedPatch.data })

  if (!merged.success) {
    throw createError({ statusCode: 400, statusMessage: 'Kombinasi data kegiatan tidak valid.' })
  }

  assertStatusTransition(current.status, merged.data.status)

  if (merged.data.slug !== current.slug) {
    const existing = db.select({ id: activities.id }).from(activities).where(eq(activities.slug, merged.data.slug)).get()
    if (existing && existing.id !== activityId) {
      throw createError({ statusCode: 409, statusMessage: 'Slug kegiatan sudah digunakan.' })
    }
  }

  const activity = db.update(activities).set({ ...merged.data, updatedAt: new Date() }).where(eq(activities.id, activityId)).returning().get()

  if (!activity) {
    throw createError({ statusCode: 404, statusMessage: 'Kegiatan tidak ditemukan.' })
  }

  return { activity: activityPayload(activity) }
})
