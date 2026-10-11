import { createError, defineEventHandler, readBody } from 'h3'
import { db } from '../../../database/client'
import { requireSuperAdmin } from '../../../utils/authorization'
import { assertSameOrigin } from '../../../utils/auth'
import { getUserId, getUserOrThrow, publicUser, userUpdateSchema } from '../../../utils/user'

export default defineEventHandler(async (event) => {
  assertSameOrigin(event)
  const currentUser = await requireSuperAdmin(event)
  const userId = getUserId(event)
  const targetUser = await getUserOrThrow(userId)
  const parsedInput = userUpdateSchema.safeParse(await readBody(event))

  if (!parsedInput.success) {
    throw createError({ statusCode: 400, statusMessage: 'Perubahan pengguna tidak valid.' })
  }

  const input = parsedInput.data

  if (currentUser.id === userId && input.isActive === false) {
    throw createError({ statusCode: 422, statusMessage: 'Akun yang sedang digunakan tidak dapat dinonaktifkan.' })
  }

  if (targetUser.role === 'SUPER_ADMIN' && (input.role === 'OPERATOR' || input.isActive === false)) {
    const activeSuperAdmins = await db.user.count({ where: { role: 'SUPER_ADMIN', isActive: true } })

    if (activeSuperAdmins <= 1) {
      throw createError({ statusCode: 422, statusMessage: 'Sistem harus memiliki setidaknya satu super admin aktif.' })
    }
  }

  if (input.email && input.email !== targetUser.email) {
    const emailOwner = await db.user.findUnique({ where: { email: input.email }, select: { id: true } })

    if (emailOwner && emailOwner.id !== userId) {
      throw createError({ statusCode: 409, statusMessage: 'Email pengguna sudah digunakan.' })
    }
  }

  const updatedUser = await db.user.update({ where: { id: userId }, data: input })

  return { user: publicUser(updatedUser) }
})
