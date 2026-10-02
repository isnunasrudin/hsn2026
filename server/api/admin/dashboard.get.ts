import { and, count, eq, inArray } from 'drizzle-orm'
import { defineEventHandler } from 'h3'
import { db } from '../../database/client'
import { activities, activityUsers, registrations } from '../../database/schema'
import { getAuthenticatedUser } from '../../utils/auth'

const total = (query: { get: () => { total: number } | undefined }): number => query.get()?.total ?? 0

export default defineEventHandler(async (event) => {
  const user = await getAuthenticatedUser(event)
  const activityIds = user.role === 'SUPER_ADMIN'
    ? null
    : db.select({ activityId: activityUsers.activityId }).from(activityUsers).where(eq(activityUsers.userId, user.id)).all().map(item => item.activityId)
  const activityFilter = activityIds === null ? undefined : inArray(activities.id, activityIds)
  const registrationFilter = activityIds === null ? undefined : inArray(registrations.activityId, activityIds)
  const noActivities = activityIds !== null && activityIds.length === 0

  return {
    activities: {
      total: noActivities ? 0 : total(db.select({ total: count() }).from(activities).where(activityFilter)),
      draft: noActivities ? 0 : total(db.select({ total: count() }).from(activities).where(and(activityFilter, eq(activities.status, 'DRAFT')))),
      published: noActivities ? 0 : total(db.select({ total: count() }).from(activities).where(and(activityFilter, eq(activities.status, 'PUBLISHED'))))
    },
    registrations: {
      total: noActivities ? 0 : total(db.select({ total: count() }).from(registrations).where(registrationFilter)),
      pending: noActivities ? 0 : total(db.select({ total: count() }).from(registrations).where(and(registrationFilter, eq(registrations.status, 'PENDING'))))
    }
  }
})
