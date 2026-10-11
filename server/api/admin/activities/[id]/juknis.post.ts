import { createError, defineEventHandler, readMultipartFormData } from 'h3'
import { db } from '../../../../database/client'
import { assertSameOrigin } from '../../../../utils/auth'
import { getActivityId, getActivityOrThrow } from '../../../../utils/activity'
import { removeActivityJuknis, saveActivityJuknis } from '../../../../utils/activity-juknis'
import { requireActivityAccess } from '../../../../utils/authorization'

export default defineEventHandler(async (event) => {
  assertSameOrigin(event)
  const activityId = getActivityId(event)
  await requireActivityAccess(event, activityId)
  const activity = await getActivityOrThrow(activityId)
  const parts = await readMultipartFormData(event)
  const file = parts?.find(part => part.name === 'file' && part.data.length > 0)

  if (!file || !file.filename || !file.type) {
    throw createError({ statusCode: 400, statusMessage: 'File juknis wajib dipilih.' })
  }

  let saved: Awaited<ReturnType<typeof saveActivityJuknis>>
  try {
    saved = await saveActivityJuknis(activityId, file.filename, file.type, file.data)
  } catch (error: unknown) {
    throw createError({ statusCode: 400, statusMessage: error instanceof Error ? error.message : 'File juknis tidak valid.' })
  }

  try {
    const updated = await db.activity.update({ where: { id: activityId }, data: {
      juknisFileName: saved.fileName,
      juknisStorageName: saved.storageName,
      juknisMimeType: saved.mimeType,
      juknisSize: saved.size,
    } })
    await removeActivityJuknis(activityId, activity.juknisStorageName).catch(() => undefined)
    return { juknis: { name: saved.fileName, mimeType: saved.mimeType, size: saved.size, url: activity.slug ? `/api/public/activities/${activity.slug}/juknis` : `/api/admin/activities/${activity.id}/juknis` } }
  } catch (error: unknown) {
    await removeActivityJuknis(activityId, saved.storageName)
    throw createError({ statusCode: 500, statusMessage: error instanceof Error ? error.message : 'Juknis gagal disimpan.' })
  }
})
