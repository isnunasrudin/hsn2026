import { randomBytes } from 'node:crypto'
import { createError } from 'h3'
import { z } from 'zod'
import { db } from '../database/client'
import type { Activity, QuotaMode } from '../generated/prisma/client'
import { registrationSystemFieldKeys, type RegistrationField, type RegistrationFile, type RegistrationAnswers } from '../database/schema'

export type RegistrationState = 'DRAFT' | 'NOT_REQUIRED' | 'NOT_OPEN' | 'OPEN' | 'FULL' | 'CLOSED' | 'CANCELLED'

export const activeRegistrationStatuses = ['PENDING', 'VERIFIED'] as const

export const normalizePhone = (value: string): string => {
  const digits = value.replace(/[^0-9+]/g, '')
  if (digits.startsWith('+62')) return `0${digits.slice(3)}`
  if (digits.startsWith('62')) return `0${digits.slice(2)}`
  return digits
}

export const getQuotaUsed = async (activityId: number, quotaMode: QuotaMode): Promise<number> => {
  const where = { activityId, status: { in: activeRegistrationStatuses } }
  if (quotaMode === 'PERSON') {
    const result = await db.registration.aggregate({ where, _sum: { participantCount: true } })
    return result._sum.participantCount ?? 0
  }
  return db.registration.count({ where })
}

export const getRegistrationState = (activity: Activity, used: number, now = new Date()): RegistrationState => {
  if (activity.status === 'CANCELLED') return 'CANCELLED'
  if (activity.status === 'DRAFT') return 'DRAFT'
  if (activity.type === 'EVENT') return 'NOT_REQUIRED'
  if (!activity.registrationOpensAt || !activity.registrationClosesAt) return 'DRAFT'
  if (activity.status === 'CLOSED' || now > activity.registrationClosesAt) return 'CLOSED'
  if (now < activity.registrationOpensAt) return 'NOT_OPEN'
  if (activity.externalRegistrationUrl) return 'OPEN'
  if (activity.capacity !== null && used >= activity.capacity) return 'FULL'
  return 'OPEN'
}

export const quotaRemaining = (activity: Activity, used: number): number | null => activity.capacity === null ? null : Math.max(0, activity.capacity - used)

export const makeRegistrationCode = (): string => `HSN26-${randomBytes(4).toString('hex').toUpperCase()}`

export const publicActivityPayload = (activity: Activity & { registrationFields: RegistrationField[] }, used: number) => ({
  id: activity.id,
  type: activity.type,
  title: activity.title,
  organizer: activity.organizer,
  contactPerson: activity.contactPerson,
  contactPhone: activity.contactPhone,
  slug: activity.slug,
  description: activity.description,
  juknis: activity.juknisStorageName ? {
    name: activity.juknisFileName,
    mimeType: activity.juknisMimeType,
    size: activity.juknisSize,
    url: `/api/public/activities/${activity.slug}/juknis`
  } : null,
  image: activity.image,
  imageZoom: activity.imageZoom,
  imagePosition: activity.imagePosition,
  displayOrder: activity.displayOrder,
  location: activity.location,
  startsAt: activity.startsAt?.toISOString() ?? null,
  endsAt: activity.endsAt?.toISOString() ?? null,
  registrationOpensAt: activity.registrationOpensAt?.toISOString() ?? null,
  registrationClosesAt: activity.registrationClosesAt?.toISOString() ?? null,
  registrationMode: activity.registrationMode,
  quotaMode: activity.quotaMode,
  capacity: activity.capacity,
  quotaUsed: used,
  quotaRemaining: quotaRemaining(activity, used),
  registrationState: getRegistrationState(activity, used),
  minTeamMembers: activity.minTeamMembers,
  maxTeamMembers: activity.maxTeamMembers,
  registrationFields: activity.registrationFields,
  externalRegistrationUrl: activity.externalRegistrationUrl
})

export const assertRegistrationAnswers = (activity: Activity & { registrationFields: RegistrationField[] }, answers: Record<string, unknown>): RegistrationAnswers => {
  const fields = activity.registrationFields
  const allowedKeys = new Set(fields.map(field => field.key))

  for (const key of Object.keys(answers)) {
    if (!allowedKeys.has(key)) throw createError({ statusCode: 400, statusMessage: `Field tambahan ${key} tidak dikenali.` })
  }

  for (const field of fields) {
    if (registrationSystemFieldKeys.includes(field.key as typeof registrationSystemFieldKeys[number])) continue
    const value = answers[field.key]
    const empty = value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0)
    if (field.required && empty) throw createError({ statusCode: 400, statusMessage: `${field.label} wajib diisi.` })
    if (empty) continue
    if ((field.type === 'text' || field.type === 'textarea' || field.type === 'email' || field.type === 'tel') && typeof value !== 'string') throw createError({ statusCode: 400, statusMessage: `${field.label} harus berupa teks.` })
    if (field.type === 'email' && typeof value === 'string' && !z.email().safeParse(value).success) throw createError({ statusCode: 400, statusMessage: `${field.label} harus berupa email yang valid.` })
    if (field.type === 'number' && (typeof value !== 'number' || !Number.isFinite(value))) throw createError({ statusCode: 400, statusMessage: `${field.label} harus berupa angka.` })
    if ((field.type === 'select' || field.type === 'radio') && (typeof value !== 'string' || !field.options?.includes(value))) throw createError({ statusCode: 400, statusMessage: `Pilihan ${field.label} tidak valid.` })
    if (field.type === 'checkbox' && typeof value !== 'boolean') throw createError({ statusCode: 400, statusMessage: `${field.label} harus berupa pilihan ya/tidak.` })
    if (field.type === 'file' && (!value || typeof value !== 'object' || Array.isArray(value) || typeof (value as { token?: unknown }).token !== 'string')) throw createError({ statusCode: 400, statusMessage: `${field.label} harus berupa file.` })
  }

  return answers as RegistrationAnswers
}
