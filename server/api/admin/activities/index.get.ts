import { asc, eq, inArray } from 'drizzle-orm'
import { defineEventHandler } from 'h3'
import { db } from '../../../database/client'
import { activities, activityUsers } from '../../../database/schema'
import { getAuthenticatedUser } from '../../../utils/auth'
import { activityPayload } from '../../../utils/activity'

export default defineEventHandler(async (event) => {
  const user = await getAuthenticatedUser(event)
  const records = user.role === 'SUPER_ADMIN'
    ? db.select().from(activities).orderBy(asc(activities.startsAt)).all()
    : (() => {
        const assignedIds = db.select({ activityId: activityUsers.activityId }).from(activityUsers).where(eq(activityUsers.userId, user.id)).all().map(item => item.activityId)
        return assignedIds.length === 0 ? [] : db.select().from(activities).where(inArray(activities.id, assignedIds)).orderBy(asc(activities.startsAt)).all()
      })()

  return { activities: records.map(activityPayload) }
})
