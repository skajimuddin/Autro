CREATE TABLE `customers` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant_id` text NOT NULL,
	`name` text NOT NULL,
	`phone` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`deleted_at` text,
	FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_customers_phone` ON `customers` (`tenant_id`,`phone`);--> statement-breakpoint
CREATE UNIQUE INDEX `unique_tenant_phone` ON `customers` (`tenant_id`,`phone`);--> statement-breakpoint
CREATE TABLE `service_visits` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant_id` text NOT NULL,
	`vehicle_id` text NOT NULL,
	`complaint` text,
	`status` text DEFAULT 'NEW' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`delivered_at` text,
	`deleted_at` text,
	FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_visits_vehicle` ON `service_visits` (`tenant_id`,`vehicle_id`);--> statement-breakpoint
CREATE INDEX `idx_visits_status` ON `service_visits` (`tenant_id`,`status`);--> statement-breakpoint
CREATE TABLE `vehicle_images` (
	`id` text PRIMARY KEY NOT NULL,
	`vehicle_id` text NOT NULL,
	`image_url` text NOT NULL,
	`uploaded_at` text NOT NULL,
	FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `vehicles` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant_id` text NOT NULL,
	`customer_id` text NOT NULL,
	`registration_number` text NOT NULL,
	`name` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`deleted_at` text,
	FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_vehicles_reg` ON `vehicles` (`tenant_id`,`registration_number`);--> statement-breakpoint
CREATE UNIQUE INDEX `unique_tenant_reg` ON `vehicles` (`tenant_id`,`registration_number`);--> statement-breakpoint
CREATE INDEX `idx_members_user` ON `tenant_members` (`user_id`);