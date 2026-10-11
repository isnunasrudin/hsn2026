import { createError, defineEventHandler, readBody } from 'h3'
import { db } from '../../../database/client'
import { requireSuperAdmin } from '../../../utils/authorization'
import { assertSameOrigin } from '../../../utils/auth'
import { hashPassword, publicUser, userCreateSchema } from '../../../utils/user'

export default defineEventHandler(async (event) => {
  assertSameOrigin(event)
  await requireSuperAdmin(event)
  const parsedInput = userCreateSchema.safeParse(await readBody(event))

  if (!parsedInput.success) {
    throw createError({ statusCode: 400, statusMessage: 'Data pengguna tidak valid.' })
  }

  const input = parsedInput.data
  const existingUser = await db.user.findUnique({ where: { email: input.email }, select: { id: true } })

  if (existingUser) {
    throw createError({ statusCode: 409, statusMessage: 'Email pengguna sudah digunakan.' })
  }

  const user = await db.user.create({ data: {
    name: input.name,
    email: input.email,
    passwordHash: await hashPassword(input.password),
    role: input.role
  } })

  return { user: publicUser(user) }
})
