import { createError, defineEventHandler, readBody } from 'h3'
import { db } from '../../../database/client'
import { Prisma } from '../../../generated/prisma/client'
import { assertSameOrigin } from '../../../utils/auth'
import { requireActivityAccess } from '../../../utils/authorization'
import { activityInputSchema, activityPatchSchema, activityPayload, activitySlugFromTitle, getActivityId, getActivityOrThrow, uniqueActivitySlug } from '../../../utils/activity'
import { removeActivityImage } from '../../../utils/activity-image'

export default defineEventHandler(async (event) => {
  assertSameOrigin(event)
  await requireActivityAccess(event, getActivityId(event))
  const activityId = getActivityId(event)
  const current = await getActivityOrThrow(activityId)
  const body = await readBody<Record<string, unknown>>(event)
  if (typeof body?.title === 'string' && body.title.trim() && (typeof body.slug !== 'string' || !body.slug.trim() || body.slug === activitySlugFromTitle(body.title)) && body.title.trim() !== current.title) {
    body.slug = await uniqueActivitySlug(body.title, activityId)
  }
  const parsedPatch = activityPatchSchema.safeParse(body)

  if (!parsedPatch.success) {
    throw createError({ statusCode: 400, statusMessage: 'Perubahan kegiatan tidak valid.' })
  }

  const merged = activityInputSchema.safeParse({ ...current, ...parsedPatch.data })

  if (!merged.success) {
    throw createError({ statusCode: 400, statusMessage: 'Kombinasi data kegiatan tidak valid.' })
  }

  if (merged.data.slug && merged.data.slug !== current.slug) {
    const existing = await db.activity.findUnique({ where: { slug: merged.data.slug }, select: { id: true } })
    if (existing && existing.id !== activityId) {
      throw createError({ statusCode: 409, statusMessage: 'Slug kegiatan sudah digunakan.' })
    }
  }

  const activity = await db.activity.update({ where: { id: activityId }, data: { ...merged.data, registrationFields: merged.data.registrationFields as Prisma.InputJsonValue } })
  if (current.image !== activity.image) await removeActivityImage(activityId, current.image)

  return { activity: activityPayload({ ...activity, registrationFields: merged.data.registrationFields }) }
})
