CREATE TABLE `sku_import_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`filename` varchar(255) NOT NULL,
	`uploadedBy` varchar(255),
	`totalRows` int NOT NULL DEFAULT 0,
	`newRows` int NOT NULL DEFAULT 0,
	`duplicateRows` int NOT NULL DEFAULT 0,
	`skippedRows` int NOT NULL DEFAULT 0,
	`importedSkus` json,
	`duplicateSkus` json,
	`status` enum('success','partial','failed') NOT NULL DEFAULT 'success',
	`errorMessage` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `sku_import_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `products` ADD `sku` varchar(50);--> statement-breakpoint
ALTER TABLE `products` ADD CONSTRAINT `products_sku_unique` UNIQUE(`sku`);