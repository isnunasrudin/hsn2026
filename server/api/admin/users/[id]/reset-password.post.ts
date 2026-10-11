import { createError, defineEventHandler, readBody } from 'h3'
import { db } from '../../../../database/client'
import { requireSuperAdmin } from '../../../../utils/authorization'
import { assertSameOrigin } from '../../../../utils/auth'
import { getUserId, getUserOrThrow, hashPassword, passwordResetSchema, publicUser } from '../../../../utils/user'

export default defineEventHandler(async (event) => {
  assertSameOrigin(event)
  await requireSuperAdmin(event)
  const userId = getUserId(event)
  await getUserOrThrow(userId)
  const parsedInput = passwordResetSchema.safeParse(await readBody(event))

  if (!parsedInput.success) {
    throw createError({ statusCode: 400, statusMessage: 'Password baru tidak valid.' })
  }

  const updatedUser = await db.user.update({ where: { id: userId }, data: { passwordHash: await hashPassword(parsedInput.data.password) } })

  return { user: publicUser(updatedUser) }
})
