import { and, eq, inArray } from 'drizzle-orm'
import { createError, defineEventHandler, readBody } from 'h3'
import { db } from '../../../../database/client'
import { activityUsers, users } from '../../../../database/schema'
import { assertSameOrigin } from '../../../../utils/auth'
import { requireSuperAdmin } from '../../../../utils/authorization'
import { getActivityId, getActivityOrThrow, operatorAssignmentSchema } from '../../../../utils/activity'

export default defineEventHandler(async (event) => {
  assertSameOrigin(event)
  await requireSuperAdmin(event)
  const activityId = getActivityId(event)
  getActivityOrThrow(activityId)
  const parsedInput = operatorAssignmentSchema.safeParse(await readBody(event))

  if (!parsedInput.success) {
    throw createError({ statusCode: 400, statusMessage: 'Daftar operator tidak valid.' })
  }

  const userIds = [...new Set(parsedInput.data.userIds)]
  const validOperators = userIds.length === 0
    ? []
    : db.select({ id: users.id }).from(users).where(and(inArray(users.id, userIds), eq(users.role, 'OPERATOR'), eq(users.isActive, true))).all()

  if (validOperators.length !== userIds.length) {
    throw createError({ statusCode: 422, statusMessage: 'Semua operator harus berupa akun operator aktif.' })
  }

  db.transaction((transaction) => {
    transaction.delete(activityUsers).where(eq(activityUsers.activityId, activityId)).run()
    if (userIds.length > 0) {
      transaction.insert(activityUsers).values(userIds.map(userId => ({ activityId, userId }))).run()
    }
  })

  return { operatorIds: userIds }
})
