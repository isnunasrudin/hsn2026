import { eq } from 'drizzle-orm'
import { createError, defineEventHandler, getRouterParam } from 'h3'
import { db } from '../../../database/client'
import { activities } from '../../../database/schema'
import { getQuotaUsed, publicActivityPayload } from '../../../utils/registration'

export default defineEventHandler((event) => {
  const slug = getRouterParam(event, 'slug')
  const activity = slug ? db.select().from(activities).where(eq(activities.slug, slug)).get() : null

  if (!activity || activity.status !== 'PUBLISHED') throw createError({ statusCode: 404, statusMessage: 'Kegiatan tidak ditemukan.' })

  return { activity: publicActivityPayload(activity, getQuotaUsed(activity.id, activity.quotaMode)) }
})
