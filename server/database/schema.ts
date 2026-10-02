import { sql } from 'drizzle-orm'
import {
  check,
  index,
  integer,
  primaryKey,
  real,
  sqliteTable,
  text,
  uniqueIndex
} from 'drizzle-orm/sqlite-core'

export const userRoles = ['SUPER_ADMIN', 'OPERATOR'] as const
export const activityTypes = ['LOMBA', 'EVENT'] as const
export const activityStatuses = ['DRAFT', 'PUBLISHED', 'CLOSED', 'CANCELLED'] as const
export const registrationModes = ['INDIVIDUAL', 'TEAM'] as const
export const quotaModes = ['REGISTRATION', 'PERSON'] as const
export const registrationStatuses = ['PENDING', 'VERIFIED', 'REJECTED', 'CANCELLED'] as const
export const registrationFieldTypes = ['text', 'textarea', 'number', 'select', 'radio', 'checkbox', 'file'] as const

export type RegistrationField = {
  readonly key: string
  readonly label: string
  readonly type: typeof registrationFieldTypes[number]
  readonly required: boolean
  readonly options?: readonly string[]
  readonly accept?: string
}

const createdAt = () => integer('created_at', { mode: 'timestamp_ms' })
  .notNull()
  .default(sql`(unixepoch() * 1000)`)

const updatedAt = () => integer('updated_at', { mode: 'timestamp_ms' })
  .notNull()
  .default(sql`(unixepoch() * 1000)`)

export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role: text('role', { enum: userRoles }).notNull(),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  lastLoginAt: integer('last_login_at', { mode: 'timestamp_ms' }),
  createdAt: createdAt(),
  updatedAt: updatedAt()
}, (table) => [
  check('users_name_not_empty', sql`length(trim(${table.name})) > 0`),
  check('users_email_lowercase', sql`${table.email} = lower(${table.email})`),
  check('users_role_valid', sql`${table.role} in ('SUPER_ADMIN', 'OPERATOR')`)
])

export const activities = sqliteTable('activities', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  type: text('type', { enum: activityTypes }).notNull(),
  title: text('title').notNull(),
  organizer: text('organizer'),
  slug: text('slug').notNull().unique(),
  description: text('description'),
  image: text('image'),
  imageZoom: real('image_zoom').notNull().default(1),
  imagePosition: text('image_position').notNull().default('right center'),
  displayOrder: integer('display_order').notNull().default(0),
  location: text('location'),
  startsAt: integer('starts_at', { mode: 'timestamp_ms' }).notNull(),
  endsAt: integer('ends_at', { mode: 'timestamp_ms' }),
  registrationOpensAt: integer('registration_opens_at', { mode: 'timestamp_ms' }).notNull(),
  registrationClosesAt: integer('registration_closes_at', { mode: 'timestamp_ms' }).notNull(),
  registrationMode: text('registration_mode', { enum: registrationModes }).notNull(),
  quotaMode: text('quota_mode', { enum: quotaModes }).notNull(),
  capacity: integer('capacity'),
  minTeamMembers: integer('min_team_members'),
  maxTeamMembers: integer('max_team_members'),
  registrationFields: text('registration_fields', { mode: 'json' })
    .$type<readonly RegistrationField[]>()
    .notNull()
    .default(sql`'[]'`),
  status: text('status', { enum: activityStatuses }).notNull().default('DRAFT'),
  createdBy: integer('created_by').notNull().references(() => users.id, { onDelete: 'restrict' }),
  createdAt: createdAt(),
  updatedAt: updatedAt()
}, (table) => [
  index('activities_status_starts_at_idx').on(table.status, table.startsAt),
  check('activities_title_not_empty', sql`length(trim(${table.title})) > 0`),
  check('activities_slug_not_empty', sql`length(trim(${table.slug})) > 0`),
  check('activities_image_zoom_positive', sql`${table.imageZoom} > 0`),
  check('activities_end_after_start', sql`${table.endsAt} is null or ${table.endsAt} > ${table.startsAt}`),
  check('activities_registration_window_valid', sql`${table.registrationClosesAt} > ${table.registrationOpensAt}`),
  check('activities_capacity_positive', sql`${table.capacity} is null or ${table.capacity} > 0`),
  check('activities_type_valid', sql`${table.type} in ('LOMBA', 'EVENT')`),
  check('activities_registration_mode_valid', sql`${table.registrationMode} in ('INDIVIDUAL', 'TEAM')`),
  check('activities_quota_mode_valid', sql`${table.quotaMode} in ('REGISTRATION', 'PERSON')`),
  check('activities_status_valid', sql`${table.status} in ('DRAFT', 'PUBLISHED', 'CLOSED', 'CANCELLED')`),
  check('activities_registration_fields_json', sql`json_valid(${table.registrationFields})`),
  check(
    'activities_team_limits_valid',
    sql`(${table.registrationMode} = 'INDIVIDUAL' and ${table.minTeamMembers} is null and ${table.maxTeamMembers} is null) or (${table.registrationMode} = 'TEAM' and ${table.minTeamMembers} > 0 and ${table.maxTeamMembers} >= ${table.minTeamMembers})`
  )
])

