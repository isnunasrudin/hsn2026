export const userRoles = ['SUPER_ADMIN', 'OPERATOR'] as const
export const activityTypes = ['LOMBA', 'EVENT'] as const
export const activityStatuses = ['DRAFT', 'PUBLISHED', 'CLOSED', 'CANCELLED'] as const
export const registrationModes = ['INDIVIDUAL', 'TEAM'] as const
export const quotaModes = ['REGISTRATION', 'PERSON'] as const
export const registrationStatuses = ['PENDING', 'VERIFIED', 'REJECTED', 'CANCELLED'] as const
export const registrationFieldTypes = ['text', 'textarea', 'number', 'select', 'radio', 'checkbox', 'file'] as const

import { z } from 'zod'

export type RegistrationField = {
  readonly key: string
  readonly label: string
  readonly type: typeof registrationFieldTypes[number]
  readonly required: boolean
  readonly options?: readonly string[]
  readonly accept?: string
}

export type RegistrationFile = { readonly token: string; readonly name: string; readonly size: number; readonly type: string }
export type RegistrationAnswer = string | number | boolean | readonly string[] | RegistrationFile
export type RegistrationAnswers = Readonly<Record<string, RegistrationAnswer>>

const registrationFieldSchema = z.object({
  key: z.string(),
  label: z.string(),
  type: z.enum(registrationFieldTypes),
  required: z.boolean(),
  options: z.array(z.string()).optional(),
  accept: z.string().optional()
})

export const parseRegistrationFields = (value: unknown): RegistrationField[] => registrationFieldSchema.array().parse(value)
