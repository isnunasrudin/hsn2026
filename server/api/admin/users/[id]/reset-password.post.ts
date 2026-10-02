import { eq } from 'drizzle-orm'
import { createError, defineEventHandler, readBody } from 'h3'
import { db } from '../../../../database/client'
import { users } from '../../../../database/schema'
import { requireSuperAdmin } from '../../../../utils/authorization'
import { assertSameOrigin } from '../../../../utils/auth'
import { getUserId, getUserOrThrow, hashPassword, passwordResetSchema, publicUser } from '../../../../utils/user'

export default defineEventHandler(async (event) => {
  assertSameOrigin(event)
  await requireSuperAdmin(event)
  const userId = getUserId(event)
  getUserOrThrow(userId)
  const parsedInput = passwordResetSchema.safeParse(await readBody(event))

  if (!parsedInput.success) {
    throw createError({ statusCode: 400, statusMessage: 'Password baru tidak valid.' })
  }

  const updatedUser = db.update(users)
    .set({ passwordHash: await hashPassword(parsedInput.data.password), updatedAt: new Date() })
    .where(eq(users.id, userId))
    .returning()
    .get()

  if (!updatedUser) {
    throw createError({ statusCode: 404, statusMessage: 'Pengguna tidak ditemukan.' })
  }

  return { user: publicUser(updatedUser) }
})
