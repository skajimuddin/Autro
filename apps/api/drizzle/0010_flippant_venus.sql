ALTER TABLE `estimates` ADD `number` integer;--> statement-breakpoint
CREATE UNIQUE INDEX `unique_estimate_number` ON `estimates` (`tenant_id`,`number`);--> statement-breakpoint
ALTER TABLE `invoices` ADD `number` integer;--> statement-breakpoint
CREATE UNIQUE INDEX `unique_invoice_number` ON `invoices` (`tenant_id`,`number`);--> statement-breakpoint
ALTER TABLE `tenants` ADD `gst_enabled` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `tenants` ADD `gstin` text;--> statement-breakpoint
ALTER TABLE `tenants` ADD `gst_percent` real DEFAULT 18 NOT NULL;