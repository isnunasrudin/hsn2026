PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_activities` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`type` text NOT NULL,
	`title` text NOT NULL,
	`slug` text NOT NULL,
	`description` text,
	`image` text,
	`image_zoom` real DEFAULT 1 NOT NULL,
	`image_position` text DEFAULT 'right center' NOT NULL,
	`display_order` integer DEFAULT 0 NOT NULL,
	`location` text,
	`starts_at` integer NOT NULL,
	`ends_at` integer,
	`registration_opens_at` integer NOT NULL,
	`registration_closes_at` integer NOT NULL,
	`registration_mode` text NOT NULL,
	`quota_mode` text NOT NULL,
	`capacity` integer,
	`min_team_members` integer,
	`max_team_members` integer,
	`registration_fields` text DEFAULT '[]' NOT NULL,
	`status` text DEFAULT 'DRAFT' NOT NULL,
	`created_by` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE restrict,
	CONSTRAINT "activities_title_not_empty" CHECK(length(trim("__new_activities"."title")) > 0),
	CONSTRAINT "activities_slug_not_empty" CHECK(length(trim("__new_activities"."slug")) > 0),
	CONSTRAINT "activities_image_zoom_positive" CHECK("__new_activities"."image_zoom" > 0),
	CONSTRAINT "activities_end_after_start" CHECK("__new_activities"."ends_at" is null or "__new_activities"."ends_at" > "__new_activities"."starts_at"),
	CONSTRAINT "activities_registration_window_valid" CHECK("__new_activities"."registration_closes_at" > "__new_activities"."registration_opens_at"),
	CONSTRAINT "activities_capacity_positive" CHECK("__new_activities"."capacity" is null or "__new_activities"."capacity" > 0),
	CONSTRAINT "activities_type_valid" CHECK("__new_activities"."type" in ('LOMBA', 'EVENT')),
	CONSTRAINT "activities_registration_mode_valid" CHECK("__new_activities"."registration_mode" in ('INDIVIDUAL', 'TEAM')),
	CONSTRAINT "activities_quota_mode_valid" CHECK("__new_activities"."quota_mode" in ('REGISTRATION', 'PERSON')),
	CONSTRAINT "activities_status_valid" CHECK("__new_activities"."status" in ('DRAFT', 'PUBLISHED', 'CLOSED', 'CANCELLED')),
	CONSTRAINT "activities_registration_fields_json" CHECK(json_valid("__new_activities"."registration_fields")),
	CONSTRAINT "activities_team_limits_valid" CHECK(("__new_activities"."registration_mode" = 'INDIVIDUAL' and "__new_activities"."min_team_members" is null and "__new_activities"."max_team_members" is null) or ("__new_activities"."registration_mode" = 'TEAM' and "__new_activities"."min_team_members" > 0 and "__new_activities"."max_team_members" >= "__new_activities"."min_team_members"))
);
--> statement-breakpoint
INSERT INTO `__new_activities`("id", "type", "title", "slug", "description", "image", "image_zoom", "image_position", "display_order", "location", "starts_at", "ends_at", "registration_opens_at", "registration_closes_at", "registration_mode", "quota_mode", "capacity", "min_team_members", "max_team_members", "registration_fields", "status", "created_by", "created_at", "updated_at") SELECT "id", "type", "title", "slug", "description", "image", "image_zoom", "image_position", "display_order", "location", "starts_at", "ends_at", "registration_opens_at", "registration_closes_at", "registration_mode", "quota_mode", "capacity", "min_team_members", "max_team_members", "registration_fields", "status", "created_by", "created_at", "updated_at" FROM `activities`;--> statement-breakpoint
DROP TABLE `activities`;--> statement-breakpoint
ALTER TABLE `__new_activities` RENAME TO `activities`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `activities_slug_unique` ON `activities` (`slug`);--> statement-breakpoint
CREATE INDEX `activities_status_starts_at_idx` ON `activities` (`status`,`starts_at`);--> statement-breakpoint
CREATE TABLE `__new_login_attempts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`email` text NOT NULL,
	`ip_address` text NOT NULL,
	`attempted_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	CONSTRAINT "login_attempts_email_lowercase" CHECK("__new_login_attempts"."email" = lower("__new_login_attempts"."email"))
);
--> statement-breakpoint
INSERT INTO `__new_login_attempts`("id", "email", "ip_address", "attempted_at") SELECT "id", "email", "ip_address", "attempted_at" FROM `login_attempts`;--> statement-breakpoint
DROP TABLE `login_attempts`;--> statement-breakpoint
ALTER TABLE `__new_login_attempts` RENAME TO `login_attempts`;--> statement-breakpoint
CREATE INDEX `login_attempts_email_ip_attempted_at_idx` ON `login_attempts` (`email`,`ip_address`,`attempted_at`);--> statement-breakpoint
CREATE TABLE `__new_registration_members` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`registration_id` integer NOT NULL,
	`name` text NOT NULL,
	`identity_number` text,
	`metadata` text DEFAULT '{}' NOT NULL,
	FOREIGN KEY (`registration_id`) REFERENCES `registrations`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "registration_members_name_not_empty" CHECK(length(trim("__new_registration_members"."name")) > 0),
	CONSTRAINT "registration_members_metadata_json" CHECK(json_valid("__new_registration_members"."metadata"))
);
--> statement-breakpoint
INSERT INTO `__new_registration_members`("id", "registration_id", "name", "identity_number", "metadata") SELECT "id", "registration_id", "name", "identity_number", "metadata" FROM `registration_members`;--> statement-breakpoint
DROP TABLE `registration_members`;--> statement-breakpoint
ALTER TABLE `__new_registration_members` RENAME TO `registration_members`;--> statement-breakpoint
CREATE INDEX `registration_members_registration_id_idx` ON `registration_members` (`registration_id`);--> statement-breakpoint
CREATE TABLE `__new_registrations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`code` text NOT NULL,
	`activity_id` integer NOT NULL,
	`registrant_name` text NOT NULL,
	`email` text NOT NULL,
	`phone` text NOT NULL,
	`institution` text,
	`team_name` text,
	`participant_count` integer DEFAULT 1 NOT NULL,
	`answers` text DEFAULT '{}' NOT NULL,
	`status` text DEFAULT 'PENDING' NOT NULL,
	`operator_notes` text,
	`verified_by` integer,
	`verified_at` integer,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	FOREIGN KEY (`activity_id`) REFERENCES `activities`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`verified_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null,
	CONSTRAINT "registrations_name_not_empty" CHECK(length(trim("__new_registrations"."registrant_name")) > 0),
	CONSTRAINT "registrations_email_lowercase" CHECK("__new_registrations"."email" = lower("__new_registrations"."email")),
	CONSTRAINT "registrations_phone_not_empty" CHECK(length(trim("__new_registrations"."phone")) > 0),
	CONSTRAINT "registrations_participant_count_positive" CHECK("__new_registrations"."participant_count" > 0),
	CONSTRAINT "registrations_status_valid" CHECK("__new_registrations"."status" in ('PENDING', 'VERIFIED', 'REJECTED', 'CANCELLED')),
	CONSTRAINT "registrations_answers_json" CHECK(json_valid("__new_registrations"."answers"))
);
--> statement-breakpoint
INSERT INTO `__new_registrations`("id", "code", "activity_id", "registrant_name", "email", "phone", "institution", "team_name", "participant_count", "answers", "status", "operator_notes", "verified_by", "verified_at", "created_at", "updated_at") SELECT "id", "code", "activity_id", "registrant_name", "email", "phone", "institution", "team_name", "participant_count", "answers", "status", "operator_notes", "verified_by", "verified_at", "created_at", "updated_at" FROM `registrations`;--> statement-breakpoint
DROP TABLE `registrations`;--> statement-breakpoint
ALTER TABLE `__new_registrations` RENAME TO `registrations`;--> statement-breakpoint
CREATE UNIQUE INDEX `registrations_code_unique` ON `registrations` (`code`);--> statement-breakpoint
CREATE INDEX `registrations_activity_status_idx` ON `registrations` (`activity_id`,`status`);--> statement-breakpoint
CREATE INDEX `registrations_activity_created_at_idx` ON `registrations` (`activity_id`,`created_at`);--> statement-breakpoint
CREATE UNIQUE INDEX `registrations_active_email_unique` ON `registrations` (`activity_id`,`email`) WHERE "registrations"."status" in ('PENDING', 'VERIFIED');--> statement-breakpoint
CREATE UNIQUE INDEX `registrations_active_phone_unique` ON `registrations` (`activity_id`,`phone`) WHERE "registrations"."status" in ('PENDING', 'VERIFIED');--> statement-breakpoint
CREATE TABLE `__new_users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`password_hash` text NOT NULL,
	`role` text NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`last_login_at` integer,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	CONSTRAINT "users_name_not_empty" CHECK(length(trim("__new_users"."name")) > 0),
	CONSTRAINT "users_email_lowercase" CHECK("__new_users"."email" = lower("__new_users"."email")),
	CONSTRAINT "users_role_valid" CHECK("__new_users"."role" in ('SUPER_ADMIN', 'OPERATOR'))
);
--> statement-breakpoint
INSERT INTO `__new_users`("id", "name", "email", "password_hash", "role", "is_active", "last_login_at", "created_at", "updated_at") SELECT "id", "name", "email", "password_hash", "role", "is_active", "last_login_at", "created_at", "updated_at" FROM `users`;--> statement-breakpoint
DROP TABLE `users`;--> statement-breakpoint
ALTER TABLE `__new_users` RENAME TO `users`;--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);