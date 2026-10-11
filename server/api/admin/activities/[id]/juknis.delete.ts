import { defineEventHandler } from 'h3'
import { db } from '../../../../database/client'
import { assertSameOrigin } from '../../../../utils/auth'
import { getActivityId, getActivityOrThrow } from '../../../../utils/activity'
import { removeActivityJuknis } from '../../../../utils/activity-juknis'
import { requireActivityAccess } from '../../../../utils/authorization'

export default defineEventHandler(async (event) => {
  assertSameOrigin(event)
  const activityId = getActivityId(event)
  await requireActivityAccess(event, activityId)
  const activity = await getActivityOrThrow(activityId)
  await db.activity.update({ where: { id: activityId }, data: { juknisFileName: null, juknisStorageName: null, juknisMimeType: null, juknisSize: null } })
  await removeActivityJuknis(activityId, activity.juknisStorageName)
  return { id: activityId }
})
