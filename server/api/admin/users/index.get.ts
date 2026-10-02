import { asc, like } from 'drizzle-orm'
import { defineEventHandler, getQuery } from 'h3'
import { z } from 'zod'
import { db } from '../../../database/client'
import { users } from '../../../database/schema'
import { requireSuperAdmin } from '../../../utils/authorization'
import { publicUser } from '../../../utils/user'

const querySchema = z.object({
  search: z.string().trim().max(120).optional()
})

export default defineEventHandler(async (event) => {
  await requireSuperAdmin(event)
  const query = querySchema.parse(getQuery(event))
  const search = query.search ? `%${query.search}%` : null
  const records = db
    .select()
    .from(users)
    .where(search ? like(users.name, search) : undefined)
    .orderBy(asc(users.name))
    .all()

  return { users: records.map(publicUser) }
})
