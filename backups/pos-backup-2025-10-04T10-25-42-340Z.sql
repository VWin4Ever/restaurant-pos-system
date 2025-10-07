-- MariaDB dump 10.19  Distrib 10.4.32-MariaDB, for Win64 (AMD64)
--
-- Host: localhost    Database: restaurant_pos
-- ------------------------------------------------------
-- Server version	10.4.32-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `_prisma_migrations`
--

DROP TABLE IF EXISTS `_prisma_migrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `_prisma_migrations` (
  `id` varchar(36) NOT NULL,
  `checksum` varchar(64) NOT NULL,
  `finished_at` datetime(3) DEFAULT NULL,
  `migration_name` varchar(255) NOT NULL,
  `logs` text DEFAULT NULL,
  `rolled_back_at` datetime(3) DEFAULT NULL,
  `started_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `applied_steps_count` int(10) unsigned NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `_prisma_migrations`
--

LOCK TABLES `_prisma_migrations` WRITE;
/*!40000 ALTER TABLE `_prisma_migrations` DISABLE KEYS */;
INSERT INTO `_prisma_migrations` VALUES ('234a0d0c-069c-42c2-9d73-466523d105ab','17e1a3169ebf1c3097b07534466b1cb49690b95b617d13bbb917627c4eb6dddf','2025-08-21 15:47:58.999','20250710122751_add_business_snapshot_to_orders',NULL,NULL,'2025-08-21 15:47:58.993',1),('56c3a687-8f92-4f36-accd-0af0880432d1','1083129b960677ad306953aae07632f913a99ec120fbf328b9bf1269cf90d415','2025-08-21 15:47:59.305','20250807172620_add_custom_permissions',NULL,NULL,'2025-08-21 15:47:59.298',1),('60ca99e2-a0a8-4fb7-987c-48f3f787e2b3','a4925a95160863040c04a8b381bd82c838b61aeb338233afb699a8f3f14109eb','2025-08-21 15:47:59.372','20250812102809_add_user_permissions',NULL,NULL,'2025-08-21 15:47:59.314',1),('9d26ffa1-0ed7-4b1f-b22c-6fcd47c70d5a','96f2da185e522da143637fb9dbc6bec7eef17ca67d990a6e9bed3e9f768884d6','2025-08-21 15:47:58.986','20250710114013_add_settings_table',NULL,NULL,'2025-08-21 15:47:58.692',1),('b762ea17-a252-497c-a0f3-f5420180c160','90ca6b3533ccd49bad6c9fa248abd316dd66ec74f8e96c78054b669d5ccf34a6','2025-08-21 15:47:59.126','20250803145436_add_user_permissions_and_roles',NULL,NULL,'2025-08-21 15:47:59.047',1),('ba706e35-4c68-4520-9000-b5dab5c4647d','fc4582ef9063cb0e7572465243dc15bf8336f19cf631bfd602e4032927e776b8','2025-08-21 15:47:59.234','20250803152315_update_user_hierarchy',NULL,NULL,'2025-08-21 15:47:59.133',1),('d0335d43-a13a-4e13-8f44-8067999a0ddb','accb02ba9c51d8b0cf28382782bdf23a83902dcade6a67592eb9b769435078c1','2025-08-21 15:47:59.037','20250803030118_remove_preparing_ready_statuses',NULL,NULL,'2025-08-21 15:47:59.007',1),('d19c5bf7-7c16-4b23-80e1-1d2e3d1a79d1','85d8f475df12bd13fbadf470b740a8f25520a0ccf5d46921e54f92a1d35fa259','2025-08-21 15:47:59.290','20250803165043_revert_users_changes',NULL,NULL,'2025-08-21 15:47:59.242',1);
/*!40000 ALTER TABLE `_prisma_migrations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `categories`
--

DROP TABLE IF EXISTS `categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `categories` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(191) NOT NULL,
  `description` varchar(191) DEFAULT NULL,
  `isActive` tinyint(1) NOT NULL DEFAULT 1,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `categories_name_key` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `categories`
--

LOCK TABLES `categories` WRITE;
/*!40000 ALTER TABLE `categories` DISABLE KEYS */;
INSERT INTO `categories` VALUES (6,'Appetizer & Salad','Appetizer & Salad menu items',1,'2025-08-21 15:54:07.572','2025-08-21 15:54:07.572'),(7,'Appetizers and Snack','Appetizers and Snack menu items',1,'2025-08-21 15:54:07.594','2025-08-21 15:54:07.594'),(8,'Main course','Main course menu items',1,'2025-08-21 15:54:07.622','2025-08-21 15:54:07.622'),(9,'Rice and Noodle','Rice and Noodle menu items',1,'2025-08-21 15:54:07.644','2025-08-21 15:54:07.644'),(10,'Soup','Soup menu items',1,'2025-08-21 15:54:07.664','2025-08-21 15:54:07.664'),(11,'Western Soup','Western Soup menu items',1,'2025-08-21 15:54:07.685','2025-08-21 15:54:07.685'),(12,'Dessert','Dessert menu items',1,'2025-08-21 15:54:07.698','2025-08-21 15:54:07.698'),(13,'Soft Drinks','Soft Drinks menu items',1,'2025-08-21 15:54:07.707','2025-08-21 15:54:07.707'),(14,'Hot&Cold Drinks','Hot&Cold Drinks menu items',1,'2025-08-21 15:54:07.733','2025-08-21 15:54:07.733');
/*!40000 ALTER TABLE `categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `order_items`
--

DROP TABLE IF EXISTS `order_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `order_items` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `orderId` int(11) NOT NULL,
  `productId` int(11) NOT NULL,
  `quantity` int(11) NOT NULL,
  `price` decimal(10,2) NOT NULL,
  `subtotal` decimal(10,2) NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`),
  KEY `order_items_orderId_fkey` (`orderId`),
  KEY `order_items_productId_fkey` (`productId`),
  CONSTRAINT `order_items_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `orders` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `order_items_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `products` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=109 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `order_items`
--

LOCK TABLES `order_items` WRITE;
/*!40000 ALTER TABLE `order_items` DISABLE KEYS */;
INSERT INTO `order_items` VALUES (2,2,15,1,8.99,8.99,'2025-08-21 16:19:30.445'),(3,3,22,1,15.99,15.99,'2025-08-21 16:20:47.168'),(4,4,57,1,11.99,11.99,'2025-08-26 10:51:21.433'),(5,4,56,1,10.99,10.99,'2025-08-26 10:51:21.433'),(6,5,54,2,12.99,25.98,'2025-08-26 10:58:41.224'),(7,5,67,2,3.99,7.98,'2025-08-26 10:58:41.224'),(8,6,15,2,8.99,17.98,'2025-08-26 11:10:54.957'),(9,7,73,1,3.49,3.49,'2025-08-26 11:11:56.657'),(10,8,54,1,12.99,12.99,'2025-10-01 04:25:38.794'),(11,9,54,1,12.99,12.99,'2025-10-01 05:43:09.457'),(12,10,71,1,6.99,6.99,'2025-10-01 05:45:33.451'),(13,11,26,1,12.99,12.99,'2025-10-01 05:45:49.226'),(14,12,15,1,8.99,8.99,'2025-10-01 05:52:00.002'),(15,12,24,1,6.99,6.99,'2025-10-01 05:52:00.002'),(19,14,55,2,11.99,23.98,'2025-10-01 14:09:20.088'),(20,14,57,1,11.99,11.99,'2025-10-01 14:09:20.088'),(21,14,76,1,4.49,4.49,'2025-10-01 14:09:20.088'),(29,16,45,1,15.99,15.99,'2025-10-01 14:21:53.372'),(30,16,22,1,15.99,15.99,'2025-10-01 14:21:53.372'),(31,16,26,1,12.99,12.99,'2025-10-01 14:21:53.372'),(32,16,15,1,8.99,8.99,'2025-10-01 14:21:53.372'),(33,16,69,1,10.99,10.99,'2025-10-01 14:21:53.372'),(34,16,67,1,3.99,3.99,'2025-10-01 14:21:53.372'),(35,15,32,1,17.99,17.99,'2025-10-01 14:43:09.739'),(36,15,31,1,19.99,19.99,'2025-10-01 14:43:09.739'),(37,17,22,1,15.99,15.99,'2025-10-01 15:47:26.838'),(38,17,73,1,3.49,3.49,'2025-10-01 15:47:26.838'),(39,17,32,1,17.99,17.99,'2025-10-01 15:47:26.838'),(40,17,76,1,4.49,4.49,'2025-10-01 15:47:26.838'),(41,17,71,1,6.99,6.99,'2025-10-01 15:47:26.838'),(42,17,59,1,8.99,8.99,'2025-10-01 15:47:26.838'),(43,17,45,1,15.99,15.99,'2025-10-01 15:47:26.838'),(44,17,15,1,8.99,8.99,'2025-10-01 15:47:26.838'),(45,17,77,1,3.99,3.99,'2025-10-01 15:47:26.838'),(46,17,66,1,3.99,3.99,'2025-10-01 15:47:26.838'),(47,17,28,1,14.99,14.99,'2025-10-01 15:47:26.838'),(48,17,20,1,7.99,7.99,'2025-10-01 15:47:26.838'),(49,17,16,1,12.99,12.99,'2025-10-01 15:47:26.838'),(50,17,42,1,17.99,17.99,'2025-10-01 15:47:26.838'),(51,17,62,1,4.99,4.99,'2025-10-01 15:47:26.838'),(52,17,74,1,3.49,3.49,'2025-10-01 15:47:26.838'),(53,17,18,1,9.99,9.99,'2025-10-01 15:47:26.838'),(54,17,46,1,16.99,16.99,'2025-10-01 15:47:26.838'),(55,18,22,2,15.99,31.98,'2025-10-01 16:19:16.497'),(56,18,15,1,8.99,8.99,'2025-10-01 16:19:16.497'),(57,18,69,1,10.99,10.99,'2025-10-01 16:19:16.497'),(58,18,24,1,6.99,6.99,'2025-10-01 16:19:16.497'),(59,18,41,1,15.99,15.99,'2025-10-01 16:19:16.497'),(60,18,50,1,16.99,16.99,'2025-10-01 16:19:16.497'),(61,18,65,1,3.99,3.99,'2025-10-01 16:19:16.497'),(62,18,64,1,3.99,3.99,'2025-10-01 16:19:16.497'),(63,18,57,1,11.99,11.99,'2025-10-01 16:19:16.497'),(64,18,56,1,10.99,10.99,'2025-10-01 16:19:16.497'),(65,18,48,1,17.99,17.99,'2025-10-01 16:19:16.497'),(66,18,60,1,9.99,9.99,'2025-10-01 16:19:16.497'),(67,18,55,1,11.99,11.99,'2025-10-01 16:19:16.497'),(68,18,61,1,12.99,12.99,'2025-10-01 16:19:16.497'),(69,18,21,1,16.99,16.99,'2025-10-01 16:19:16.497'),(70,18,38,1,20.99,20.99,'2025-10-01 16:19:16.497'),(71,19,59,1,8.99,8.99,'2025-10-01 16:58:01.722'),(72,20,15,1,8.99,8.99,'2025-10-01 17:01:08.109'),(73,21,26,1,12.99,12.99,'2025-10-01 17:03:58.599'),(74,22,73,1,3.49,3.49,'2025-10-01 17:04:35.344'),(75,23,22,1,15.99,15.99,'2025-10-01 17:06:19.502'),(76,24,73,1,3.49,3.49,'2025-10-01 17:08:30.231'),(77,25,67,1,3.99,3.99,'2025-10-01 17:09:59.216'),(78,26,22,1,15.99,15.99,'2025-10-01 17:10:26.756'),(79,27,73,1,3.49,3.49,'2025-10-02 03:23:34.817'),(93,35,26,1,12.99,12.99,'2025-10-02 04:00:54.311'),(94,35,69,2,10.99,21.98,'2025-10-02 04:00:54.311'),(95,37,76,1,4.49,4.49,'2025-10-02 04:45:18.263'),(96,38,59,1,8.99,8.99,'2025-10-02 05:25:30.516'),(97,39,26,1,12.99,12.99,'2025-10-02 16:08:19.756'),(98,40,71,1,6.99,6.99,'2025-10-03 04:34:35.620'),(99,41,32,1,17.99,17.99,'2025-10-03 04:34:43.288'),(100,41,67,1,3.99,3.99,'2025-10-03 04:34:43.288'),(101,42,71,1,6.99,6.99,'2025-10-03 05:35:13.876'),(102,43,54,1,12.99,12.99,'2025-10-03 12:45:43.625'),(103,44,59,1,8.99,8.99,'2025-10-03 15:28:43.334'),(104,45,76,1,4.49,4.49,'2025-10-04 07:09:00.460'),(105,46,28,2,14.99,29.98,'2025-10-04 07:09:14.574'),(106,46,27,1,10.99,10.99,'2025-10-04 07:09:14.574'),(107,47,48,1,17.99,17.99,'2025-10-04 08:45:41.486'),(108,48,71,1,6.99,6.99,'2025-10-04 08:47:05.124');
/*!40000 ALTER TABLE `order_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `orders`
--

DROP TABLE IF EXISTS `orders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `orders` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `orderNumber` varchar(191) NOT NULL,
  `tableId` int(11) NOT NULL,
  `userId` int(11) NOT NULL,
  `status` enum('PENDING','COMPLETED','CANCELLED') NOT NULL DEFAULT 'PENDING',
  `subtotal` decimal(10,2) NOT NULL,
  `tax` decimal(10,2) NOT NULL DEFAULT 0.00,
  `discount` decimal(10,2) NOT NULL DEFAULT 0.00,
  `total` decimal(10,2) NOT NULL,
  `paymentMethod` enum('CASH','CARD') DEFAULT NULL,
  `customerNote` varchar(191) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  `businessSnapshot` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`businessSnapshot`)),
  PRIMARY KEY (`id`),
  UNIQUE KEY `orders_orderNumber_key` (`orderNumber`),
  KEY `orders_tableId_fkey` (`tableId`),
  KEY `orders_userId_fkey` (`userId`),
  CONSTRAINT `orders_tableId_fkey` FOREIGN KEY (`tableId`) REFERENCES `tables` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `orders_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=49 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `orders`
--

LOCK TABLES `orders` WRITE;
/*!40000 ALTER TABLE `orders` DISABLE KEYS */;
INSERT INTO `orders` VALUES (2,'ORD-20250821-231930',1,1,'COMPLETED',8.99,0.76,0.00,9.75,'CARD','Test order','2025-08-21 16:19:30.443','2025-08-21 16:22:06.573','{\"restaurantName\":\"Restaurant POS\",\"address\":\"123 Main Street, City, State 12345\",\"phone\":\"+1 (555) 123-4567\",\"email\":\"info@restaurant.com\",\"taxRate\":8.5,\"currency\":\"USD\",\"timezone\":\"America/New_York\"}'),(3,'ORD-20250821-232047',2,1,'COMPLETED',15.99,1.36,0.00,17.35,'CARD',NULL,'2025-08-21 16:20:47.164','2025-08-21 16:20:58.090','{\"restaurantName\":\"Restaurant POS\",\"address\":\"123 Main Street, City, State 12345\",\"phone\":\"+1 (555) 123-4567\",\"email\":\"info@restaurant.com\",\"taxRate\":8.5,\"currency\":\"USD\",\"timezone\":\"America/New_York\"}'),(4,'ORD-20250826-175121',1,1,'CANCELLED',22.98,1.95,0.00,24.93,NULL,NULL,'2025-08-26 10:51:21.425','2025-08-26 10:58:51.261','{\"restaurantName\":\"Restaurant POS\",\"address\":\"123 Main Street, City, State 12345\",\"phone\":\"+1 (555) 123-4567\",\"email\":\"info@restaurant.com\",\"taxRate\":8.5,\"currency\":\"USD\",\"timezone\":\"America/New_York\"}'),(5,'ORD-20250826-175841',2,1,'COMPLETED',33.96,2.89,3.40,33.45,'CARD',NULL,'2025-08-26 10:58:41.217','2025-08-26 10:58:58.092','{\"restaurantName\":\"Restaurant POS\",\"address\":\"123 Main Street, City, State 12345\",\"phone\":\"+1 (555) 123-4567\",\"email\":\"info@restaurant.com\",\"taxRate\":8.5,\"currency\":\"USD\",\"timezone\":\"America/New_York\"}'),(6,'ORD-20250826-181054',1,1,'COMPLETED',17.98,1.53,0.00,19.51,'CARD',NULL,'2025-08-26 11:10:54.947','2025-08-26 11:11:11.177','{\"restaurantName\":\"Restaurant POS\",\"address\":\"123 Main Street, City, State 12345\",\"phone\":\"+1 (555) 123-4567\",\"email\":\"info@restaurant.com\",\"taxRate\":8.5,\"currency\":\"USD\",\"timezone\":\"America/New_York\"}'),(7,'ORD-20250826-181156',1,1,'COMPLETED',3.49,0.30,0.00,3.79,'CARD',NULL,'2025-08-26 11:11:56.648','2025-08-26 11:13:38.773','{\"restaurantName\":\"Restaurant POS\",\"address\":\"123 Main Street, City, State 12345\",\"phone\":\"+1 (555) 123-4567\",\"email\":\"info@restaurant.com\",\"taxRate\":8.5,\"currency\":\"USD\",\"timezone\":\"America/New_York\"}'),(8,'ORD-20251001-112538',1,1,'COMPLETED',12.99,1.10,0.00,14.09,'CARD',NULL,'2025-10-01 04:25:38.790','2025-10-01 04:25:47.421','{\"restaurantName\":\"Restaurant POS\",\"address\":\"123 Main Street, City, State 12345\",\"phone\":\"+1 (555) 123-4567\",\"email\":\"info@restaurant.com\",\"taxRate\":8.5,\"currency\":\"USD\",\"timezone\":\"America/New_York\"}'),(9,'ORD-20251001-124309',1,1,'COMPLETED',12.99,1.10,0.00,14.09,'CARD',NULL,'2025-10-01 05:43:09.452','2025-10-01 05:43:21.448','{\"restaurantName\":\"Restaurant POS\",\"address\":\"123 Main Street, City, State 12345\",\"phone\":\"+1 (555) 123-4567\",\"email\":\"info@restaurant.com\",\"taxRate\":8.5,\"currency\":\"USD\",\"timezone\":\"America/New_York\"}'),(10,'ORD-20251001-124533',3,1,'COMPLETED',6.99,0.59,0.00,7.58,'CARD',NULL,'2025-10-01 05:45:33.446','2025-10-01 05:45:38.731','{\"restaurantName\":\"Restaurant POS\",\"address\":\"123 Main Street, City, State 12345\",\"phone\":\"+1 (555) 123-4567\",\"email\":\"info@restaurant.com\",\"taxRate\":8.5,\"currency\":\"USD\",\"timezone\":\"America/New_York\"}'),(11,'ORD-20251001-124549',10,1,'COMPLETED',12.99,1.10,0.00,14.09,'CASH',NULL,'2025-10-01 05:45:49.223','2025-10-01 05:45:53.868','{\"restaurantName\":\"Restaurant POS\",\"address\":\"123 Main Street, City, State 12345\",\"phone\":\"+1 (555) 123-4567\",\"email\":\"info@restaurant.com\",\"taxRate\":8.5,\"currency\":\"USD\",\"timezone\":\"America/New_York\"}'),(12,'ORD-20251001-125159',1,1,'COMPLETED',15.98,1.60,0.00,17.58,'CASH',NULL,'2025-10-01 05:51:59.998','2025-10-01 05:52:08.812','{\"restaurantName\":\"Restaurant POS\",\"address\":\"123 Main Street, City, State 12345\",\"phone\":\"+1 (555) 123-4567\",\"email\":\"info@restaurant.com\",\"taxRate\":10,\"currency\":\"USD\",\"timezone\":\"America/New_York\"}'),(14,'ORD-20251001-205742',1,1,'COMPLETED',40.46,4.05,6.07,38.44,'CARD','','2025-10-01 13:57:42.273','2025-10-01 14:09:39.308','{\"restaurantName\":\"Restaurant POS\",\"address\":\"123 Main Street, City, State 12345\",\"phone\":\"+1 (555) 123-4567\",\"email\":\"info@restaurant.com\",\"taxRate\":10,\"currency\":\"USD\",\"timezone\":\"America/New_York\"}'),(15,'ORD-20251001-211234',2,1,'COMPLETED',37.98,3.80,0.00,41.78,'CARD',NULL,'2025-10-01 14:12:34.582','2025-10-01 14:43:23.693','{\"restaurantName\":\"Restaurant POS\",\"address\":\"123 Main Street, City, State 12345\",\"phone\":\"+1 (555) 123-4567\",\"email\":\"info@restaurant.com\",\"taxRate\":10,\"currency\":\"USD\",\"timezone\":\"America/New_York\"}'),(16,'ORD-20251001-211306',4,1,'COMPLETED',68.94,6.89,6.89,68.94,'CASH',NULL,'2025-10-01 14:13:06.500','2025-10-01 14:43:16.425','{\"restaurantName\":\"Restaurant POS\",\"address\":\"123 Main Street, City, State 12345\",\"phone\":\"+1 (555) 123-4567\",\"email\":\"info@restaurant.com\",\"taxRate\":10,\"currency\":\"USD\",\"timezone\":\"America/New_York\"}'),(17,'ORD-20251001-224726',1,1,'COMPLETED',180.32,18.03,27.05,171.30,'CASH',NULL,'2025-10-01 15:47:26.830','2025-10-01 16:33:16.370','{\"restaurantName\":\"Restaurant POS\",\"address\":\"123 Main Street, City, State 12345\",\"phone\":\"+1 (555) 123-4567\",\"email\":\"info@restaurant.com\",\"taxRate\":10,\"currency\":\"USD\",\"timezone\":\"America/New_York\"}'),(18,'ORD-20251001-231916',3,1,'COMPLETED',213.83,21.38,0.00,235.21,'CASH',NULL,'2025-10-01 16:19:16.494','2025-10-01 16:54:26.277','{\"restaurantName\":\"Restaurant POS\",\"address\":\"123 Main Street, City, State 12345\",\"phone\":\"+1 (555) 123-4567\",\"email\":\"info@restaurant.com\",\"taxRate\":10,\"currency\":\"USD\",\"timezone\":\"America/New_York\"}'),(19,'ORD-20251001-235801',1,1,'COMPLETED',8.99,0.90,0.00,9.89,'CARD',NULL,'2025-10-01 16:58:01.715','2025-10-01 16:58:06.173','{\"restaurantName\":\"Restaurant POS\",\"address\":\"123 Main Street, City, State 12345\",\"phone\":\"+1 (555) 123-4567\",\"email\":\"info@restaurant.com\",\"taxRate\":10,\"currency\":\"USD\",\"timezone\":\"America/New_York\"}'),(20,'ORD-20251002-000108',12,1,'COMPLETED',8.99,0.90,0.00,9.89,'CARD',NULL,'2025-10-01 17:01:08.107','2025-10-01 17:01:11.984','{\"restaurantName\":\"Restaurant POS\",\"address\":\"123 Main Street, City, State 12345\",\"phone\":\"+1 (555) 123-4567\",\"email\":\"info@restaurant.com\",\"taxRate\":10,\"currency\":\"USD\",\"timezone\":\"America/New_York\"}'),(21,'ORD-20251002-000358',8,1,'COMPLETED',12.99,1.30,0.00,14.29,'CARD',NULL,'2025-10-01 17:03:58.594','2025-10-01 17:04:04.036','{\"restaurantName\":\"Restaurant POS\",\"address\":\"123 Main Street, City, State 12345\",\"phone\":\"+1 (555) 123-4567\",\"email\":\"info@restaurant.com\",\"taxRate\":10,\"currency\":\"USD\",\"timezone\":\"America/New_York\"}'),(22,'ORD-20251002-000435',4,1,'COMPLETED',3.49,0.35,0.00,3.84,'CARD',NULL,'2025-10-01 17:04:35.343','2025-10-01 17:04:42.528','{\"restaurantName\":\"Restaurant POS\",\"address\":\"123 Main Street, City, State 12345\",\"phone\":\"+1 (555) 123-4567\",\"email\":\"info@restaurant.com\",\"taxRate\":10,\"currency\":\"USD\",\"timezone\":\"America/New_York\"}'),(23,'ORD-20251002-000619',2,1,'COMPLETED',15.99,1.60,0.00,17.59,'CASH',NULL,'2025-10-01 17:06:19.499','2025-10-01 17:06:22.979','{\"restaurantName\":\"Restaurant POS\",\"address\":\"123 Main Street, City, State 12345\",\"phone\":\"+1 (555) 123-4567\",\"email\":\"info@restaurant.com\",\"taxRate\":10,\"currency\":\"USD\",\"timezone\":\"America/New_York\"}'),(24,'ORD-20251002-000830',1,1,'COMPLETED',3.49,0.35,0.00,3.84,'CARD',NULL,'2025-10-01 17:08:30.228','2025-10-01 17:08:37.013','{\"restaurantName\":\"Restaurant POS\",\"address\":\"123 Main Street, City, State 12345\",\"phone\":\"+1 (555) 123-4567\",\"email\":\"info@restaurant.com\",\"taxRate\":10,\"currency\":\"USD\",\"timezone\":\"America/New_York\"}'),(25,'ORD-20251002-000959',12,1,'COMPLETED',3.99,0.40,0.00,4.39,'CARD',NULL,'2025-10-01 17:09:59.211','2025-10-01 17:10:04.702','{\"restaurantName\":\"Restaurant POS\",\"address\":\"123 Main Street, City, State 12345\",\"phone\":\"+1 (555) 123-4567\",\"email\":\"info@restaurant.com\",\"taxRate\":10,\"currency\":\"USD\",\"timezone\":\"America/New_York\"}'),(26,'ORD-20251002-001026',2,1,'COMPLETED',15.99,1.60,0.00,17.59,'CARD',NULL,'2025-10-01 17:10:26.753','2025-10-01 17:15:09.388','{\"restaurantName\":\"Restaurant POS\",\"address\":\"123 Main Street, City, State 12345\",\"phone\":\"+1 (555) 123-4567\",\"email\":\"info@restaurant.com\",\"taxRate\":10,\"currency\":\"USD\",\"timezone\":\"America/New_York\"}'),(27,'ORD-20251002-102334',1,1,'COMPLETED',3.49,0.35,0.00,3.84,'CARD',NULL,'2025-10-02 03:23:34.811','2025-10-02 03:23:39.160','{\"restaurantName\":\"Angkor Holiday\",\"address\":\"Sivutha Street, Siem Reap, Cambodia\",\"phone\":\"+(855) 12457288\",\"email\":\"angkorholiday@gmail.com\",\"taxRate\":10,\"currency\":\"USD\",\"timezone\":\"America/New_York\"}'),(35,'ORD-20251002-110054',20,1,'COMPLETED',34.97,2.97,0.00,37.94,'CARD',NULL,'2025-10-02 04:00:54.306','2025-10-02 04:14:38.066','{\"restaurantName\":\"Angkor Holiday\",\"address\":\"123 Main Street, City, State 12345\",\"phone\":\"+(855) 123-4567\",\"email\":\"info@restaurant.com\",\"taxRate\":8.5,\"currency\":\"USD\",\"timezone\":\"America/New_York\"}'),(37,'ORD-20251002-114518',34,1,'COMPLETED',4.49,0.38,0.00,4.87,'CASH',NULL,'2025-10-02 04:45:18.259','2025-10-02 04:45:57.847','{\"restaurantName\":\"Angkor Holiday\",\"address\":\"123 Main Street, City, State 12345\",\"phone\":\"+(855) 123-4567\",\"email\":\"info@restaurant.com\",\"taxRate\":8.5,\"currency\":\"USD\",\"timezone\":\"America/New_York\"}'),(38,'ORD-20251002-122530',5,1,'COMPLETED',8.99,0.76,0.00,9.75,'CARD',NULL,'2025-10-02 05:25:30.507','2025-10-02 14:11:51.901','{\"restaurantName\":\"Angkor Holiday\",\"address\":\"123 Main Street, City, State 12345\",\"phone\":\"+(855) 123-4567\",\"email\":\"info@restaurant.com\",\"taxRate\":8.5,\"currency\":\"USD\",\"timezone\":\"America/New_York\"}'),(39,'ORD-20251002-230819',1,1,'COMPLETED',12.99,1.10,1.95,12.15,'CASH',NULL,'2025-10-02 16:08:19.751','2025-10-02 16:08:55.096','{\"restaurantName\":\"Angkor Holiday\",\"address\":\"123 Main Street, City, State 12345\",\"phone\":\"+(855) 123-4567\",\"email\":\"info@restaurant.com\",\"taxRate\":8.5,\"currency\":\"USD\",\"timezone\":\"America/New_York\"}'),(40,'ORD-20251003-113435',1,1,'COMPLETED',6.99,0.59,0.00,7.58,'CARD',NULL,'2025-10-03 04:34:35.612','2025-10-03 04:35:48.844','{\"restaurantName\":\"Angkor Holiday\",\"address\":\"123 Main Street, City, State 12345\",\"phone\":\"+(855) 123-4567\",\"email\":\"info@restaurant.com\",\"taxRate\":8.5,\"currency\":\"USD\",\"timezone\":\"America/New_York\"}'),(41,'ORD-20251003-113443',7,1,'COMPLETED',21.98,1.87,0.00,23.85,'CARD',NULL,'2025-10-03 04:34:43.282','2025-10-03 04:35:43.900','{\"restaurantName\":\"Angkor Holiday\",\"address\":\"123 Main Street, City, State 12345\",\"phone\":\"+(855) 123-4567\",\"email\":\"info@restaurant.com\",\"taxRate\":8.5,\"currency\":\"USD\",\"timezone\":\"America/New_York\"}'),(42,'ORD-20251003-123513',8,1,'COMPLETED',6.99,0.59,0.00,7.58,'CASH',NULL,'2025-10-03 05:35:13.871','2025-10-03 05:35:21.479','{\"restaurantName\":\"Angkor Holiday\",\"address\":\"123 Main Street, City, State 12345\",\"phone\":\"+(855) 123-4567\",\"email\":\"info@restaurant.com\",\"taxRate\":8.5,\"currency\":\"USD\",\"timezone\":\"America/New_York\"}'),(43,'ORD-20251003-194543',1,1,'COMPLETED',12.99,1.10,0.00,14.09,'CARD',NULL,'2025-10-03 12:45:43.613','2025-10-03 12:45:47.279','{\"restaurantName\":\"Angkor Holiday\",\"address\":\"123 Main Street, City, State 12345\",\"phone\":\"+(855) 123-4567\",\"email\":\"info@restaurant.com\",\"taxRate\":8.5,\"currency\":\"USD\",\"timezone\":\"America/New_York\"}'),(44,'ORD-20251003-222843',1,1,'COMPLETED',8.99,0.76,0.00,9.75,'CARD',NULL,'2025-10-03 15:28:43.331','2025-10-03 15:28:47.744','{\"restaurantName\":\"Angkor Holiday\",\"address\":\"123 Main Street, City, State 12345\",\"phone\":\"+(855) 123-4567\",\"email\":\"info@restaurant.com\",\"taxRate\":8.5,\"currency\":\"USD\",\"timezone\":\"America/New_York\"}'),(45,'ORD-20251004-140900',5,1,'COMPLETED',4.49,0.38,0.00,4.87,'CARD',NULL,'2025-10-04 07:09:00.455','2025-10-04 07:09:25.240','{\"restaurantName\":\"Angkor Holiday\",\"address\":\"123 Main Street, City, State 12345\",\"phone\":\"+(855) 123-4567\",\"email\":\"info@restaurant.com\",\"taxRate\":8.5,\"currency\":\"USD\",\"timezone\":\"America/New_York\"}'),(46,'ORD-20251004-140914',15,1,'COMPLETED',40.97,3.48,0.00,44.45,'CARD',NULL,'2025-10-04 07:09:14.569','2025-10-04 07:09:18.977','{\"restaurantName\":\"Angkor Holiday\",\"address\":\"123 Main Street, City, State 12345\",\"phone\":\"+(855) 123-4567\",\"email\":\"info@restaurant.com\",\"taxRate\":8.5,\"currency\":\"USD\",\"timezone\":\"America/New_York\"}'),(47,'ORD-20251004-154541',1,1,'COMPLETED',17.99,1.80,0.00,19.79,'CASH',NULL,'2025-10-04 08:45:41.481','2025-10-04 08:45:45.286','{\"restaurantName\":\"Angkor Holiday\",\"address\":\"123 Main Street, City, State 12345\",\"phone\":\"+(855) 123-4567\",\"email\":\"info@restaurant.com\",\"taxRate\":10,\"currency\":\"USD\",\"timezone\":\"Asia/Phnom_Penh\"}'),(48,'ORD-20251004-154705',6,1,'PENDING',6.99,0.70,0.00,7.69,NULL,NULL,'2025-10-04 08:47:05.118','2025-10-04 08:47:05.118','{\"restaurantName\":\"Angkor Holiday\",\"address\":\"123 Main Street, City, State 12345\",\"phone\":\"+(855) 123-4567\",\"email\":\"info@restaurant.com\",\"taxRate\":10,\"currency\":\"USD\",\"timezone\":\"Asia/Phnom_Penh\"}');
/*!40000 ALTER TABLE `orders` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `products`
--

DROP TABLE IF EXISTS `products`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `products` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(191) NOT NULL,
  `description` varchar(191) DEFAULT NULL,
  `price` decimal(10,2) NOT NULL,
  `categoryId` int(11) NOT NULL,
  `isActive` tinyint(1) NOT NULL DEFAULT 1,
  `imageUrl` varchar(191) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  `productId` varchar(191) NOT NULL DEFAULT 'PROD000',
  `costPrice` decimal(10,2) NOT NULL,
  `needStock` tinyint(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `products_name_key` (`name`),
  UNIQUE KEY `products_productId_key` (`productId`),
  KEY `products_categoryId_fkey` (`categoryId`),
  CONSTRAINT `products_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `categories` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=122 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `products`
--

LOCK TABLES `products` WRITE;
/*!40000 ALTER TABLE `products` DISABLE KEYS */;
INSERT INTO `products` VALUES (15,'Deep Fry Spring Roll','Crispy deep-fried spring rolls with vegetables',8.99,6,1,'http://localhost:5000/food_and_berverage/Appetizer & Salad/Deep fry sping roll.jpg','2025-08-21 15:54:07.575','2025-10-03 03:53:12.947','PROD0001',6.29,0),(16,'Fresh Shrimp Salad','Fresh shrimp salad with mixed greens',12.99,6,1,'http://localhost:5000/food_and_berverage/Appetizer & Salad/fresh shrimp salad.jpg','2025-08-21 15:54:07.579','2025-10-03 03:53:12.950','PROD0002',9.09,0),(17,'Seafood Vermicelli Salad','Vermicelli salad with fresh seafood',14.99,6,1,'http://localhost:5000/food_and_berverage/Appetizer & Salad/Seafood Vermicelli Salad.jpg','2025-08-21 15:54:07.583','2025-10-03 03:53:12.951','PROD0003',10.49,0),(18,'Green Mango Salad','Traditional green mango salad with herbs',9.99,6,1,'http://localhost:5000/food_and_berverage/Appetizer & Salad/green mango salad.jpg','2025-08-21 15:54:07.586','2025-10-03 03:53:12.953','PROD0004',6.99,0),(19,'Raw Beef Salad','Traditional raw beef salad with herbs and spices',13.99,6,1,'http://localhost:5000/food_and_berverage/Appetizer & Salad/raw beef salad.jpg','2025-08-21 15:54:07.588','2025-10-03 03:53:12.956','PROD0005',9.79,0),(20,'Fresh Spring Roll','Fresh vegetable spring rolls with dipping sauce',7.99,6,1,'http://localhost:5000/food_and_berverage/Appetizer & Salad/fresh spring roll.jpg','2025-08-21 15:54:07.590','2025-10-03 03:53:12.957','PROD0006',5.59,0),(21,'Pizza','Classic pizza with tomato sauce and cheese',16.99,7,1,'http://localhost:5000/food_and_berverage/Appetizers and Snack/Pizza.jpg','2025-08-21 15:54:07.596','2025-10-03 03:53:12.959','PROD0007',11.89,0),(22,'Burgers','Juicy beef burger with fresh vegetables',15.99,7,1,'http://localhost:5000/food_and_berverage/Appetizers and Snack/Burgers.jpg','2025-08-21 15:54:07.598','2025-10-03 03:53:12.961','PROD0008',11.19,0),(23,'Sandwiches','Fresh sandwiches with various fillings',11.99,7,1,'http://localhost:5000/food_and_berverage/Appetizers and Snack/Sandwiches.jpg','2025-08-21 15:54:07.602','2025-10-03 03:53:12.963','PROD0009',8.39,0),(24,'French Fries Platter','Crispy golden french fries',6.99,7,1,'http://localhost:5000/food_and_berverage/Appetizers and Snack/French Fries Platter.jpg','2025-08-21 15:54:07.605','2025-10-03 03:53:12.964','PROD0010',4.89,0),(25,'Tempura Prawn','Crispy tempura prawns with dipping sauce',13.99,7,1,'http://localhost:5000/food_and_berverage/Appetizers and Snack/Tempura Prawn.jpg','2025-08-21 15:54:07.606','2025-10-03 03:53:12.968','PROD0011',9.79,0),(26,'Calamari Fritters','Crispy calamari fritters with tartar sauce',12.99,7,1,'http://localhost:5000/food_and_berverage/Appetizers and Snack/Calamari Fritters.jpg','2025-08-21 15:54:07.611','2025-10-03 03:53:12.971','PROD0012',9.09,0),(27,'Fish Fingers','Crispy fish fingers with dipping sauce',10.99,7,1,'http://localhost:5000/food_and_berverage/Appetizers and Snack/Fish Fingers.webp','2025-08-21 15:54:07.616','2025-10-03 03:53:12.972','PROD0013',7.69,0),(28,'Fish and Chips','Classic fish and chips with tartar sauce',14.99,7,1,'http://localhost:5000/food_and_berverage/Appetizers and Snack/Fish and Chips.jpg','2025-08-21 15:54:07.619','2025-10-03 03:53:12.974','PROD0014',10.49,0),(29,'Steamed Rice','Steamed white rice',3.99,8,1,'http://localhost:5000/food_and_berverage/Main course/Steamed Rice.jpg','2025-08-21 15:54:07.624','2025-10-03 03:53:12.975','PROD0015',2.79,0),(30,'Work Fried Sweet & Sour','Stir-fried sweet and sour dish',18.99,8,1,'http://localhost:5000/food_and_berverage/Main course/Work fried Sweet & Sour.jpg','2025-08-21 15:54:07.626','2025-10-03 03:53:12.977','PROD0016',13.29,0),(31,'Kung Pao Chicken','Spicy kung pao chicken with peanuts',19.99,8,1,'http://localhost:5000/food_and_berverage/Main course/Kung Pao Chicken.jpg','2025-08-21 15:54:07.629','2025-10-03 03:53:12.978','PROD0017',13.99,0),(32,'Chicken or Beef Satay','Grilled satay with peanut sauce',17.99,8,1,'http://localhost:5000/food_and_berverage/Main course/Chicken or Beef Satay.webp','2025-08-21 15:54:07.631','2025-10-03 03:53:12.980','PROD0018',12.59,0),(33,'Lok Lac','Traditional Cambodian lok lac beef',21.99,8,1,'http://localhost:5000/food_and_berverage/Main course/Lok Lac.jpg','2025-08-21 15:54:07.634','2025-10-03 03:53:12.981','PROD0019',15.39,0),(34,'Work Fried Khmer Spicy Paste','Stir-fried with Khmer spicy paste',20.99,8,1,'http://localhost:5000/food_and_berverage/Main course/Work Fried Khmer Spicy paste.webp','2025-08-21 15:54:07.635','2025-10-03 03:53:12.982','PROD0020',14.69,0),(35,'Stir-fried Hot Basil','Stir-fried with hot basil and chili',18.99,8,1,'http://localhost:5000/food_and_berverage/Main course/Stir-fried Hot Basil.jpg','2025-08-21 15:54:07.638','2025-10-03 03:53:12.984','PROD0021',13.29,0),(36,'Steamed Amok Fish','Traditional steamed fish amok',22.99,8,1,'http://localhost:5000/food_and_berverage/Main course/Steamed Amok Fish.webp','2025-08-21 15:54:07.640','2025-10-03 03:53:12.985','PROD0022',16.09,0),(37,'Sweet & Soup Vegetable','Sweet and sour vegetable dish',12.99,9,1,'http://localhost:5000/food_and_berverage/Rice and Noodle/Sweet & Soup Vegetable.jpg','2025-08-21 15:54:07.646','2025-10-03 03:53:12.986','PROD0023',9.09,0),(38,'Steak & Shrimp Noodle','Noodles with steak and shrimp',20.99,9,1,'http://localhost:5000/food_and_berverage/Rice and Noodle/Steak & Shrimp Noodle.webp','2025-08-21 15:54:07.647','2025-10-03 03:53:12.988','PROD0024',14.69,0),(39,'Shrimp Chow Mein','Stir-fried noodles with shrimp',18.99,9,1,'http://localhost:5000/food_and_berverage/Rice and Noodle/Shrimp Chow Mein.jpg','2025-08-21 15:54:07.650','2025-10-03 03:53:12.989','PROD0025',13.29,0),(40,'Pad Thai','Traditional Thai pad thai',16.99,9,1,'http://localhost:5000/food_and_berverage/Rice and Noodle/Pad Thai.jpg','2025-08-21 15:54:07.652','2025-10-03 03:53:12.990','PROD0026',11.89,0),(41,'Lad Na','Stir-fried wide rice noodles',15.99,9,1,'http://localhost:5000/food_and_berverage/Rice and Noodle/Lad Na.jpg','2025-08-21 15:54:07.653','2025-10-03 03:53:12.991','PROD0027',11.19,0),(42,'Hookean Noodle','Traditional hookean noodles',17.99,9,1,'http://localhost:5000/food_and_berverage/Rice and Noodle/Hookean Noodle.jpg','2025-08-21 15:54:07.656','2025-10-03 03:53:12.993','PROD0028',12.59,0),(43,'Yellow Fried Rice','Yellow fried rice with vegetables',13.99,9,1,'http://localhost:5000/food_and_berverage/Rice and Noodle/Yellow Fried Rice.jpg','2025-08-21 15:54:07.658','2025-10-03 03:53:12.994','PROD0029',9.79,0),(44,'Fried Rice','Classic fried rice with vegetables',12.99,9,1,'http://localhost:5000/food_and_berverage/Rice and Noodle/Fried Rice.jpg','2025-08-21 15:54:07.661','2025-10-03 03:53:12.995','PROD0030',9.09,0),(45,'Cambodian Curry','Traditional Cambodian curry soup',15.99,10,1,'http://localhost:5000/food_and_berverage/Soup/Cambodian Curry.jpg','2025-08-21 15:54:07.665','2025-10-03 03:53:12.996','PROD0031',11.19,0),(46,'Green Curry','Spicy green curry soup',16.99,10,1,'http://localhost:5000/food_and_berverage/Soup/green curry.jpg','2025-08-21 15:54:07.667','2025-10-03 03:53:12.998','PROD0032',11.89,0),(47,'Khmer Hot Sour Soup','Traditional Khmer hot and sour soup',14.99,10,1,'http://localhost:5000/food_and_berverage/Soup/khmer hot sour soup.jpg','2025-08-21 15:54:07.670','2025-10-03 03:53:12.999','PROD0033',10.49,0),(48,'Meat Curry','Rich meat curry soup',17.99,10,1,'http://localhost:5000/food_and_berverage/Soup/meat curry.webp','2025-08-21 15:54:07.672','2025-10-03 03:53:13.000','PROD0034',12.59,0),(49,'Noodle Soup','Traditional noodle soup',13.99,10,1,'http://localhost:5000/food_and_berverage/Soup/noodle soup.jpg','2025-08-21 15:54:07.675','2025-10-03 03:53:13.001','PROD0035',9.79,0),(50,'Red Curry','Spicy red curry soup',16.99,10,1,'http://localhost:5000/food_and_berverage/Soup/Red Curry.jpg','2025-08-21 15:54:07.677','2025-10-03 03:53:13.003','PROD0036',11.89,0),(51,'Tom Kha Gai','Coconut milk soup with chicken',15.99,10,1,'http://localhost:5000/food_and_berverage/Soup/Tom Kha Gai.jpg','2025-08-21 15:54:07.678','2025-10-03 03:53:13.004','PROD0037',11.19,0),(52,'Tom Yam Soup','Spicy and sour tom yam soup',16.99,10,1,'http://localhost:5000/food_and_berverage/Soup/Tom Yam Soup.jpg','2025-08-21 15:54:07.680','2025-10-03 03:53:13.006','PROD0038',11.89,0),(53,'Vegetable Curry','Vegetable curry soup',14.99,10,1,'http://localhost:5000/food_and_berverage/Soup/Vegetable Curry.jpg','2025-08-21 15:54:07.683','2025-10-03 03:53:13.007','PROD0039',10.49,0),(54,'Bake French Onion Soup','Classic baked French onion soup',12.99,11,1,'http://localhost:5000/food_and_berverage/Western Soup/Bake French Onion Soup.jpg','2025-08-21 15:54:07.687','2025-10-03 03:53:13.009','PROD0040',9.09,0),(55,'Mushroom Cream Soup','Creamy mushroom soup',11.99,11,1,'http://localhost:5000/food_and_berverage/Western Soup/Mushroom Cream Soup.jpg','2025-08-21 15:54:07.689','2025-10-03 03:53:13.011','PROD0041',8.39,0),(56,'Potato Cream Soup','Creamy potato soup',10.99,11,1,'http://localhost:5000/food_and_berverage/Western Soup/Potato Cream Soup.jpg','2025-08-21 15:54:07.691','2025-10-03 03:53:13.012','PROD0042',7.69,0),(57,'Pumpkin Cream Soup','Creamy pumpkin soup',11.99,11,1,'http://localhost:5000/food_and_berverage/Western Soup/Pumpkin Cream Soup.jpg','2025-08-21 15:54:07.693','2025-10-03 03:53:13.014','PROD0043',8.39,0),(58,'Tomato Cream Soup','Creamy tomato soup',10.99,11,1,'http://localhost:5000/food_and_berverage/Western Soup/Tomato Cream Soup.jpg','2025-08-21 15:54:07.695','2025-10-03 03:53:13.016','PROD0044',7.69,0),(59,'Banana in Coconut Cream','Sweet banana in coconut cream',8.99,12,1,'http://localhost:5000/food_and_berverage/Dessert/Banana in coconut cream.jpg','2025-08-21 15:54:07.700','2025-10-03 03:53:13.017','PROD0045',6.29,0),(60,'Mixed Fruit','Fresh mixed fruit platter',9.99,12,1,'http://localhost:5000/food_and_berverage/Dessert/Mixed Fruit.jpg','2025-08-21 15:54:07.702','2025-10-03 03:53:13.018','PROD0046',6.99,0),(61,'Seasonal Tropical Fresh Fruit Platter','Seasonal tropical fruit platter',12.99,12,1,'http://localhost:5000/food_and_berverage/Dessert/Seasonal Tropical Fresh Fruit platter.webp','2025-08-21 15:54:07.705','2025-10-03 03:53:13.020','PROD0047',9.09,0),(62,'Fresh Juice','Fresh fruit juice',4.99,13,1,'http://localhost:5000/food_and_berverage/Soft Drinks/Fresh Juice.jpg','2025-08-21 15:54:07.708','2025-10-03 03:53:13.024','PROD0048',3.49,0),(63,'Water','Bottled water',2.99,13,1,NULL,'2025-08-21 15:54:07.713','2025-10-03 06:10:32.500','PROD0049',2.09,1),(64,'Soda','Carbonated soft drink',3.99,13,1,'http://localhost:5000/food_and_berverage/Soft Drinks/Soda.jpg','2025-08-21 15:54:07.718','2025-10-03 03:53:13.027','PROD0050',2.79,0),(65,'Sprite','Lemon-lime soft drink',3.99,13,1,NULL,'2025-08-21 15:54:07.722','2025-10-03 06:20:41.995','PROD0051',2.79,1),(66,'Fanta','Orange flavored soft drink',3.99,13,1,NULL,'2025-08-21 15:54:07.726','2025-10-03 06:10:42.585','PROD0052',2.79,1),(67,'Coca-Cola','Classic Coca-Cola',3.99,13,1,NULL,'2025-08-21 15:54:07.731','2025-10-03 06:10:48.513','PROD0053',2.79,1),(68,'Whiskey','Premium whiskey',12.99,14,1,NULL,'2025-08-21 15:54:07.736','2025-10-03 06:10:09.677','PROD0054',9.09,1),(69,'Cocktail','House cocktail',10.99,14,1,'http://localhost:5000/food_and_berverage/Hot&Cold Drinks/Cocktail.webp','2025-08-21 15:54:07.738','2025-10-03 03:53:13.033','PROD0055',7.69,0),(70,'Wine','House wine',9.99,14,1,NULL,'2025-08-21 15:54:07.743','2025-10-03 06:10:03.333','PROD0056',6.99,1),(71,'Beer','Draft beer',6.99,14,1,'http://localhost:5000/food_and_berverage/Hot&Cold Drinks/Beer.jpg','2025-08-21 15:54:07.746','2025-10-03 03:53:13.036','PROD0057',4.89,0),(72,'Jasmine Tea','Hot jasmine tea',3.99,14,1,'http://localhost:5000/food_and_berverage/Hot&Cold Drinks/Jasmine tea.jpg','2025-08-21 15:54:07.749','2025-10-03 03:53:13.037','PROD0058',2.79,0),(73,'Black Tea','Hot black tea',3.49,14,1,'http://localhost:5000/food_and_berverage/Hot&Cold Drinks/Black tea.jpg','2025-08-21 15:54:07.753','2025-10-03 03:53:13.038','PROD0059',2.44,0),(74,'Green Tea','Hot green tea',3.49,14,1,'http://localhost:5000/food_and_berverage/Hot&Cold Drinks/Green tea.jpg','2025-08-21 15:54:07.756','2025-10-03 03:53:13.039','PROD0060',2.44,0),(75,'Latte','Coffee latte',4.99,14,1,'http://localhost:5000/food_and_berverage/Hot&Cold Drinks/Latte.jpg','2025-08-21 15:54:07.760','2025-10-03 03:53:13.040','PROD0061',3.49,0),(76,'Cappuccino','Coffee cappuccino',4.49,14,1,'http://localhost:5000/food_and_berverage/Hot&Cold Drinks/Cappuccino.jpg','2025-08-21 15:54:07.762','2025-10-03 03:53:13.041','PROD0062',3.14,0),(77,'Espresso','Single shot espresso',3.99,14,1,'http://localhost:5000/food_and_berverage/Hot&Cold Drinks/Espresso.jpg','2025-08-21 15:54:07.766','2025-10-03 03:53:13.042','PROD0063',2.79,0),(119,'a5558','',1000.00,8,0,'/uploads/product-1759465165242-633120947.png','2025-10-03 04:19:06.454','2025-10-03 14:04:49.176','PROD0069',5.00,0),(120,'adrink','',15.00,14,0,NULL,'2025-10-03 05:11:02.898','2025-10-03 14:04:52.025','PROD0070',10.00,1),(121,'adtest','',15.00,14,0,NULL,'2025-10-03 06:04:17.108','2025-10-03 14:04:56.604','PROD0071',10.00,1);
/*!40000 ALTER TABLE `products` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `settings`
--

DROP TABLE IF EXISTS `settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `settings` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `category` varchar(191) NOT NULL,
  `data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`data`)),
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `settings_category_key` (`category`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `settings`
--

LOCK TABLES `settings` WRITE;
/*!40000 ALTER TABLE `settings` DISABLE KEYS */;
INSERT INTO `settings` VALUES (2,'business','{\"restaurantName\":\"Angkor Holiday\",\"address\":\"123 Main Street, City, State 12345\",\"phone\":\"+(855) 123-4567\",\"email\":\"info@restaurant.com\",\"taxRate\":10,\"currency\":\"USD\",\"timezone\":\"Asia/Phnom_Penh\"}','2025-10-01 05:46:18.708','2025-10-04 08:18:57.189'),(4,'security','{\"sessionTimeout\":1440,\"forceLogoutOnPasswordChange\":true,\"minPasswordLength\":6,\"requireUppercase\":true,\"requireNumbers\":true}','2025-10-04 08:18:37.011','2025-10-04 08:18:37.011'),(5,'system','{\"autoRefreshInterval\":30,\"lowStockThreshold\":10,\"maxTables\":20,\"enableNotifications\":true,\"enableAutoBackup\":true,\"backupFrequency\":\"monthly\"}','2025-10-04 08:27:44.720','2025-10-04 09:09:40.527'),(6,'payment','{\"acceptedMethods\":[\"cash\",\"card\"],\"requirePaymentConfirmation\":true,\"allowSplitPayments\":true,\"cashDrawerAutoOpen\":true,\"receiptRequired\":true,\"allowRefunds\":true,\"requireManagerApprovalForRefunds\":false,\"maxRefundAmount\":1000}','2025-10-04 08:36:52.801','2025-10-04 08:46:28.188'),(7,'ui','{\"theme\":\"dark\",\"language\":\"en\",\"dateFormat\":\"MM/DD/YYYY\",\"timeFormat\":\"12h\",\"currencyDisplay\":\"symbol\",\"showTooltips\":true,\"compactMode\":false,\"animations\":true,\"soundEffects\":false,\"confirmBeforeDelete\":true}','2025-10-04 08:36:52.801','2025-10-04 08:46:47.349'),(8,'order','{\"defaultOrderStatus\":\"pending\",\"allowPartialPayments\":false,\"requireCustomerInfo\":false,\"autoAssignTables\":false,\"orderTimeout\":30,\"maxOrderItems\":50,\"allowOrderSplitting\":true,\"requireOrderConfirmation\":false,\"autoSaveOrders\":true}','2025-10-04 08:36:52.801','2025-10-04 08:36:52.801'),(9,'receipt','{\"showTaxBreakdown\":false,\"showItemDetails\":true,\"footerMessage\":\"Thank you for dining with us!\",\"logoUrl\":null,\"receiptWidth\":80,\"autoPrint\":true,\"printOnPayment\":true,\"includeOrderNumber\":true,\"includeServerName\":true,\"includeTableNumber\":true}','2025-10-04 08:36:52.801','2025-10-04 08:45:21.660');
/*!40000 ALTER TABLE `settings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `stock`
--

DROP TABLE IF EXISTS `stock`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `stock` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `productId` int(11) NOT NULL,
  `quantity` int(11) NOT NULL DEFAULT 0,
  `minStock` int(11) NOT NULL DEFAULT 10,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `stock_productId_key` (`productId`),
  CONSTRAINT `stock_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `products` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=27 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `stock`
--

LOCK TABLES `stock` WRITE;
/*!40000 ALTER TABLE `stock` DISABLE KEYS */;
INSERT INTO `stock` VALUES (8,62,49,10,'2025-08-21 15:54:07.711','2025-10-01 16:33:16.400'),(9,63,50,10,'2025-08-21 15:54:07.714','2025-08-21 15:54:07.714'),(10,64,49,10,'2025-08-21 15:54:07.720','2025-10-01 16:54:26.293'),(11,65,49,10,'2025-08-21 15:54:07.724','2025-10-01 16:54:26.288'),(12,66,49,10,'2025-08-21 15:54:07.728','2025-10-01 16:33:16.397'),(13,67,45,10,'2025-08-21 15:54:07.732','2025-10-03 04:35:43.905'),(14,68,50,10,'2025-08-21 15:54:07.737','2025-08-21 15:54:07.737'),(15,69,46,10,'2025-08-21 15:54:07.741','2025-10-02 04:14:38.071'),(16,70,50,10,'2025-08-21 15:54:07.744','2025-08-21 15:54:07.744'),(17,71,47,10,'2025-08-21 15:54:07.748','2025-10-03 04:35:48.848'),(18,72,50,10,'2025-08-21 15:54:07.751','2025-08-21 15:54:07.751'),(19,73,45,10,'2025-08-21 15:54:07.755','2025-10-02 03:23:39.166'),(20,74,49,10,'2025-08-21 15:54:07.757','2025-10-01 16:33:16.404'),(21,75,50,10,'2025-08-21 15:54:07.761','2025-08-21 15:54:07.761'),(22,76,47,10,'2025-08-21 15:54:07.764','2025-10-02 04:45:57.851'),(23,77,49,10,'2025-08-21 15:54:07.768','2025-10-01 16:33:16.394'),(24,119,0,10,'2025-10-03 05:14:01.739','2025-10-03 05:14:01.739'),(25,120,5,10,'2025-10-03 05:14:01.744','2025-10-03 06:23:18.544'),(26,121,20,10,'2025-10-03 06:04:17.111','2025-10-03 06:19:43.734');
/*!40000 ALTER TABLE `stock` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `stock_logs`
--

DROP TABLE IF EXISTS `stock_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `stock_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `stockId` int(11) NOT NULL,
  `userId` int(11) NOT NULL,
  `type` enum('ADD','REMOVE','ADJUST') NOT NULL,
  `quantity` int(11) NOT NULL,
  `note` varchar(191) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`),
  KEY `stock_logs_stockId_fkey` (`stockId`),
  KEY `stock_logs_userId_fkey` (`userId`),
  CONSTRAINT `stock_logs_stockId_fkey` FOREIGN KEY (`stockId`) REFERENCES `stock` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `stock_logs_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=32 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `stock_logs`
--

LOCK TABLES `stock_logs` WRITE;
/*!40000 ALTER TABLE `stock_logs` DISABLE KEYS */;
INSERT INTO `stock_logs` VALUES (1,13,1,'REMOVE',2,'Order #ORD-20250826-175841 payment','2025-08-26 10:58:58.114'),(2,19,1,'REMOVE',1,'Order #ORD-20250826-181156 payment','2025-08-26 11:13:38.785'),(3,17,1,'REMOVE',1,'Order #ORD-20251001-124533 payment','2025-10-01 05:45:38.736'),(4,22,1,'REMOVE',1,'Order #ORD-20251001-205742 payment','2025-10-01 14:09:39.319'),(5,15,1,'REMOVE',1,'Order #ORD-20251001-211306 payment','2025-10-01 14:43:16.432'),(6,13,1,'REMOVE',1,'Order #ORD-20251001-211306 payment','2025-10-01 14:43:16.437'),(7,19,1,'REMOVE',1,'Order #ORD-20251001-224726 payment','2025-10-01 16:33:16.379'),(8,22,1,'REMOVE',1,'Order #ORD-20251001-224726 payment','2025-10-01 16:33:16.386'),(9,17,1,'REMOVE',1,'Order #ORD-20251001-224726 payment','2025-10-01 16:33:16.393'),(10,23,1,'REMOVE',1,'Order #ORD-20251001-224726 payment','2025-10-01 16:33:16.395'),(11,12,1,'REMOVE',1,'Order #ORD-20251001-224726 payment','2025-10-01 16:33:16.399'),(12,8,1,'REMOVE',1,'Order #ORD-20251001-224726 payment','2025-10-01 16:33:16.403'),(13,20,1,'REMOVE',1,'Order #ORD-20251001-224726 payment','2025-10-01 16:33:16.406'),(14,15,1,'REMOVE',1,'Order #ORD-20251001-231916 payment','2025-10-01 16:54:26.286'),(15,11,1,'REMOVE',1,'Order #ORD-20251001-231916 payment','2025-10-01 16:54:26.291'),(16,10,1,'REMOVE',1,'Order #ORD-20251001-231916 payment','2025-10-01 16:54:26.295'),(17,19,1,'REMOVE',1,'Order #ORD-20251002-000435 payment','2025-10-01 17:04:42.535'),(18,19,1,'REMOVE',1,'Order #ORD-20251002-000830 payment','2025-10-01 17:08:37.018'),(19,13,1,'REMOVE',1,'Order #ORD-20251002-000959 payment','2025-10-01 17:10:04.707'),(20,19,1,'REMOVE',1,'Order #ORD-20251002-102334 payment','2025-10-02 03:23:39.171'),(21,15,1,'REMOVE',2,'Order #ORD-20251002-110054 payment','2025-10-02 04:14:38.074'),(22,22,1,'REMOVE',1,'Order #ORD-20251002-114518 payment','2025-10-02 04:45:57.853'),(23,13,1,'REMOVE',1,'Order #ORD-20251003-113443 payment','2025-10-03 04:35:43.909'),(24,17,1,'REMOVE',1,'Order #ORD-20251003-113435 payment','2025-10-03 04:35:48.852'),(25,25,1,'ADD',10,'Quick restock','2025-10-03 06:19:41.116'),(26,26,1,'ADD',10,'Quick restock','2025-10-03 06:19:43.154'),(27,26,1,'ADD',10,'Quick restock','2025-10-03 06:19:43.736'),(28,25,1,'ADD',10,'Quick restock','2025-10-03 06:19:45.115'),(29,25,1,'ADD',10,'Quick restock','2025-10-03 06:19:46.508'),(30,25,1,'ADD',10,'Quick restock','2025-10-03 06:22:28.016'),(31,25,1,'ADJUST',5,'Stock adjusted','2025-10-03 06:23:18.545');
/*!40000 ALTER TABLE `stock_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tables`
--

DROP TABLE IF EXISTS `tables`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `tables` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `number` int(11) NOT NULL,
  `status` enum('AVAILABLE','OCCUPIED','RESERVED') NOT NULL DEFAULT 'AVAILABLE',
  `capacity` int(11) NOT NULL DEFAULT 4,
  `group` varchar(191) DEFAULT 'General',
  `notes` varchar(191) DEFAULT NULL,
  `maintenance` tinyint(1) NOT NULL DEFAULT 0,
  `isActive` tinyint(1) NOT NULL DEFAULT 1,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `tables_number_key` (`number`)
) ENGINE=InnoDB AUTO_INCREMENT=39 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tables`
--

LOCK TABLES `tables` WRITE;
/*!40000 ALTER TABLE `tables` DISABLE KEYS */;
INSERT INTO `tables` VALUES (1,1,'AVAILABLE',4,'General',NULL,0,1,'2025-08-21 15:48:13.374','2025-10-04 08:45:45.292'),(2,2,'OCCUPIED',4,'General',NULL,0,1,'2025-08-21 15:48:13.378','2025-10-03 13:46:13.360'),(3,3,'OCCUPIED',4,'General',NULL,0,1,'2025-08-21 15:48:13.379','2025-10-03 13:46:14.653'),(4,4,'RESERVED',4,'Center',NULL,0,1,'2025-08-21 15:48:13.384','2025-10-03 13:47:33.772'),(5,5,'AVAILABLE',8,'General',NULL,0,1,'2025-08-21 15:48:13.386','2025-10-04 07:09:25.244'),(6,6,'OCCUPIED',6,'General',NULL,0,1,'2025-08-21 15:48:13.390','2025-10-04 08:47:05.127'),(7,7,'AVAILABLE',6,'General',NULL,1,1,'2025-08-21 15:48:13.397','2025-10-03 13:46:24.572'),(8,8,'AVAILABLE',6,'General',NULL,0,1,'2025-08-21 15:48:13.401','2025-10-03 05:35:21.483'),(9,9,'AVAILABLE',8,'General',NULL,0,1,'2025-08-21 15:48:13.405','2025-08-21 15:48:13.405'),(10,10,'AVAILABLE',8,'General',NULL,0,1,'2025-08-21 15:48:13.409','2025-10-01 05:45:53.870'),(11,11,'AVAILABLE',8,'General',NULL,0,1,'2025-08-21 15:48:13.413','2025-08-21 15:48:13.413'),(12,12,'AVAILABLE',8,'General',NULL,0,1,'2025-08-21 15:48:13.417','2025-10-01 17:10:04.712'),(13,13,'AVAILABLE',8,'General',NULL,0,1,'2025-08-21 15:48:13.421','2025-08-21 15:48:13.421'),(14,14,'AVAILABLE',8,'General',NULL,0,1,'2025-08-21 15:48:13.424','2025-08-21 15:48:13.424'),(15,15,'AVAILABLE',8,'General',NULL,0,1,'2025-08-21 15:48:13.428','2025-10-04 07:09:18.983'),(16,16,'AVAILABLE',8,'General',NULL,0,1,'2025-08-21 15:48:13.431','2025-08-21 15:48:13.431'),(17,17,'AVAILABLE',8,'General',NULL,0,1,'2025-08-21 15:48:13.434','2025-08-21 15:48:13.434'),(18,18,'AVAILABLE',8,'General',NULL,0,1,'2025-08-21 15:48:13.438','2025-08-21 15:48:13.438'),(19,19,'AVAILABLE',8,'General',NULL,0,1,'2025-08-21 15:48:13.441','2025-08-21 15:48:13.441'),(20,20,'AVAILABLE',8,'General',NULL,0,1,'2025-08-21 15:48:13.446','2025-10-02 04:14:38.078'),(34,21,'AVAILABLE',4,'Center',NULL,0,1,'2025-10-02 04:39:18.241','2025-10-02 04:45:57.856'),(36,888,'AVAILABLE',4,'Test','Test table for history protection',0,0,'2025-10-02 04:43:14.849','2025-10-02 04:45:01.893');
/*!40000 ALTER TABLE `tables` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_permissions`
--

DROP TABLE IF EXISTS `user_permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `user_permissions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `userId` int(11) NOT NULL,
  `permission` varchar(191) NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_permissions_userId_permission_key` (`userId`,`permission`),
  CONSTRAINT `user_permissions_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_permissions`
--

LOCK TABLES `user_permissions` WRITE;
/*!40000 ALTER TABLE `user_permissions` DISABLE KEYS */;
INSERT INTO `user_permissions` VALUES (1,2,'orders.create','2025-10-03 15:08:27.149'),(2,2,'orders.read','2025-10-03 15:08:27.149'),(3,2,'orders.update','2025-10-03 15:08:27.149'),(4,2,'products.read','2025-10-03 15:08:27.149'),(5,2,'categories.read','2025-10-03 15:08:27.149'),(6,2,'tables.read','2025-10-03 15:08:27.149'),(7,2,'tables.update','2025-10-03 15:08:27.149'),(8,2,'stock.read','2025-10-03 15:08:27.149'),(9,2,'stock.update','2025-10-03 15:08:27.149'),(10,2,'reports.read','2025-10-03 15:08:27.149');
/*!40000 ALTER TABLE `user_permissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(191) NOT NULL,
  `password` varchar(191) NOT NULL,
  `role` enum('ADMIN','CASHIER') NOT NULL DEFAULT 'CASHIER',
  `name` varchar(191) NOT NULL,
  `email` varchar(191) DEFAULT NULL,
  `isActive` tinyint(1) NOT NULL DEFAULT 1,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  `createdBy` int(11) DEFAULT NULL,
  `lastLogin` datetime(3) DEFAULT NULL,
  `loginCount` int(11) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_username_key` (`username`),
  UNIQUE KEY `users_email_key` (`email`),
  KEY `users_createdBy_fkey` (`createdBy`),
  CONSTRAINT `users_createdBy_fkey` FOREIGN KEY (`createdBy`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'admin','$2a$12$SkrkldCtmBZ3TnNAUKaDOux1SH6YvDiJC5IyHUCcD1gA2K.0i835C','ADMIN','System Administrator','admin@restaurant.com',1,'2025-08-21 15:48:13.155','2025-10-04 09:25:04.388',NULL,'2025-10-04 09:25:04.386',4),(2,'cashier','$2a$12$zFA4jrCrXNqOeqYn5H1Dru1s1VUibi1GA5H0kap1/Lo8LG/QoPQRu','CASHIER','Cashier User','cashier@restaurant.com',1,'2025-08-21 15:48:13.367','2025-10-03 15:28:19.714',NULL,'2025-10-03 15:28:19.713',2),(3,'admin01','$2a$12$/xzQxlrGjGM1w.uiaMqee.uQekugriuQwPFaZjSmpLcjfnEymAeH6','ADMIN','admin01','vireak@gmail.com',1,'2025-10-03 15:09:38.520','2025-10-03 15:09:38.520',NULL,NULL,0);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-10-04 17:25:42
