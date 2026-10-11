import { createError, defineEventHandler } from 'h3'
import { db } from '../../../database/client'
import { assertSameOrigin } from '../../../utils/auth'
import { requireSuperAdmin } from '../../../utils/authorization'
import { getUserId, getUserOrThrow } from '../../../utils/user'

export default defineEventHandler(async (event) => {
  assertSameOrigin(event)
  const currentUser = await requireSuperAdmin(event)
  const userId = getUserId(event)
  const targetUser = await getUserOrThrow(userId)

  if (currentUser.id === userId) throw createError({ statusCode: 422, statusMessage: 'Akun yang sedang digunakan tidak dapat dihapus.' })

  const createdActivities = await db.activity.count({ where: { createdBy: userId } })
  if (createdActivities > 0) throw createError({ statusCode: 409, statusMessage: 'Pengguna masih menjadi pembuat kegiatan. Hapus atau pindahkan kegiatan terlebih dahulu.' })

  if (targetUser.role === 'SUPER_ADMIN' && targetUser.isActive) {
    const activeSuperAdmins = await db.user.count({ where: { role: 'SUPER_ADMIN', isActive: true } })
    if (activeSuperAdmins <= 1) throw createError({ statusCode: 422, statusMessage: 'Sistem harus memiliki setidaknya satu super admin aktif.' })
  }

  const deleted = await db.user.delete({ where: { id: userId }, select: { id: true } })
  return { id: deleted.id }
})
