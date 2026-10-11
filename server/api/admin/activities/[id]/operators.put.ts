import { createError, defineEventHandler, readBody } from 'h3'
import { db } from '../../../../database/client'
import { assertSameOrigin } from '../../../../utils/auth'
import { requireSuperAdmin } from '../../../../utils/authorization'
import { getActivityId, getActivityOrThrow, operatorAssignmentSchema } from '../../../../utils/activity'

export default defineEventHandler(async (event) => {
  assertSameOrigin(event)
  await requireSuperAdmin(event)
  const activityId = getActivityId(event)
  await getActivityOrThrow(activityId)
  const parsedInput = operatorAssignmentSchema.safeParse(await readBody(event))

  if (!parsedInput.success) {
    throw createError({ statusCode: 400, statusMessage: 'Daftar operator tidak valid.' })
  }

  const userIds = [...new Set(parsedInput.data.userIds)]
  const validOperators = userIds.length === 0
    ? []
    : await db.user.findMany({ where: { id: { in: userIds }, role: 'OPERATOR', isActive: true }, select: { id: true } })

  if (validOperators.length !== userIds.length) {
    throw createError({ statusCode: 422, statusMessage: 'Semua operator harus berupa akun operator aktif.' })
  }

  await db.$transaction(async transaction => {
    await transaction.activityUser.deleteMany({ where: { activityId } })
    if (userIds.length > 0) await transaction.activityUser.createMany({ data: userIds.map(userId => ({ activityId, userId })) })
  })

  return { operatorIds: userIds }
})
