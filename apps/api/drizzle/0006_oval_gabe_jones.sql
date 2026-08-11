CREATE TABLE `staff_invites` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant_id` text NOT NULL,
	`invited_by` text NOT NULL,
	`token` text NOT NULL,
	`name` text,
	`role` text DEFAULT 'STAFF' NOT NULL,
	`monthly_salary` real,
	`status` text DEFAULT 'PENDING' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`invited_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `staff_invites_token_unique` ON `staff_invites` (`token`);--> statement-breakpoint
CREATE INDEX `idx_staff_invites_token` ON `staff_invites` (`token`);