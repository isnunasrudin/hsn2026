import { createError, defineEventHandler, sendStream, setHeader } from 'h3'
import { getActivityId, getActivityOrThrow } from '../../../../utils/activity'
import { activityImageExists, getActivityImageStream } from '../../../../utils/activity-image'
import { requireActivityAccess } from '../../../../utils/authorization'

export default defineEventHandler(async (event) => {
  const activityId = getActivityId(event)
  await requireActivityAccess(event, activityId)
  const activity = await getActivityOrThrow(activityId)
  if (!activity.logo || !await activityImageExists(activityId, activity.logo)) {
    throw createError({ statusCode: 404, statusMessage: 'Logo kegiatan tidak ditemukan.' })
  }

  setHeader(event, 'Content-Type', 'image/jpeg')
  setHeader(event, 'Cache-Control', 'private, max-age=3600')
  return sendStream(event, getActivityImageStream(activityId, activity.logo)!)
})
