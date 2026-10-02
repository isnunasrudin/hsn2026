import { defineEventHandler } from 'h3'
import { assertSameOrigin } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  assertSameOrigin(event)
  await clearUserSession(event)

  return { success: true }
})
