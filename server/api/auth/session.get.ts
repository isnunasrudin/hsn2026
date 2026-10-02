import { defineEventHandler } from 'h3'
import { getOptionalAuthenticatedUser } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const user = await getOptionalAuthenticatedUser(event)

  if (!user) {
    return { user: null }
  }

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    }
  }
})
