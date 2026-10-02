CREATE TABLE `activities` (
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
	CONSTRAINT "activities_title_not_empty" CHECK(length(trim("activities"."title")) > 0),
	CONSTRAINT "activities_slug_not_empty" CHECK(length(trim("activities"."slug")) > 0),
	CONSTRAINT "activities_image_zoom_positive" CHECK("activities"."image_zoom" > 0),
	CONSTRAINT "activities_end_after_start" CHECK("activities"."ends_at" is null or "activities"."ends_at" > "activities"."starts_at"),
	CONSTRAINT "activities_registration_window_valid" CHECK("activities"."registration_closes_at" > "activities"."registration_opens_at"),
	CONSTRAINT "activities_capacity_positive" CHECK("activities"."capacity" is null or "activities"."capacity" > 0),
	CONSTRAINT "activities_team_limits_valid" CHECK(("activities"."registration_mode" = 'INDIVIDUAL' and "activities"."min_team_members" is null and "activities"."max_team_members" is null) or ("activities"."registration_mode" = 'TEAM' and "activities"."min_team_members" > 0 and "activities"."max_team_members" >= "activities"."min_team_members"))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `activities_slug_unique` ON `activities` (`slug`);--> statement-breakpoint
CREATE INDEX `activities_status_starts_at_idx` ON `activities` (`status`,`starts_at`);--> statement-breakpoint
CREATE TABLE `activity_users` (
	`activity_id` integer NOT NULL,
	`user_id` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	PRIMARY KEY(`activity_id`, `user_id`),
	FOREIGN KEY (`activity_id`) REFERENCES `activities`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `activity_users_user_id_idx` ON `activity_users` (`user_id`);--> statement-breakpoint
CREATE TABLE `login_attempts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`email` text NOT NULL,
	`ip_address` text NOT NULL,
	`attempted_at` integer DEFAULT (unixepoch() * 1000) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `login_attempts_email_ip_attempted_at_idx` ON `login_attempts` (`email`,`ip_address`,`attempted_at`);--> statement-breakpoint
CREATE TABLE `registration_members` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`registration_id` integer NOT NULL,
	`name` text NOT NULL,
	`identity_number` text,
	`metadata` text DEFAULT '{}' NOT NULL,
	FOREIGN KEY (`registration_id`) REFERENCES `registrations`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "registration_members_name_not_empty" CHECK(length(trim("registration_members"."name")) > 0)
);
--> statement-breakpoint
CREATE INDEX `registration_members_registration_id_idx` ON `registration_members` (`registration_id`);--> statement-breakpoint
CREATE TABLE `registrations` (
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
	CONSTRAINT "registrations_name_not_empty" CHECK(length(trim("registrations"."registrant_name")) > 0),
	CONSTRAINT "registrations_email_lowercase" CHECK("registrations"."email" = lower("registrations"."email")),
	CONSTRAINT "registrations_phone_not_empty" CHECK(length(trim("registrations"."phone")) > 0),
	CONSTRAINT "registrations_participant_count_positive" CHECK("registrations"."participant_count" > 0)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `registrations_code_unique` ON `registrations` (`code`);--> statement-breakpoint
CREATE INDEX `registrations_activity_status_idx` ON `registrations` (`activity_id`,`status`);--> statement-breakpoint
CREATE INDEX `registrations_activity_created_at_idx` ON `registrations` (`activity_id`,`created_at`);--> statement-breakpoint
CREATE UNIQUE INDEX `registrations_active_email_unique` ON `registrations` (`activity_id`,`email`) WHERE "registrations"."status" in ('PENDING', 'VERIFIED');--> statement-breakpoint
CREATE UNIQUE INDEX `registrations_active_phone_unique` ON `registrations` (`activity_id`,`phone`) WHERE "registrations"."status" in ('PENDING', 'VERIFIED');--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`password_hash` text NOT NULL,
	`role` text NOT NULL,
	`is_active` integer DEFAULT true NOT NULL,
	`last_login_at` integer,
	`created_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch() * 1000) NOT NULL,
	CONSTRAINT "users_name_not_empty" CHECK(length(trim("users"."name")) > 0),
	CONSTRAINT "users_email_lowercase" CHECK("users"."email" = lower("users"."email"))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);