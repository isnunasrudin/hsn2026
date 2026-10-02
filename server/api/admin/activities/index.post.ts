import { eq } from 'drizzle-orm'
import { createError, defineEventHandler, readBody } from 'h3'
import { db } from '../../../database/client'
import { activities } from '../../../database/schema'
import { assertSameOrigin } from '../../../utils/auth'
import { requireSuperAdmin } from '../../../utils/authorization'
import { activityInputSchema, activityPayload } from '../../../utils/activity'

export default defineEventHandler(async (event) => {
  assertSameOrigin(event)
  const user = await requireSuperAdmin(event)
  const parsedInput = activityInputSchema.safeParse(await readBody(event))

  if (!parsedInput.success) {
    throw createError({ statusCode: 400, statusMessage: 'Data kegiatan tidak valid.' })
  }

  const existing = db.select({ id: activities.id }).from(activities).where(eq(activities.slug, parsedInput.data.slug)).get()

  if (existing) {
    throw createError({ statusCode: 409, statusMessage: 'Slug kegiatan sudah digunakan.' })
  }

  const activity = db.insert(activities).values({ ...parsedInput.data, createdBy: user.id }).returning().get()

  if (!activity) {
    throw createError({ statusCode: 500, statusMessage: 'Kegiatan gagal dibuat.' })
  }

  return { activity: activityPayload(activity) }
})
