import { asc, eq } from 'drizzle-orm'
import { defineEventHandler, getQuery } from 'h3'
import { z } from 'zod'
import { db } from '../../../database/client'
import { activities, activityTypes } from '../../../database/schema'
import { getQuotaUsed, publicActivityPayload } from '../../../utils/registration'

const querySchema = z.object({ type: z.enum(activityTypes).optional() })

export default defineEventHandler((event) => {
  const query = querySchema.parse(getQuery(event))
  const records = db.select().from(activities).where(query.type ? eq(activities.type, query.type) : eq(activities.status, 'PUBLISHED')).orderBy(asc(activities.startsAt)).all()
  const published = records.filter(activity => activity.status === 'PUBLISHED')

  return { activities: published.map(activity => publicActivityPayload(activity, getQuotaUsed(activity.id, activity.quotaMode))) }
})
