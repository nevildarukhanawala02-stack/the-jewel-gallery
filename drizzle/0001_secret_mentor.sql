CREATE TABLE `celebrities` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`slug` varchar(255) NOT NULL,
	`designation` varchar(100),
	`imageUrl` text,
	`bio` text,
	`style` varchar(100),
	`occasion` varchar(100),
	`isActive` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `celebrities_id` PRIMARY KEY(`id`),
	CONSTRAINT `celebrities_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `celebrity_products` (
	`id` int AUTO_INCREMENT NOT NULL,
	`celebrityId` int NOT NULL,
	`productId` int NOT NULL,
	`pieceName` varchar(255),
	`wornAt` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `celebrity_products_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `coupons` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(50) NOT NULL,
	`discountType` enum('percentage','fixed') NOT NULL,
	`discountValue` decimal(10,2) NOT NULL,
	`minOrderValue` decimal(10,2),
	`maxUses` int,
	`usedCount` int DEFAULT 0,
	`isActive` boolean DEFAULT true,
	`expiresAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `coupons_id` PRIMARY KEY(`id`),
	CONSTRAINT `coupons_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
CREATE TABLE `customer_addresses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`customerId` int NOT NULL,
	`firstName` varchar(100) NOT NULL,
	`lastName` varchar(100) NOT NULL,
	`email` varchar(320),
	`phone` varchar(20),
	`streetAddress` text NOT NULL,
	`city` varchar(100) NOT NULL,
	`state` varchar(100) NOT NULL,
	`postalCode` varchar(20) NOT NULL,
	`country` varchar(100) DEFAULT 'India',
	`isDefault` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `customer_addresses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `customers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255),
	`email` varchar(320) NOT NULL,
	`phone` varchar(20),
	`passwordHash` varchar(255),
	`isGuest` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `customers_id` PRIMARY KEY(`id`),
	CONSTRAINT `customers_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `newsletter_subscribers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(320) NOT NULL,
	`isActive` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `newsletter_subscribers_id` PRIMARY KEY(`id`),
	CONSTRAINT `newsletter_subscribers_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `order_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderId` int NOT NULL,
	`productId` int,
	`productName` varchar(255) NOT NULL,
	`productSlug` varchar(255),
	`productImage` text,
	`collection` varchar(100),
	`price` decimal(10,2) NOT NULL,
	`quantity` int NOT NULL DEFAULT 1,
	`lineTotal` decimal(10,2) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `order_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`orderNumber` varchar(30) NOT NULL,
	`customerId` int,
	`customerName` varchar(255),
	`customerEmail` varchar(320),
	`customerPhone` varchar(20),
	`shippingFirstName` varchar(100),
	`shippingLastName` varchar(100),
	`shippingStreet` text,
	`shippingCity` varchar(100),
	`shippingState` varchar(100),
	`shippingPostalCode` varchar(20),
	`shippingCountry` varchar(100),
	`subtotal` decimal(10,2) NOT NULL,
	`shippingCost` decimal(10,2) DEFAULT '0',
	`gstAmount` decimal(10,2) DEFAULT '0',
	`totalAmount` decimal(10,2) NOT NULL,
	`shippingMethod` enum('standard','express') DEFAULT 'standard',
	`deliveryEstimate` varchar(100),
	`paymentStatus` enum('pending','paid','failed','refunded') DEFAULT 'pending',
	`razorpayOrderId` varchar(100),
	`razorpayPaymentId` varchar(100),
	`razorpaySignature` varchar(255),
	`deliveryStatus` enum('pending','packed','shipped','out_for_delivery','delivered','returned') DEFAULT 'pending',
	`trackingNumber` varchar(100),
	`courierName` varchar(100),
	`adminNote` text,
	`shippedAt` timestamp,
	`deliveredAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `orders_id` PRIMARY KEY(`id`),
	CONSTRAINT `orders_orderNumber_unique` UNIQUE(`orderNumber`)
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`slug` varchar(255) NOT NULL,
	`collection` varchar(100),
	`category` enum('rings','necklaces','earrings','bracelets') NOT NULL,
	`subcategory` varchar(100),
	`description` text,
	`shortDescription` varchar(500),
	`price` decimal(10,2) NOT NULL,
	`comparePrice` decimal(10,2),
	`stock` int NOT NULL DEFAULT 0,
	`material` varchar(100),
	`gemstone` varchar(100),
	`weight` varchar(50),
	`dimensions` varchar(100),
	`images` json DEFAULT ('[]'),
	`celebrityTags` json DEFAULT ('[]'),
	`isFeatured` boolean DEFAULT false,
	`isNewArrival` boolean DEFAULT false,
	`isBestseller` boolean DEFAULT false,
	`isActive` boolean DEFAULT true,
	`part1Headline` text,
	`part2WhatsInside` text,
	`part3AsWorn` text,
	`metaTitle` varchar(255),
	`metaDescription` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `products_id` PRIMARY KEY(`id`),
	CONSTRAINT `products_slug_unique` UNIQUE(`slug`)
);
