import { createError, defineEventHandler } from 'h3'
import { db } from '../../../database/client'
import { assertSameOrigin } from '../../../utils/auth'
import { requireSuperAdmin } from '../../../utils/authorization'
import { getActivityId, getActivityOrThrow } from '../../../utils/activity'
import { removeRegistrationUpload } from '../../../utils/registration-upload'
import { removeActivityJuknis } from '../../../utils/activity-juknis'

export default defineEventHandler(async (event) => {
  assertSameOrigin(event)
  await requireSuperAdmin(event)
  const activityId = getActivityId(event)
  const activity = await getActivityOrThrow(activityId)

  const result = await db.$transaction(async transaction => {
    const registrationRecords = await transaction.registration.findMany({ where: { activityId }, select: { code: true } })
    await transaction.registration.deleteMany({ where: { activityId } })
    const deleted = await transaction.activity.delete({ where: { id: activityId }, select: { id: true } })
    return { deleted, registrationRecords }
  })

  await Promise.all(result.registrationRecords.map(registration => removeRegistrationUpload(registration.code)))
  await removeActivityJuknis(activityId, activity.juknisStorageName)
  return { id: result.deleted.id }
})
