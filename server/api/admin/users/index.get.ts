import { defineEventHandler, getQuery } from 'h3'
import { z } from 'zod'
import { db } from '../../../database/client'
import { requireSuperAdmin } from '../../../utils/authorization'
import { publicUser } from '../../../utils/user'

const querySchema = z.object({
  search: z.string().trim().max(120).optional()
})

export default defineEventHandler(async (event) => {
  await requireSuperAdmin(event)
  const query = querySchema.parse(getQuery(event))
  const records = await db.user.findMany({
    where: query.search ? { name: { contains: query.search, mode: 'insensitive' } } : {},
    orderBy: { name: 'asc' }
  })

  return { users: records.map(publicUser) }
})
