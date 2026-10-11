import type { H3Event } from 'h3'
import { createError } from 'h3'
import { db } from '../database/client'
import { getAuthenticatedUser } from './auth'

export const requireAuthenticatedUser = getAuthenticatedUser

export const requireSuperAdmin = async (event: H3Event) => {
  const user = await getAuthenticatedUser(event)

  if (user.role !== 'SUPER_ADMIN') {
    throw createError({ statusCode: 403, statusMessage: 'Akses super admin diperlukan.' })
  }

  return user
}

export const requireActivityAccess = async (event: H3Event, activityId: number) => {
  const user = await getAuthenticatedUser(event)

  if (user.role === 'SUPER_ADMIN') {
    return user
  }

  const assignment = await db.activityUser.findUnique({ where: { activityId_userId: { activityId, userId: user.id } } })

  if (!assignment) {
    throw createError({ statusCode: 403, statusMessage: 'Anda tidak ditugaskan pada kegiatan ini.' })
  }

  return user
}

export const requireUserById = async (event: H3Event, userId: number) => {
  await requireSuperAdmin(event)
  const user = await db.user.findUnique({ where: { id: userId } })

  if (!user) {
    throw createError({ statusCode: 404, statusMessage: 'Pengguna tidak ditemukan.' })
  }

  return user
}
