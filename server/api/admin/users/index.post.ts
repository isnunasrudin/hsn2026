import { eq } from 'drizzle-orm'
import { createError, defineEventHandler, readBody } from 'h3'
import { db } from '../../../database/client'
import { users } from '../../../database/schema'
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
  const existingUser = db.select({ id: users.id }).from(users).where(eq(users.email, input.email)).get()

  if (existingUser) {
    throw createError({ statusCode: 409, statusMessage: 'Email pengguna sudah digunakan.' })
  }

  const user = db.insert(users).values({
    name: input.name,
    email: input.email,
    passwordHash: await hashPassword(input.password),
    role: input.role
  }).returning().get()

  if (!user) {
    throw createError({ statusCode: 500, statusMessage: 'Pengguna gagal dibuat.' })
  }

  return { user: publicUser(user) }
})
