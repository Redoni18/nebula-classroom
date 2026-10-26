CREATE TABLE `booking_sessions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`booking_id` text NOT NULL,
	`date` text NOT NULL,
	`start_hour` integer NOT NULL,
	`end_hour` integer NOT NULL,
	FOREIGN KEY (`booking_id`) REFERENCES `bookings`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `booking_sessions_booking` ON `booking_sessions` (`booking_id`);--> statement-breakpoint
CREATE INDEX `booking_sessions_date` ON `booking_sessions` (`date`);--> statement-breakpoint
CREATE TABLE `bookings` (
	`id` text PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`plan` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`name` text NOT NULL,
	`phone` text NOT NULL,
	`email` text,
	`activity` text NOT NULL,
	`group_size` integer,
	`message` text,
	`locale` text NOT NULL,
	`source` text DEFAULT 'web' NOT NULL,
	`total_hours` integer NOT NULL,
	`first_date` text NOT NULL,
	`last_date` text NOT NULL,
	`admin_note` text,
	`ip_hash` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`decided_at` integer,
	`archived_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `bookings_code_unique` ON `bookings` (`code`);--> statement-breakpoint
CREATE INDEX `bookings_status_first_date` ON `bookings` (`status`,`first_date`);--> statement-breakpoint
CREATE INDEX `bookings_ip_created` ON `bookings` (`ip_hash`,`created_at`);--> statement-breakpoint
CREATE TABLE `held_hours` (
	`date` text NOT NULL,
	`hour` integer NOT NULL,
	`booking_id` text NOT NULL,
	PRIMARY KEY(`date`, `hour`),
	FOREIGN KEY (`booking_id`) REFERENCES `bookings`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `held_hours_booking` ON `held_hours` (`booking_id`);