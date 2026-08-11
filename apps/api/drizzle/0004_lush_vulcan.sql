CREATE TABLE `staff_invites` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant_id` text NOT NULL,
	`email` text NOT NULL,
	`role` text DEFAULT 'STAFF' NOT NULL,
	`token` text NOT NULL,
	`status` text DEFAULT 'PENDING' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `staff_invites_token_unique` ON `staff_invites` (`token`);--> statement-breakpoint
CREATE INDEX `idx_staff_invites_token` ON `staff_invites` (`token`);