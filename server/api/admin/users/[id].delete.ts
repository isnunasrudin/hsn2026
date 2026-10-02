import { and, count, eq } from 'drizzle-orm'
import { createError, defineEventHandler } from 'h3'
import { db } from '../../../database/client'
import { activities, users } from '../../../database/schema'
import { assertSameOrigin } from '../../../utils/auth'
import { requireSuperAdmin } from '../../../utils/authorization'
import { getUserId, getUserOrThrow } from '../../../utils/user'

export default defineEventHandler(async (event) => {
  assertSameOrigin(event)
  const currentUser = await requireSuperAdmin(event)
  const userId = getUserId(event)
  const targetUser = getUserOrThrow(userId)

  if (currentUser.id === userId) throw createError({ statusCode: 422, statusMessage: 'Akun yang sedang digunakan tidak dapat dihapus.' })

  const createdActivities = db.select({ total: count() }).from(activities).where(eq(activities.createdBy, userId)).get()?.total ?? 0
  if (createdActivities > 0) throw createError({ statusCode: 409, statusMessage: 'Pengguna masih menjadi pembuat kegiatan. Hapus atau pindahkan kegiatan terlebih dahulu.' })

  if (targetUser.role === 'SUPER_ADMIN' && targetUser.isActive) {
    const activeSuperAdmins = db.select({ total: count() }).from(users).where(and(eq(users.role, 'SUPER_ADMIN'), eq(users.isActive, true))).get()?.total ?? 0
    if (activeSuperAdmins <= 1) throw createError({ statusCode: 422, statusMessage: 'Sistem harus memiliki setidaknya satu super admin aktif.' })
  }

  const deleted = db.delete(users).where(eq(users.id, userId)).returning({ id: users.id }).get()
  if (!deleted) throw createError({ statusCode: 404, statusMessage: 'Pengguna tidak ditemukan.' })
  return { id: deleted.id }
})
