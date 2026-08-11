DROP INDEX `idx_customers_phone`;--> statement-breakpoint
DROP INDEX `idx_vehicles_reg`;--> statement-breakpoint
ALTER TABLE `vehicle_images` ADD `tenant_id` text NOT NULL REFERENCES tenants(id);