import { and, count, eq } from 'drizzle-orm'
import { createError, defineEventHandler, readBody } from 'h3'
import { db } from '../../../database/client'
import { users } from '../../../database/schema'
import { requireSuperAdmin } from '../../../utils/authorization'
import { assertSameOrigin } from '../../../utils/auth'
import { getUserId, getUserOrThrow, publicUser, userUpdateSchema } from '../../../utils/user'

export default defineEventHandler(async (event) => {
  assertSameOrigin(event)
  const currentUser = await requireSuperAdmin(event)
  const userId = getUserId(event)
  const targetUser = getUserOrThrow(userId)
  const parsedInput = userUpdateSchema.safeParse(await readBody(event))

  if (!parsedInput.success) {
    throw createError({ statusCode: 400, statusMessage: 'Perubahan pengguna tidak valid.' })
  }

  const input = parsedInput.data

  if (currentUser.id === userId && input.isActive === false) {
    throw createError({ statusCode: 422, statusMessage: 'Akun yang sedang digunakan tidak dapat dinonaktifkan.' })
  }

  if (targetUser.role === 'SUPER_ADMIN' && (input.role === 'OPERATOR' || input.isActive === false)) {
    const activeSuperAdmins = db
      .select({ total: count() })
      .from(users)
      .where(and(eq(users.role, 'SUPER_ADMIN'), eq(users.isActive, true)))
      .get()?.total ?? 0

    if (activeSuperAdmins <= 1) {
      throw createError({ statusCode: 422, statusMessage: 'Sistem harus memiliki setidaknya satu super admin aktif.' })
    }
  }

  if (input.email && input.email !== targetUser.email) {
    const emailOwner = db.select({ id: users.id }).from(users).where(eq(users.email, input.email)).get()

    if (emailOwner && emailOwner.id !== userId) {
      throw createError({ statusCode: 409, statusMessage: 'Email pengguna sudah digunakan.' })
    }
  }

  const updatedUser = db.update(users)
    .set({ ...input, updatedAt: new Date() })
    .where(eq(users.id, userId))
    .returning()
    .get()

  if (!updatedUser) {
    throw createError({ statusCode: 404, statusMessage: 'Pengguna tidak ditemukan.' })
  }

  return { user: publicUser(updatedUser) }
})
