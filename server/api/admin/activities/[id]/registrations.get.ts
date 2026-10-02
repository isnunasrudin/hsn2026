import { and, asc, eq, inArray, like, or } from 'drizzle-orm'
import { defineEventHandler, getQuery } from 'h3'
import { z } from 'zod'
import { db } from '../../../../database/client'
import { activities, registrationMembers, registrations, registrationStatuses } from '../../../../database/schema'
import { requireActivityAccess } from '../../../../utils/authorization'
import { getActivityId, getActivityOrThrow } from '../../../../utils/activity'

const querySchema = z.object({
  q: z.string().trim().max(120).optional().default(''),
  status: z.enum(registrationStatuses).optional()
})

export default defineEventHandler(async (event) => {
  const activityId = getActivityId(event)
  await requireActivityAccess(event, activityId)
  const activity = getActivityOrThrow(activityId)
  const query = querySchema.parse(getQuery(event))
  const conditions = [eq(registrations.activityId, activityId)]

  if (query.status) conditions.push(eq(registrations.status, query.status))
  if (query.q) {
    const term = `%${query.q}%`
    conditions.push(or(
      like(registrations.code, term),
      like(registrations.registrantName, term),
      like(registrations.email, term),
      like(registrations.phone, term)
    )!)
  }

  const records = db.select().from(registrations).where(and(...conditions)).orderBy(asc(registrations.createdAt)).all()
  const ids = records.map(registration => registration.id)
  const members = ids.length === 0
    ? []
    : db.select().from(registrationMembers).where(inArray(registrationMembers.registrationId, ids)).all()
  const membersByRegistration = new Map<number, typeof members>()

  for (const member of members) {
    const current = membersByRegistration.get(member.registrationId) ?? []
    current.push(member)
    membersByRegistration.set(member.registrationId, current)
  }

  return {
    activity: { id: activity.id, title: activity.title, slug: activity.slug },
    total: records.length,
    registrations: records.map(registration => ({
      ...registration,
      createdAt: registration.createdAt.toISOString(),
      updatedAt: registration.updatedAt.toISOString(),
      verifiedAt: registration.verifiedAt?.toISOString() ?? null,
      members: membersByRegistration.get(registration.id) ?? []
    }))
  }
})