export const activityUsers = sqliteTable('activity_users', {
  activityId: integer('activity_id').notNull().references(() => activities.id, { onDelete: 'cascade' }),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: createdAt()
}, (table) => [
  primaryKey({ columns: [table.activityId, table.userId] }),
  index('activity_users_user_id_idx').on(table.userId)
])

export const registrations = sqliteTable('registrations', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  code: text('code').notNull().unique(),
  activityId: integer('activity_id').notNull().references(() => activities.id, { onDelete: 'restrict' }),
  registrantName: text('registrant_name').notNull(),
  email: text('email').notNull(),
  phone: text('phone').notNull(),
  institution: text('institution'),
  teamName: text('team_name'),
  participantCount: integer('participant_count').notNull().default(1),
  answers: text('answers', { mode: 'json' })
    .$type<Readonly<Record<string, string | number | boolean | readonly string[] | { token: string; name: string; size: number; type: string }>>>()
    .notNull()
    .default(sql`'{}'`),
  status: text('status', { enum: registrationStatuses }).notNull().default('PENDING'),
  operatorNotes: text('operator_notes'),
  verifiedBy: integer('verified_by').references(() => users.id, { onDelete: 'set null' }),
  verifiedAt: integer('verified_at', { mode: 'timestamp_ms' }),
  createdAt: createdAt(),
  updatedAt: updatedAt()
}, (table) => [
  index('registrations_activity_status_idx').on(table.activityId, table.status),
  index('registrations_activity_created_at_idx').on(table.activityId, table.createdAt),
  uniqueIndex('registrations_active_email_unique')
    .on(table.activityId, table.email)
    .where(sql`${table.status} in ('PENDING', 'VERIFIED')`),
  uniqueIndex('registrations_active_phone_unique')
    .on(table.activityId, table.phone)
    .where(sql`${table.status} in ('PENDING', 'VERIFIED')`),
  check('registrations_name_not_empty', sql`length(trim(${table.registrantName})) > 0`),
  check('registrations_email_lowercase', sql`${table.email} = lower(${table.email})`),
  check('registrations_phone_not_empty', sql`length(trim(${table.phone})) > 0`),
  check('registrations_participant_count_positive', sql`${table.participantCount} > 0`),
  check('registrations_status_valid', sql`${table.status} in ('PENDING', 'VERIFIED', 'REJECTED', 'CANCELLED')`),
  check('registrations_answers_json', sql`json_valid(${table.answers})`)
])

export const registrationMembers = sqliteTable('registration_members', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  registrationId: integer('registration_id').notNull().references(() => registrations.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  identityNumber: text('identity_number'),
  metadata: text('metadata', { mode: 'json' })
    .$type<Readonly<Record<string, string | number | boolean>>>()
    .notNull()
    .default(sql`'{}'`)
}, (table) => [
  index('registration_members_registration_id_idx').on(table.registrationId),
  check('registration_members_name_not_empty', sql`length(trim(${table.name})) > 0`),
  check('registration_members_metadata_json', sql`json_valid(${table.metadata})`)
])

export const loginAttempts = sqliteTable('login_attempts', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  email: text('email').notNull(),
  ipAddress: text('ip_address').notNull(),
  attemptedAt: integer('attempted_at', { mode: 'timestamp_ms' })
    .notNull()
    .default(sql`(unixepoch() * 1000)`)
}, (table) => [
  index('login_attempts_email_ip_attempted_at_idx').on(table.email, table.ipAddress, table.attemptedAt),
  check('login_attempts_email_lowercase', sql`${table.email} = lower(${table.email})`)
])
