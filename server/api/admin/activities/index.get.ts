import { defineEventHandler } from 'h3'
import { db } from '../../../database/client'
import { getAuthenticatedUser } from '../../../utils/auth'
import { activityPayload, activityRecord } from '../../../utils/activity'

export default defineEventHandler(async (event) => {
  const user = await getAuthenticatedUser(event)
  const records = await db.activity.findMany({
    where: user.role === 'SUPER_ADMIN' ? {} : { operators: { some: { userId: user.id } } },
    orderBy: { startsAt: 'asc' }
  })

  return { activities: records.map(record => activityPayload(activityRecord(record))) }
})
