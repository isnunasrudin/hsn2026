import { createError, type H3Event, getRouterParam } from 'h3'
import { z } from 'zod'
import { db } from '../database/client'
import type { Activity } from '../generated/prisma/client'
import { activityStatuses, activityTypes, defaultRegistrationFields, parseRegistrationFields, quotaModes, registrationFieldTypes, registrationModes, type RegistrationField } from '../database/schema'

const dateValue = z.union([z.string().min(1), z.date()]).transform(value => value instanceof Date ? new Date(value.getTime()) : new Date(value)).refine(value => !Number.isNaN(value.getTime()), 'Tanggal tidak valid.')
const nullableDateValue = dateValue.nullable()

export const activitySlugFromTitle = (title: string): string => title
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '')

export const uniqueActivitySlug = async (title: string, excludeId?: number): Promise<string> => {
  const base = activitySlugFromTitle(title) || 'kegiatan'
  let candidate = base.slice(0, 180)
  let suffix = 2

  while (true) {
    const existing = await db.activity.findUnique({ where: { slug: candidate }, select: { id: true } })
    if (!existing || existing.id === excludeId) return candidate

    const ending = `-${suffix}`
    candidate = `${base.slice(0, 180 - ending.length)}${ending}`
    suffix += 1
  }
}

const registrationFieldSchema = z.object({
  key: z.string().trim().regex(/^[a-z0-9_]+$/),
  label: z.string().trim().min(1).max(120),
  type: z.enum(registrationFieldTypes),
  required: z.boolean(),
  options: z.array(z.string().trim().min(1).max(120)).max(50).optional(),
  accept: z.string().trim().max(240).optional()
})

const activityFieldsSchema = z.object({
  type: z.enum(activityTypes),
  title: z.string().trim().max(180).transform(value => value || null).nullable(),
  organizer: z.string().trim().max(120).nullable(),
  contactPerson: z.string().trim().max(120).transform(value => value || null).nullable(),
  contactPhone: z.string().trim().max(40).transform(value => value || null).nullable(),
  slug: z.string().trim().max(180).transform(value => value || null).nullable(),
  description: z.string().trim().max(5000).nullable(),
  image: z.string().trim().max(500).nullable(),
  displayOrder: z.number().int().min(0),
  location: z.string().trim().max(240).nullable(),
  startsAt: nullableDateValue,
  endsAt: nullableDateValue,
  registrationOpensAt: nullableDateValue,
  registrationClosesAt: nullableDateValue,
  registrationMode: z.enum(registrationModes),
  quotaMode: z.enum(quotaModes),
  capacity: z.number().int().positive().nullable(),
  minTeamMembers: z.number().int().positive().nullable(),
  maxTeamMembers: z.number().int().positive().nullable(),
  registrationFields: z.array(registrationFieldSchema).max(30),
  externalRegistrationUrl: z.string().trim().url().refine(value => value.startsWith('http://') || value.startsWith('https://'), 'Tautan pendaftaran harus menggunakan HTTP atau HTTPS.').nullable().default(null),
  status: z.enum(activityStatuses)
})

