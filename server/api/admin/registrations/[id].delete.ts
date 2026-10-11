import { createError, defineEventHandler } from 'h3'
import { db } from '../../../database/client'
import { assertSameOrigin } from '../../../utils/auth'
import { requireActivityAccess } from '../../../utils/authorization'
import { removeRegistrationUpload } from '../../../utils/registration-upload'

export default defineEventHandler(async (event) => {
  assertSameOrigin(event)
  const id = Number(event.context.params?.id)
  if (!Number.isInteger(id) || id <= 0) throw createError({ statusCode: 400, statusMessage: 'ID pendaftar tidak valid.' })

  const registration = await db.registration.findUnique({ where: { id } })
  if (!registration) throw createError({ statusCode: 404, statusMessage: 'Pendaftar tidak ditemukan.' })
  await requireActivityAccess(event, registration.activityId)

  const deleted = await db.registration.delete({ where: { id }, select: { id: true } })
  await removeRegistrationUpload(registration.code)
  return { id: deleted.id }
})
