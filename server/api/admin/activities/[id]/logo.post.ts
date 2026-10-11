import { createError, defineEventHandler, readMultipartFormData } from 'h3'
import { db } from '../../../../database/client'
import { assertSameOrigin } from '../../../../utils/auth'
import { getActivityId, getActivityOrThrow } from '../../../../utils/activity'
import { removeActivityImage, saveActivityImage } from '../../../../utils/activity-image'
import { requireActivityAccess } from '../../../../utils/authorization'

export default defineEventHandler(async (event) => {
  assertSameOrigin(event)
  const activityId = getActivityId(event)
  await requireActivityAccess(event, activityId)
  const activity = await getActivityOrThrow(activityId)
  const file = (await readMultipartFormData(event))?.find(part => part.name === 'file' && part.data.length > 0)
  if (!file || file.type !== 'image/jpeg') {
    throw createError({ statusCode: 400, statusMessage: 'Pilih hasil crop logo JPEG terlebih dahulu.' })
  }

  let logo: string
  try {
    logo = await saveActivityImage(activityId, file.data, file.type)
  } catch (error: unknown) {
    throw createError({ statusCode: 400, statusMessage: error instanceof Error ? error.message : 'Logo gagal disimpan.' })
  }

  try {
    await db.activity.update({ where: { id: activityId }, data: { logo } })
    await removeActivityImage(activityId, activity.logo)
    return { logo: activity.slug ? `/api/public/activities/${activity.slug}/logo` : `/api/admin/activities/${activityId}/logo` }
  } catch (error: unknown) {
    await removeActivityImage(activityId, logo)
    throw createError({ statusCode: 500, statusMessage: error instanceof Error ? error.message : 'Logo gagal disimpan.' })
  }
})
