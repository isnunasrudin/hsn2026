import { mkdir, writeFile } from 'node:fs/promises'
import { extname, join } from 'node:path'
import { randomUUID } from 'node:crypto'
import { createError, defineEventHandler, getRouterParam, readBody, readMultipartFormData } from 'h3'
import { z } from 'zod'
import { Prisma } from '../../../../generated/prisma/client'
import { db } from '../../../../database/client'
import { parseRegistrationFields } from '../../../../database/schema'
import { assertSameOrigin } from '../../../../utils/auth'
import { assertRegistrationAnswers, getQuotaUsed, getRegistrationState, makeRegistrationCode, normalizePhone } from '../../../../utils/registration'
import { registrationUploadDirectory } from '../../../../utils/registration-upload'

const registrationSchema = z.object({
  registrantName: z.string().trim().min(2).max(160),
  email: z.email().transform(value => value.toLowerCase()),
  phone: z.string().trim().min(8).max(30),
  institution: z.string().trim().max(180).optional().default(''),
  teamName: z.string().trim().max(180).optional().default(''),
  participantCount: z.number().int().positive().max(1000).default(1),
  answers: z.record(z.string(), z.unknown()).default({}),
  members: z.array(z.object({ name: z.string().trim().min(2).max(160), identityNumber: z.string().trim().max(80).optional().default('') })).max(100).default([])
})

const matchesAccept = (accept: string | undefined, filename: string, mimeType: string): boolean => {
  if (!accept) return true
  const extension = extname(filename).toLowerCase()
  return accept.split(',').some(value => {
    const rule = value.trim().toLowerCase()
    return rule === mimeType.toLowerCase() || (rule.endsWith('/*') && mimeType.toLowerCase().startsWith(`${rule.slice(0, -1)}`)) || rule === extension
  })
}

