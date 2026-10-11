import { defineEventHandler, getQuery } from 'h3'
import { z } from 'zod'
import { db } from '../../../../database/client'
import { registrationStatuses } from '../../../../database/schema'
import { requireActivityAccess } from '../../../../utils/authorization'
import { getActivityId, getActivityOrThrow } from '../../../../utils/activity'

const querySchema = z.object({
  q: z.string().trim().max(120).optional().default(''),
  status: z.enum(registrationStatuses).optional()
})

export default defineEventHandler(async (event) => {
  const activityId = getActivityId(event)
  await requireActivityAccess(event, activityId)
  const activity = await getActivityOrThrow(activityId)
  const query = querySchema.parse(getQuery(event))
  const records = await db.registration.findMany({
    where: {
      activityId,
      ...(query.status ? { status: query.status } : {}),
      ...(query.q ? {
        OR: [
          { code: { contains: query.q, mode: 'insensitive' as const } },
          { registrantName: { contains: query.q, mode: 'insensitive' as const } },
          { email: { contains: query.q, mode: 'insensitive' as const } },
          { phone: { contains: query.q, mode: 'insensitive' as const } }
        ]
      } : {})
    },
    include: { members: true },
    orderBy: { createdAt: 'asc' }
  })

  return {
    activity: { id: activity.id, title: activity.title, slug: activity.slug },
    total: records.length,
    registrations: records.map(registration => ({
      ...registration,
      createdAt: registration.createdAt.toISOString(),
      updatedAt: registration.updatedAt.toISOString(),
      verifiedAt: registration.verifiedAt?.toISOString() ?? null,
      members: registration.members
    }))
  }
})
