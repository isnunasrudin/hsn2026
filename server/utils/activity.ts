import { createError, type H3Event, getRouterParam } from 'h3'
import { z } from 'zod'
import { db } from '../database/client'
import { ActivityStatus, type Activity } from '../generated/prisma/client'
import { activityStatuses, activityTypes, defaultRegistrationFields, parseRegistrationFields, quotaModes, registrationFieldTypes, registrationModes, type RegistrationField } from '../database/schema'

const dateValue = z.union([z.string().min(1), z.date()]).transform(value => value instanceof Date ? new Date(value.getTime()) : new Date(value)).refine(value => !Number.isNaN(value.getTime()), 'Tanggal tidak valid.')
const nullableDateValue = dateValue.nullable()

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
  title: z.string().trim().min(1).max(180),
  organizer: z.string().trim().max(120).nullable(),
  slug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(180),
  description: z.string().trim().max(5000).nullable(),
  image: z.string().trim().max(500).nullable(),
  imageZoom: z.number().positive().max(5),
  imagePosition: z.string().trim().min(1).max(120),
  displayOrder: z.number().int().min(0),
  location: z.string().trim().max(240).nullable(),
  startsAt: dateValue,
  endsAt: nullableDateValue,
  registrationOpensAt: dateValue,
  registrationClosesAt: dateValue,
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
  if (value.endsAt && value.endsAt <= value.startsAt) {
    context.addIssue({ code: 'custom', path: ['endsAt'], message: 'Waktu selesai harus setelah waktu mulai.' })
  }

  if (value.registrationClosesAt <= value.registrationOpensAt) {
    context.addIssue({ code: 'custom', path: ['registrationClosesAt'], message: 'Penutupan pendaftaran harus setelah pembukaan.' })
  }

  if (value.registrationMode === 'INDIVIDUAL' && (value.minTeamMembers !== null || value.maxTeamMembers !== null)) {
    context.addIssue({ code: 'custom', path: ['registrationMode'], message: 'Batas anggota hanya boleh diisi untuk mode tim.' })
  }

  if (value.registrationMode === 'TEAM' && (!value.minTeamMembers || !value.maxTeamMembers || value.maxTeamMembers < value.minTeamMembers)) {
    context.addIssue({ code: 'custom', path: ['maxTeamMembers'], message: 'Batas anggota tim tidak valid.' })
  }

  const keys = value.registrationFields.map(field => field.key)
  if (new Set(keys).size !== keys.length) {
    context.addIssue({ code: 'custom', path: ['registrationFields'], message: 'Key field tidak boleh duplikat.' })
  }
  if (value.type === 'LOMBA') {
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
  .transform(value => value.type === 'LOMBA' && value.registrationFields.length === 0
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
  return { ...record, registrationFields: record.type === 'LOMBA' && fields.length === 0 ? defaultRegistrationFields(record.registrationMode) : fields }
}

export const activityPayload = (activity: Activity & { registrationFields: RegistrationField[] }) => ({
  ...activity,
  juknis: activity.juknisStorageName ? {
    name: activity.juknisFileName,
    mimeType: activity.juknisMimeType,
    size: activity.juknisSize,
    url: `/api/admin/activities/${activity.id}/juknis`
  } : null,
  startsAt: activity.startsAt.toISOString(),
  endsAt: activity.endsAt?.toISOString() ?? null,
  registrationOpensAt: activity.registrationOpensAt.toISOString(),
  registrationClosesAt: activity.registrationClosesAt.toISOString()
})

export const assertStatusTransition = (current: ActivityStatus, next: ActivityStatus): void => {
  type ActivityStatus = typeof activityStatuses[number]
  const allowed: Record<ActivityStatus, readonly ActivityStatus[]> = {
    DRAFT: ['DRAFT', 'PUBLISHED', 'CANCELLED'],
    PUBLISHED: ['PUBLISHED', 'CLOSED', 'CANCELLED'],
    CLOSED: ['CLOSED'],
    CANCELLED: ['CANCELLED']
  }

  if (!allowed[current].includes(next)) {
    throw createError({ statusCode: 422, statusMessage: `Transisi status ${current} ke ${next} tidak diizinkan.` })
  }
}