export default defineEventHandler(async (event) => {
  assertSameOrigin(event)
  const slug = getRouterParam(event, 'slug')
  const activityRecord = slug ? await db.activity.findUnique({ where: { slug } }) : null

  if (!activityRecord || activityRecord.status !== 'PUBLISHED') throw createError({ statusCode: 404, statusMessage: 'Kegiatan tidak ditemukan.' })
  const activity = { ...activityRecord, registrationFields: parseRegistrationFields(activityRecord.registrationFields) }
  if (activity.type === 'EVENT') throw createError({ statusCode: 422, statusMessage: 'Event tidak menggunakan pendaftaran peserta.' })

  const multipart = await readMultipartFormData(event)
  const rawBody: Record<string, unknown> = multipart
    ? Object.fromEntries(multipart.filter(part => !part.filename).map(part => [part.name, part.data.toString('utf8')]))
    : await readBody<Record<string, unknown>>(event)
  const parseJsonField = (value: unknown): unknown => {
    if (typeof value !== 'string') return value
    try {
      return JSON.parse(value)
    } catch {
      return undefined
    }
  }
  const parsedInput = registrationSchema.safeParse({
    ...rawBody,
    participantCount: typeof rawBody.participantCount === 'string' ? Number(rawBody.participantCount) : rawBody.participantCount,
    answers: parseJsonField(rawBody.answers),
    members: parseJsonField(rawBody.members)
  })
  if (!parsedInput.success) throw createError({ statusCode: 400, statusMessage: 'Data pendaftaran tidak valid.' })

  const input = parsedInput.data
  const fileAnswers: Record<string, { token: string; name: string; size: number; type: string }> = {}
  const fileParts = multipart?.filter(part => part.filename && part.name.startsWith('file_')) ?? []
  for (const field of activity.registrationFields.filter(field => field.type === 'file')) {
    const part = fileParts.find(candidate => candidate.name === `file_${field.key}`)
    if (!part) {
      if (field.required) throw createError({ statusCode: 400, statusMessage: `${field.label} wajib diisi.` })
      continue
    }
    if (part.data.length > 5 * 1024 * 1024) throw createError({ statusCode: 413, statusMessage: `${field.label} maksimal berukuran 5 MB.` })
    const originalName = part.filename ?? 'file'
    if (!matchesAccept(field.accept, originalName, part.type || 'application/octet-stream')) throw createError({ statusCode: 400, statusMessage: `Jenis file ${field.label} tidak sesuai.` })
    fileAnswers[field.key] = { token: '', name: originalName, size: part.data.length, type: part.type || 'application/octet-stream' }
  }
  const answersWithFiles = { ...input.answers, ...fileAnswers }
  const phone = normalizePhone(input.phone)
  if (phone.length < 8) throw createError({ statusCode: 400, statusMessage: 'Nomor telepon tidak valid.' })
  const answers = assertRegistrationAnswers(activity, answersWithFiles)

  if (activity.registrationMode === 'TEAM') {
    if (!input.teamName) throw createError({ statusCode: 400, statusMessage: 'Nama tim wajib diisi.' })
    if (input.participantCount < (activity.minTeamMembers ?? 1) || input.participantCount > (activity.maxTeamMembers ?? 100)) throw createError({ statusCode: 400, statusMessage: 'Jumlah anggota tim di luar batas.' })
    if (input.members.length !== input.participantCount) throw createError({ statusCode: 400, statusMessage: 'Data anggota harus sesuai jumlah peserta.' })
  } else if (input.participantCount !== 1) {
    throw createError({ statusCode: 400, statusMessage: 'Pendaftaran individu hanya menerima satu peserta.' })
  }

  const code = makeRegistrationCode()
  const uploadDirectory = registrationUploadDirectory(code)
  for (const field of activity.registrationFields.filter(field => field.type === 'file')) {
    const part = fileParts.find(candidate => candidate.name === `file_${field.key}`)
    if (!part) continue
    const token = `${field.key}-${randomUUID()}${extname(part.filename ?? '').toLowerCase()}`
    await mkdir(uploadDirectory, { recursive: true })
    await writeFile(join(uploadDirectory, token), part.data, { flag: 'wx' })
    ;(answers as Record<string, unknown>)[field.key] = { ...fileAnswers[field.key], token }
  }

  const result = await db.$transaction(async transaction => {
    const currentActivity = await transaction.activity.findUnique({ where: { id: activity.id } })
    if (!currentActivity) throw createError({ statusCode: 404, statusMessage: 'Kegiatan tidak ditemukan.' })
    const where = { activityId: currentActivity.id, status: { in: ['PENDING', 'VERIFIED'] as const } }
    const used = currentActivity.quotaMode === 'PERSON'
      ? (await transaction.registration.aggregate({ where, _sum: { participantCount: true } }))._sum.participantCount ?? 0
      : await transaction.registration.count({ where })
    const state = getRegistrationState(currentActivity, used)
    const requestedSlots = currentActivity.quotaMode === 'PERSON' ? input.participantCount : 1

    if (state !== 'OPEN' || (currentActivity.capacity !== null && used + requestedSlots > currentActivity.capacity)) throw createError({ statusCode: 409, statusMessage: state === 'FULL' ? 'Kuota kegiatan sudah penuh.' : 'Pendaftaran sedang tidak dibuka.' })

    const duplicate = await transaction.registration.findFirst({ where: { ...where, email: input.email }, select: { id: true } })
    const duplicatePhone = await transaction.registration.findFirst({ where: { ...where, phone }, select: { id: true } })

    if (duplicate || duplicatePhone) throw createError({ statusCode: 409, statusMessage: 'Email atau nomor telepon sudah terdaftar pada kegiatan ini.' })

    const registration = await transaction.registration.create({ data: {
      code,
      activityId: currentActivity.id,
      registrantName: input.registrantName,
      email: input.email,
      phone,
      institution: input.institution || null,
      teamName: input.teamName || null,
      participantCount: input.participantCount,
      answers: answers as Prisma.InputJsonValue,
      members: { create: input.members.map(member => ({ name: member.name, identityNumber: member.identityNumber || null })) }
    } })
    return registration
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable })

  return { code: result.code, activity: { title: activity.title, slug: activity.slug } }
})
