import { defineEventHandler } from 'h3'
import { db } from '../../database/client'
import { getAuthenticatedUser } from '../../utils/auth'

const total = (query: { get: () => { total: number } | undefined }): number => query.get()?.total ?? 0

export default defineEventHandler(async (event) => {
  const user = await getAuthenticatedUser(event)
  const activityWhere = user.role === 'SUPER_ADMIN' ? {} : { operators: { some: { userId: user.id } } }
  const registrationWhere = user.role === 'SUPER_ADMIN' ? {} : { activity: activityWhere }
  const [activitiesTotal, activitiesDraft, activitiesPublished, registrationsTotal, registrationsPending] = await Promise.all([
    db.activity.count({ where: activityWhere }),
    db.activity.count({ where: { ...activityWhere, status: 'DRAFT' } }),
    db.activity.count({ where: { ...activityWhere, status: 'PUBLISHED' } }),
    db.registration.count({ where: registrationWhere }),
    db.registration.count({ where: { ...registrationWhere, status: 'PENDING' } })
  ])

  return {
    activities: {
      total: activitiesTotal,
      draft: activitiesDraft,
      published: activitiesPublished
    },
    registrations: {
      total: registrationsTotal,
      pending: registrationsPending
    }
  }
})
