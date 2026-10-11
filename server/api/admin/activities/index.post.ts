import { createError, defineEventHandler, readBody } from 'h3'
import { db } from '../../../database/client'
import { Prisma } from '../../../generated/prisma/client'
import { assertSameOrigin } from '../../../utils/auth'
import { requireSuperAdmin } from '../../../utils/authorization'
import { activityInputSchema, activityPayload, activitySlugFromTitle, uniqueActivitySlug } from '../../../utils/activity'

export default defineEventHandler(async (event) => {
  assertSameOrigin(event)
  const user = await requireSuperAdmin(event)
  const body = await readBody<Record<string, unknown>>(event)
  if (typeof body?.title === 'string' && (typeof body.slug !== 'string' || !body.slug.trim() || body.slug === activitySlugFromTitle(body.title))) {
    body.slug = await uniqueActivitySlug(body.title)
  }
  const parsedInput = activityInputSchema.safeParse(body)

  if (!parsedInput.success) {
    throw createError({ statusCode: 400, statusMessage: 'Data kegiatan tidak valid.' })
  }

  const existing = parsedInput.data.slug
    ? await db.activity.findUnique({ where: { slug: parsedInput.data.slug }, select: { id: true } })
    : null

  if (existing) {
    throw createError({ statusCode: 409, statusMessage: 'Slug kegiatan sudah digunakan.' })
  }

  const activity = await db.activity.create({ data: { ...parsedInput.data, registrationFields: parsedInput.data.registrationFields as Prisma.InputJsonValue, createdBy: user.id } })

  return { activity: activityPayload({ ...activity, registrationFields: parsedInput.data.registrationFields }) }
})
