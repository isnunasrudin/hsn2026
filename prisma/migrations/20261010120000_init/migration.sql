CREATE SCHEMA IF NOT EXISTS "public";

CREATE TYPE "user_role" AS ENUM ('SUPER_ADMIN', 'OPERATOR');

CREATE TYPE "activity_type" AS ENUM ('LOMBA', 'EVENT');

CREATE TYPE "activity_status" AS ENUM ('DRAFT', 'PUBLISHED', 'CLOSED', 'CANCELLED');

CREATE TYPE "registration_mode" AS ENUM ('INDIVIDUAL', 'TEAM');

CREATE TYPE "quota_mode" AS ENUM ('REGISTRATION', 'PERSON');

CREATE TYPE "registration_status" AS ENUM ('PENDING', 'VERIFIED', 'REJECTED', 'CANCELLED');

CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "user_role" NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_login_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "activities" (
    "id" SERIAL NOT NULL,
    "type" "activity_type" NOT NULL,
    "title" TEXT NOT NULL,
    "organizer" TEXT,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "juknis_file_name" TEXT,
    "juknis_storage_name" TEXT,
    "juknis_mime_type" TEXT,
    "juknis_size" INTEGER,
    "image" TEXT,
    "image_zoom" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "image_position" TEXT NOT NULL DEFAULT 'right center',
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "location" TEXT,
    "starts_at" TIMESTAMPTZ(3) NOT NULL,
    "ends_at" TIMESTAMPTZ(3),
    "registration_opens_at" TIMESTAMPTZ(3) NOT NULL,
    "registration_closes_at" TIMESTAMPTZ(3) NOT NULL,
    "registration_mode" "registration_mode" NOT NULL,
    "quota_mode" "quota_mode" NOT NULL,
    "capacity" INTEGER,
    "min_team_members" INTEGER,
    "max_team_members" INTEGER,
    "registration_fields" JSONB NOT NULL DEFAULT '[]',
    "status" "activity_status" NOT NULL DEFAULT 'DRAFT',
    "created_by" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "activities_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "activity_users" (
    "activity_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_users_pkey" PRIMARY KEY ("activity_id","user_id")
);

CREATE TABLE "registrations" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "activity_id" INTEGER NOT NULL,
    "registrant_name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "institution" TEXT,
    "team_name" TEXT,
    "participant_count" INTEGER NOT NULL DEFAULT 1,
    "answers" JSONB NOT NULL DEFAULT '{}',
    "status" "registration_status" NOT NULL DEFAULT 'PENDING',
    "operator_notes" TEXT,
    "verified_by" INTEGER,
    "verified_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "registrations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "registration_members" (
    "id" SERIAL NOT NULL,
    "registration_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "identity_number" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "registration_members_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "login_attempts" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "ip_address" TEXT NOT NULL,
    "attempted_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "login_attempts_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

CREATE UNIQUE INDEX "activities_slug_key" ON "activities"("slug");

CREATE INDEX "activities_status_starts_at_idx" ON "activities"("status", "starts_at");

CREATE INDEX "activity_users_user_id_idx" ON "activity_users"("user_id");

CREATE UNIQUE INDEX "registrations_code_key" ON "registrations"("code");

CREATE INDEX "registrations_activity_status_idx" ON "registrations"("activity_id", "status");

CREATE INDEX "registrations_activity_created_at_idx" ON "registrations"("activity_id", "created_at");

CREATE UNIQUE INDEX "registrations_active_email_unique" ON "registrations"("activity_id", "email") WHERE (status IN ('PENDING', 'VERIFIED'));

CREATE UNIQUE INDEX "registrations_active_phone_unique" ON "registrations"("activity_id", "phone") WHERE (status IN ('PENDING', 'VERIFIED'));

CREATE INDEX "registration_members_registration_id_idx" ON "registration_members"("registration_id");

CREATE INDEX "login_attempts_email_ip_attempted_at_idx" ON "login_attempts"("email", "ip_address", "attempted_at");

ALTER TABLE "activities" ADD CONSTRAINT "activities_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "activity_users" ADD CONSTRAINT "activity_users_activity_id_fkey" FOREIGN KEY ("activity_id") REFERENCES "activities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "activity_users" ADD CONSTRAINT "activity_users_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "registrations" ADD CONSTRAINT "registrations_activity_id_fkey" FOREIGN KEY ("activity_id") REFERENCES "activities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "registrations" ADD CONSTRAINT "registrations_verified_by_fkey" FOREIGN KEY ("verified_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "registration_members" ADD CONSTRAINT "registration_members_registration_id_fkey" FOREIGN KEY ("registration_id") REFERENCES "registrations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "users" ADD CONSTRAINT "users_name_not_empty" CHECK (length(trim("name")) > 0);
ALTER TABLE "users" ADD CONSTRAINT "users_email_lowercase" CHECK ("email" = lower("email"));
ALTER TABLE "activities" ADD CONSTRAINT "activities_title_not_empty" CHECK (length(trim("title")) > 0);
ALTER TABLE "activities" ADD CONSTRAINT "activities_slug_not_empty" CHECK (length(trim("slug")) > 0);
ALTER TABLE "activities" ADD CONSTRAINT "activities_image_zoom_positive" CHECK ("image_zoom" > 0);
ALTER TABLE "activities" ADD CONSTRAINT "activities_end_after_start" CHECK ("ends_at" IS NULL OR "ends_at" > "starts_at");
ALTER TABLE "activities" ADD CONSTRAINT "activities_registration_window_valid" CHECK ("registration_closes_at" > "registration_opens_at");
ALTER TABLE "activities" ADD CONSTRAINT "activities_capacity_positive" CHECK ("capacity" IS NULL OR "capacity" > 0);
ALTER TABLE "activities" ADD CONSTRAINT "activities_registration_fields_array" CHECK (jsonb_typeof("registration_fields") = 'array');
ALTER TABLE "activities" ADD CONSTRAINT "activities_team_limits_valid" CHECK (("registration_mode" = 'INDIVIDUAL' AND "min_team_members" IS NULL AND "max_team_members" IS NULL) OR ("registration_mode" = 'TEAM' AND "min_team_members" > 0 AND "max_team_members" >= "min_team_members"));
ALTER TABLE "registrations" ADD CONSTRAINT "registrations_name_not_empty" CHECK (length(trim("registrant_name")) > 0);
ALTER TABLE "registrations" ADD CONSTRAINT "registrations_email_lowercase" CHECK ("email" = lower("email"));
ALTER TABLE "registrations" ADD CONSTRAINT "registrations_phone_not_empty" CHECK (length(trim("phone")) > 0);
ALTER TABLE "registrations" ADD CONSTRAINT "registrations_participant_count_positive" CHECK ("participant_count" > 0);
ALTER TABLE "registrations" ADD CONSTRAINT "registrations_answers_object" CHECK (jsonb_typeof("answers") = 'object');
ALTER TABLE "registration_members" ADD CONSTRAINT "registration_members_name_not_empty" CHECK (length(trim("name")) > 0);
ALTER TABLE "registration_members" ADD CONSTRAINT "registration_members_metadata_object" CHECK (jsonb_typeof("metadata") = 'object');
ALTER TABLE "login_attempts" ADD CONSTRAINT "login_attempts_email_lowercase" CHECK ("email" = lower("email"));
