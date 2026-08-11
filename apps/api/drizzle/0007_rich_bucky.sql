CREATE TABLE `attendance_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant_id` text NOT NULL,
	`member_id` text NOT NULL,
	`date` text NOT NULL,
	`check_in_at` text,
	`check_out_at` text,
	`check_in_lat` real,
	`check_in_lng` real,
	`check_out_lat` real,
	`check_out_lng` real,
	`status` text DEFAULT 'PRESENT' NOT NULL,
	FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`member_id`) REFERENCES `tenant_members`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_attendance_date` ON `attendance_logs` (`tenant_id`,`member_id`,`date`);--> statement-breakpoint
CREATE UNIQUE INDEX `unq_attendance` ON `attendance_logs` (`tenant_id`,`member_id`,`date`);--> statement-breakpoint
CREATE TABLE `qr_codes` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant_id` text NOT NULL,
	`token` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `qr_codes_tenant_id_unique` ON `qr_codes` (`tenant_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `qr_codes_token_unique` ON `qr_codes` (`token`);