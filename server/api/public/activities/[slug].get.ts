import { createError, defineEventHandler, getRouterParam } from 'h3'
import { db } from '../../../database/client'
import { activityRecord } from '../../../utils/activity'
import { getQuotaUsed, publicActivityPayload } from '../../../utils/registration'

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')
  const record = slug ? await db.activity.findUnique({ where: { slug } }) : null

  if (!record || record.status !== 'PUBLISHED') throw createError({ statusCode: 404, statusMessage: 'Kegiatan tidak ditemukan.' })
  const activity = activityRecord(record)

  return { activity: publicActivityPayload(activity, await getQuotaUsed(activity.id, activity.quotaMode)) }
})
