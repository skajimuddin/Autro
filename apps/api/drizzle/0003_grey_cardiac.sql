CREATE TABLE `estimate_items` (
	`id` text PRIMARY KEY NOT NULL,
	`estimate_id` text NOT NULL,
	`description` text NOT NULL,
	`amount` real NOT NULL,
	`quantity` integer DEFAULT 1 NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`estimate_id`) REFERENCES `estimates`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `estimates` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant_id` text NOT NULL,
	`visit_id` text NOT NULL,
	`discount_type` text,
	`discount_value` real DEFAULT 0,
	`tax_enabled` integer DEFAULT 0,
	`tax_percent` real DEFAULT 0,
	`notes` text,
	`status` text DEFAULT 'DRAFT' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`visit_id`) REFERENCES `service_visits`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `invoice_items` (
	`id` text PRIMARY KEY NOT NULL,
	`invoice_id` text NOT NULL,
	`description` text NOT NULL,
	`amount` real NOT NULL,
	`quantity` integer DEFAULT 1 NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`invoice_id`) REFERENCES `invoices`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `invoices` (
	`id` text PRIMARY KEY NOT NULL,
	`tenant_id` text NOT NULL,
	`visit_id` text NOT NULL,
	`estimate_id` text,
	`discount_type` text,
	`discount_value` real DEFAULT 0,
	`tax_enabled` integer DEFAULT 0,
	`tax_percent` real DEFAULT 0,
	`frozen_total` real NOT NULL,
	`payment_method` text,
	`payment_status` text DEFAULT 'UNPAID' NOT NULL,
	`notes` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`paid_at` text,
	FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`visit_id`) REFERENCES `service_visits`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`estimate_id`) REFERENCES `estimates`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_invoices_payment` ON `invoices` (`tenant_id`,`payment_status`);