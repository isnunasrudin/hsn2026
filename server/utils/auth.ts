import { and, count, eq, gt } from 'drizzle-orm'
import type { H3Event } from 'h3'
import { createError, getRequestHeader, getRequestIP } from 'h3'
import { db } from '../database/client'
import { loginAttempts, users } from '../database/schema'

const loginWindowMs = 15 * 60 * 1000
const maxLoginAttempts = 5

export const getLoginIdentity = (event: H3Event, email: string): { readonly email: string; readonly ipAddress: string } => ({
  email: email.trim().toLowerCase(),
  ipAddress: getRequestIP(event, { xForwardedFor: true }) ?? 'unknown'
})

export const assertSameOrigin = (event: H3Event): void => {
  const origin = getRequestHeader(event, 'origin')
  const host = getRequestHeader(event, 'host')

  if (!origin || !host) {
    return
  }

  let originHost: string

  try {
    originHost = new URL(origin).host
  } catch (error: unknown) {
    if (error instanceof TypeError) {
      throw createError({ statusCode: 403, statusMessage: 'Origin tidak valid.' })
    }

    throw error
  }

  if (originHost !== host) {
    throw createError({ statusCode: 403, statusMessage: 'Origin tidak diizinkan.' })
  }
}

export const isLoginRateLimited = (identity: { readonly email: string; readonly ipAddress: string }): boolean => {
  const since = new Date(Date.now() - loginWindowMs)
  const result = db
    .select({ attempts: count() })
    .from(loginAttempts)
    .where(and(
      eq(loginAttempts.email, identity.email),
      eq(loginAttempts.ipAddress, identity.ipAddress),
      gt(loginAttempts.attemptedAt, since)
    ))
    .get()

  return (result?.attempts ?? 0) >= maxLoginAttempts
}

export const recordLoginFailure = (identity: { readonly email: string; readonly ipAddress: string }): void => {
  db.insert(loginAttempts).values(identity).run()
}

export const clearLoginFailures = (identity: { readonly email: string; readonly ipAddress: string }): void => {
  db.delete(loginAttempts)
    .where(and(
      eq(loginAttempts.email, identity.email),
      eq(loginAttempts.ipAddress, identity.ipAddress)
    ))
    .run()
}

export const getAuthenticatedUser = async (event: H3Event) => {
  const session = await requireUserSession(event)
  const sessionUser = session.user
  const user = db
    .select()
    .from(users)
    .where(eq(users.id, sessionUser.id))
    .get()

  if (!user || !user.isActive) {
    await clearUserSession(event)
    throw createError({ statusCode: 401, statusMessage: 'Sesi tidak lagi aktif.' })
  }

  return user
}

export const getOptionalAuthenticatedUser = async (event: H3Event) => {
  const session = await getUserSession(event)

  if (!session.user) {
    return null
  }

  const user = db
    .select()
    .from(users)
    .where(eq(users.id, session.user.id))
    .get()

  if (!user || !user.isActive) {
    await clearUserSession(event)
    return null
  }

  return user
}

export const loginUser = async (event: H3Event, user: typeof users.$inferSelect): Promise<void> => {
  await setUserSession(event, {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    }
  })
}
