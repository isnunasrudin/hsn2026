import { defineEventHandler } from 'h3'
import { db } from '../../../database/client'
import { getAuthenticatedUser } from '../../../utils/auth'
import { requireActivityAccess } from '../../../utils/authorization'
import { activityPayload, getActivityId, getActivityOrThrow } from '../../../utils/activity'

export default defineEventHandler(async (event) => {
  const user = await getAuthenticatedUser(event)
  const activityId = getActivityId(event)
  await requireActivityAccess(event, activityId)
  const activity = await getActivityOrThrow(activityId)
  const operators = user.role === 'SUPER_ADMIN'
    ? await db.user.findMany({ where: { activityAssignments: { some: { activityId } } }, select: { id: true, name: true, email: true } })
    : []

  return { activity: activityPayload(activity), operators }
})
