import { createError, defineEventHandler, readBody } from 'h3'
import { db } from '../../../database/client'
import { Prisma } from '../../../generated/prisma/client'
import { assertSameOrigin } from '../../../utils/auth'
import { requireSuperAdmin } from '../../../utils/authorization'
import { activityInputSchema, activityPayload } from '../../../utils/activity'

export default defineEventHandler(async (event) => {
  assertSameOrigin(event)
  const user = await requireSuperAdmin(event)
  const parsedInput = activityInputSchema.safeParse(await readBody(event))

  if (!parsedInput.success) {
    throw createError({ statusCode: 400, statusMessage: 'Data kegiatan tidak valid.' })
  }

  const existing = await db.activity.findUnique({ where: { slug: parsedInput.data.slug }, select: { id: true } })

  if (existing) {
    throw createError({ statusCode: 409, statusMessage: 'Slug kegiatan sudah digunakan.' })
  }

  const activity = await db.activity.create({ data: { ...parsedInput.data, registrationFields: parsedInput.data.registrationFields as Prisma.InputJsonValue, createdBy: user.id } })

  return { activity: activityPayload({ ...activity, registrationFields: parsedInput.data.registrationFields }) }
})
