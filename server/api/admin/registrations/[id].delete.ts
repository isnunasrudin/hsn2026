import { eq } from 'drizzle-orm'
import { createError, defineEventHandler } from 'h3'
import { db, sqliteClient } from '../../../database/client'
import { registrationMembers, registrations } from '../../../database/schema'
import { assertSameOrigin } from '../../../utils/auth'
import { requireActivityAccess } from '../../../utils/authorization'
import { removeRegistrationUpload } from '../../../utils/registration-upload'

export default defineEventHandler(async (event) => {
  assertSameOrigin(event)
  const id = Number(event.context.params?.id)
  if (!Number.isInteger(id) || id <= 0) throw createError({ statusCode: 400, statusMessage: 'ID pendaftar tidak valid.' })

  const registration = db.select().from(registrations).where(eq(registrations.id, id)).get()
  if (!registration) throw createError({ statusCode: 404, statusMessage: 'Pendaftar tidak ditemukan.' })
  await requireActivityAccess(event, registration.activityId)

  const deleted = sqliteClient.transaction(() => {
    db.delete(registrationMembers).where(eq(registrationMembers.registrationId, id)).run()
    return db.delete(registrations).where(eq(registrations.id, id)).returning({ id: registrations.id }).get()
  }).immediate()

  if (!deleted) throw createError({ statusCode: 404, statusMessage: 'Pendaftar tidak ditemukan.' })
  await removeRegistrationUpload(registration.code)
  return { id: deleted.id }
})
