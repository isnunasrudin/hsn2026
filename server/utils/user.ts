import { hash } from '@node-rs/argon2'
import { createError, type H3Event, getRouterParam } from 'h3'
import { z } from 'zod'
import { db } from '../database/client'
import type { User } from '../generated/prisma/client'
import { userRoles } from '../database/schema'

export const userIdSchema = z.coerce.number().int().positive()

export const userCreateSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.email().transform(value => value.toLowerCase()),
  password: z.string().min(12).max(200),
  role: z.enum(userRoles)
})

export const userUpdateSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  email: z.email().transform(value => value.toLowerCase()).optional(),
  role: z.enum(userRoles).optional(),
  isActive: z.boolean().optional()
}).refine(value => Object.keys(value).length > 0, 'Setidaknya satu field harus diubah.')

export const passwordResetSchema = z.object({
  password: z.string().min(12).max(200)
})

export const getUserId = (event: H3Event): number => {
  const parsedId = userIdSchema.safeParse(getRouterParam(event, 'id'))

  if (!parsedId.success) {
    throw createError({ statusCode: 400, statusMessage: 'ID pengguna tidak valid.' })
  }

  return parsedId.data
}

export const getUserOrThrow = async (userId: number) => {
  const user = await db.user.findUnique({ where: { id: userId } })

  if (!user) {
    throw createError({ statusCode: 404, statusMessage: 'Pengguna tidak ditemukan.' })
  }

  return user
}

export const hashPassword = (password: string): Promise<string> => hash(password)

export const publicUser = (user: User) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  isActive: user.isActive,
  lastLoginAt: user.lastLoginAt,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt
})
