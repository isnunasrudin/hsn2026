import { defineEventHandler, getQuery } from 'h3'
import { z } from 'zod'
import { db } from '../../../database/client'
import { activityTypes } from '../../../database/schema'
import { activityRecord } from '../../../utils/activity'
import { getQuotaUsed, publicActivityPayload } from '../../../utils/registration'

const querySchema = z.object({ type: z.enum(activityTypes).optional() })

export default defineEventHandler(async (event) => {
  const query = querySchema.parse(getQuery(event))
  const records = await db.activity.findMany({ where: query.type ? { type: query.type, status: 'PUBLISHED' } : { status: 'PUBLISHED' }, orderBy: { startsAt: 'asc' } })
  const published = records.filter(activity => activity.status === 'PUBLISHED')

  return { activities: await Promise.all(published.map(async activity => publicActivityPayload(activityRecord(activity), await getQuotaUsed(activity.id, activity.quotaMode)))) }
})
