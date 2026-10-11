import type { H3Event } from 'h3'
import { createError, getRequestHeader, getRequestIP } from 'h3'
import { db } from '../database/client'
import type { User } from '../generated/prisma/client'

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

export const isLoginRateLimited = async (identity: { readonly email: string; readonly ipAddress: string }): Promise<boolean> => {
  const since = new Date(Date.now() - loginWindowMs)
  const attempts = await db.loginAttempt.count({ where: { email: identity.email, ipAddress: identity.ipAddress, attemptedAt: { gt: since } } })
  return attempts >= maxLoginAttempts
}

export const recordLoginFailure = async (identity: { readonly email: string; readonly ipAddress: string }): Promise<void> => {
  await db.loginAttempt.create({ data: identity })
}

export const clearLoginFailures = async (identity: { readonly email: string; readonly ipAddress: string }): Promise<void> => {
  await db.loginAttempt.deleteMany({ where: identity })
}

export const getAuthenticatedUser = async (event: H3Event) => {
  const session = await requireUserSession(event)
  const sessionUser = session.user
  const user = await db.user.findUnique({ where: { id: sessionUser.id } })

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

  const user = await db.user.findUnique({ where: { id: session.user.id } })

  if (!user || !user.isActive) {
    await clearUserSession(event)
    return null
  }

  return user
}

export const loginUser = async (event: H3Event, user: User): Promise<void> => {
  await setUserSession(event, {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    }
  })
}
