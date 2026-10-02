import { eq } from 'drizzle-orm'
import { createError, defineEventHandler, readBody } from 'h3'
import { verify } from '@node-rs/argon2'
import { z } from 'zod'
import { db } from '../../database/client'
import { users } from '../../database/schema'
import {
  assertSameOrigin,
  clearLoginFailures,
  getLoginIdentity,
  isLoginRateLimited,
  loginUser,
  recordLoginFailure
} from '../../utils/auth'

const loginSchema = z.object({
  email: z.email().transform(value => value.toLowerCase()),
  password: z.string().min(1)
})

export default defineEventHandler(async (event) => {
  assertSameOrigin(event)
  const parsedInput = loginSchema.safeParse(await readBody(event))

  if (!parsedInput.success) {
    throw createError({ statusCode: 400, statusMessage: 'Email dan password wajib diisi dengan format yang valid.' })
  }

  const input = parsedInput.data
  const identity = getLoginIdentity(event, input.email)

  if (isLoginRateLimited(identity)) {
    throw createError({ statusCode: 429, statusMessage: 'Terlalu banyak percobaan login. Coba lagi dalam 15 menit.' })
  }

  const user = db.select().from(users).where(eq(users.email, identity.email)).get()
  const passwordMatches = user ? await verify(user.passwordHash, input.password) : false

  if (!user || !user.isActive || !passwordMatches) {
    recordLoginFailure(identity)
    throw createError({ statusCode: 401, statusMessage: 'Email atau password salah.' })
  }

  clearLoginFailures(identity)
  db.update(users)
    .set({ lastLoginAt: new Date(), updatedAt: new Date() })
    .where(eq(users.id, user.id))
    .run()
  await loginUser(event, user)

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    }
  }
})