const validateActivityFields = (value: z.infer<typeof activityFieldsSchema>, context: z.RefinementCtx): void => {
  const isPublished = value.status === 'PUBLISHED'
  if (isPublished) {
    if (!value.title) context.addIssue({ code: 'custom', path: ['title'], message: 'Judul wajib diisi sebelum kegiatan dipublikasikan.' })
    if (!value.slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value.slug)) context.addIssue({ code: 'custom', path: ['slug'], message: 'Slug wajib diisi sebelum kegiatan dipublikasikan.' })
    if (value.type === 'LOMBA' && !value.registrationOpensAt) context.addIssue({ code: 'custom', path: ['registrationOpensAt'], message: 'Pembukaan pendaftaran wajib diisi sebelum lomba dipublikasikan.' })
    if (value.type === 'LOMBA' && !value.registrationClosesAt) context.addIssue({ code: 'custom', path: ['registrationClosesAt'], message: 'Penutupan pendaftaran wajib diisi sebelum lomba dipublikasikan.' })
  }

  if (value.endsAt && value.startsAt && value.endsAt <= value.startsAt) {
    context.addIssue({ code: 'custom', path: ['endsAt'], message: 'Waktu selesai harus setelah waktu mulai.' })
  }

  if (value.registrationClosesAt && value.registrationOpensAt && value.registrationClosesAt <= value.registrationOpensAt) {
    context.addIssue({ code: 'custom', path: ['registrationClosesAt'], message: 'Penutupan pendaftaran harus setelah pembukaan.' })
  }

  if (isPublished && value.registrationMode === 'INDIVIDUAL' && (value.minTeamMembers !== null || value.maxTeamMembers !== null)) {
    context.addIssue({ code: 'custom', path: ['registrationMode'], message: 'Batas anggota hanya boleh diisi untuk mode tim.' })
  }

  if (isPublished && value.registrationMode === 'TEAM' && (!value.minTeamMembers || !value.maxTeamMembers || value.maxTeamMembers < value.minTeamMembers)) {
    context.addIssue({ code: 'custom', path: ['maxTeamMembers'], message: 'Batas anggota tim tidak valid.' })
  }

  const keys = value.registrationFields.map(field => field.key)
  if (new Set(keys).size !== keys.length) {
    context.addIssue({ code: 'custom', path: ['registrationFields'], message: 'Key field tidak boleh duplikat.' })
  }
  if (value.type === 'LOMBA' && isPublished) {
    for (const field of defaultRegistrationFields(value.registrationMode)) {
      const configured = value.registrationFields.find(candidate => candidate.key === field.key)
      if (!configured || configured.type !== field.type) {
        context.addIssue({ code: 'custom', path: ['registrationFields'], message: `Field bawaan ${field.label} wajib tersedia dengan tipe ${field.type}.` })
      } else if (field.required && !configured.required) {
        context.addIssue({ code: 'custom', path: ['registrationFields'], message: `Field inti ${field.label} harus tetap wajib diisi.` })
      }
    }
  }
  for (const field of value.registrationFields) {
    if ((field.type === 'select' || field.type === 'radio') && !field.options?.length) {
      context.addIssue({ code: 'custom', path: ['registrationFields'], message: `Field ${field.label} harus memiliki minimal satu pilihan.` })
    }
  }
  if (value.type === 'EVENT' && value.registrationFields.length > 0) {
    context.addIssue({ code: 'custom', path: ['registrationFields'], message: 'Event tidak dapat memiliki field pendaftaran.' })
  }
  if (value.type === 'EVENT' && value.externalRegistrationUrl) {
    context.addIssue({ code: 'custom', path: ['externalRegistrationUrl'], message: 'Tautan pendaftaran eksternal hanya tersedia untuk lomba.' })
  }
}

export const activityInputSchema = activityFieldsSchema
  .transform(value => value.status === 'PUBLISHED' && value.type === 'LOMBA' && value.registrationFields.length === 0
    ? { ...value, registrationFields: defaultRegistrationFields(value.registrationMode) }
    : value)
  .superRefine(validateActivityFields)

export const activityPatchSchema = activityFieldsSchema.partial()

export const operatorAssignmentSchema = z.object({
  userIds: z.array(z.number().int().positive()).max(100)
})

export const activityIdSchema = z.coerce.number().int().positive()

export const getActivityId = (event: H3Event): number => {
  const parsedId = activityIdSchema.safeParse(getRouterParam(event, 'id'))

  if (!parsedId.success) {
    throw createError({ statusCode: 400, statusMessage: 'ID kegiatan tidak valid.' })
  }

  return parsedId.data
}

export const getActivityOrThrow = async (activityId: number) => {
  const record = await db.activity.findUnique({ where: { id: activityId } })

  if (!record) {
    throw createError({ statusCode: 404, statusMessage: 'Kegiatan tidak ditemukan.' })
  }

  return { ...record, registrationFields: parseRegistrationFields(record.registrationFields) }
}

export const activityRecord = (record: Activity) => {
  const fields = parseRegistrationFields(record.registrationFields)
  return { ...record, registrationFields: record.status === 'PUBLISHED' && record.type === 'LOMBA' && fields.length === 0 ? defaultRegistrationFields(record.registrationMode) : fields }
}

export const activityPayload = (activity: Activity & { registrationFields: RegistrationField[] }) => ({
  ...activity,
  juknis: activity.juknisStorageName ? {
    name: activity.juknisFileName,
    mimeType: activity.juknisMimeType,
    size: activity.juknisSize,
    url: `/api/admin/activities/${activity.id}/juknis`
  } : null,
  startsAt: activity.startsAt?.toISOString() ?? null,
  endsAt: activity.endsAt?.toISOString() ?? null,
  registrationOpensAt: activity.registrationOpensAt?.toISOString() ?? null,
  registrationClosesAt: activity.registrationClosesAt?.toISOString() ?? null
})
