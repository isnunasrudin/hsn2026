import { randomBytes } from 'node:crypto'
import { and, count, eq, inArray, sum } from 'drizzle-orm'
import { createError } from 'h3'
import { db } from '../database/client'
import { activities, registrations } from '../database/schema'

export type RegistrationState = 'DRAFT' | 'NOT_REQUIRED' | 'NOT_OPEN' | 'OPEN' | 'FULL' | 'CLOSED' | 'CANCELLED'

export const activeRegistrationStatuses = ['PENDING', 'VERIFIED'] as const
export type RegistrationFile = { token: string; name: string; size: number; type: string }
export type RegistrationAnswers = Record<string, string | number | boolean | readonly string[] | RegistrationFile>

export const normalizePhone = (value: string): string => {
  const digits = value.replace(/[^0-9+]/g, '')
  if (digits.startsWith('+62')) return `0${digits.slice(3)}`
  if (digits.startsWith('62')) return `0${digits.slice(2)}`
  return digits
}

export const getQuotaUsed = (activityId: number, quotaMode: typeof activities.$inferSelect.quotaMode) => {
  const result = db.select({
    registrations: count(),
    people: sum(registrations.participantCount)
  }).from(registrations).where(and(
    eq(registrations.activityId, activityId),
    inArray(registrations.status, activeRegistrationStatuses)
  )).get()

  return quotaMode === 'PERSON' ? Number(result?.people ?? 0) : Number(result?.registrations ?? 0)
}

export const getRegistrationState = (activity: typeof activities.$inferSelect, used: number, now = new Date()): RegistrationState => {
  if (activity.status === 'CANCELLED') return 'CANCELLED'
  if (activity.status === 'DRAFT') return 'DRAFT'
  if (activity.type === 'EVENT') return 'NOT_REQUIRED'
  if (activity.status === 'CLOSED' || now > activity.registrationClosesAt) return 'CLOSED'
  if (now < activity.registrationOpensAt) return 'NOT_OPEN'
  if (activity.capacity !== null && used >= activity.capacity) return 'FULL'
  return 'OPEN'
}

export const quotaRemaining = (activity: typeof activities.$inferSelect, used: number): number | null => activity.capacity === null ? null : Math.max(0, activity.capacity - used)

export const makeRegistrationCode = (): string => `HSN26-${randomBytes(4).toString('hex').toUpperCase()}`

export const publicActivityPayload = (activity: typeof activities.$inferSelect, used: number) => ({
  id: activity.id,
  type: activity.type,
  title: activity.title,
  organizer: activity.organizer,
  slug: activity.slug,
  description: activity.description,
  image: activity.image,
  imageZoom: activity.imageZoom,
  imagePosition: activity.imagePosition,
  displayOrder: activity.displayOrder,
  location: activity.location,
  startsAt: activity.startsAt.toISOString(),
  endsAt: activity.endsAt?.toISOString() ?? null,
  registrationOpensAt: activity.registrationOpensAt.toISOString(),
  registrationClosesAt: activity.registrationClosesAt.toISOString(),
  registrationMode: activity.registrationMode,
  quotaMode: activity.quotaMode,
  capacity: activity.capacity,
  quotaUsed: used,
  quotaRemaining: quotaRemaining(activity, used),
  registrationState: getRegistrationState(activity, used),
  minTeamMembers: activity.minTeamMembers,
  maxTeamMembers: activity.maxTeamMembers,
  registrationFields: activity.registrationFields
})

export const assertRegistrationAnswers = (activity: typeof activities.$inferSelect, answers: Record<string, unknown>): RegistrationAnswers => {
  const fields = activity.registrationFields
  const allowedKeys = new Set(fields.map(field => field.key))

  for (const key of Object.keys(answers)) {
    if (!allowedKeys.has(key)) throw createError({ statusCode: 400, statusMessage: `Field tambahan ${key} tidak dikenali.` })
  }

  for (const field of fields) {
    const value = answers[field.key]
    const empty = value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0)
    if (field.required && empty) throw createError({ statusCode: 400, statusMessage: `${field.label} wajib diisi.` })
    if (empty) continue
    if ((field.type === 'text' || field.type === 'textarea') && typeof value !== 'string') throw createError({ statusCode: 400, statusMessage: `${field.label} harus berupa teks.` })
    if (field.type === 'number' && (typeof value !== 'number' || !Number.isFinite(value))) throw createError({ statusCode: 400, statusMessage: `${field.label} harus berupa angka.` })
    if ((field.type === 'select' || field.type === 'radio') && (typeof value !== 'string' || !field.options?.includes(value))) throw createError({ statusCode: 400, statusMessage: `Pilihan ${field.label} tidak valid.` })
    if (field.type === 'checkbox' && typeof value !== 'boolean') throw createError({ statusCode: 400, statusMessage: `${field.label} harus berupa pilihan ya/tidak.` })
    if (field.type === 'file' && (!value || typeof value !== 'object' || Array.isArray(value) || typeof (value as { token?: unknown }).token !== 'string')) throw createError({ statusCode: 400, statusMessage: `${field.label} harus berupa file.` })
  }

  return answers as RegistrationAnswers
}
