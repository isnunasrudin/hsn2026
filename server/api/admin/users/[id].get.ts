import { defineEventHandler } from 'h3'
import { requireSuperAdmin } from '../../../utils/authorization'
import { getUserId, getUserOrThrow, publicUser } from '../../../utils/user'

export default defineEventHandler(async (event) => {
  await requireSuperAdmin(event)
  return { user: publicUser(await getUserOrThrow(getUserId(event))) }
})
