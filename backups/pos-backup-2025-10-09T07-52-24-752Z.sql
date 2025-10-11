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
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `categories`
--

LOCK TABLES `categories` WRITE;
/*!40000 ALTER TABLE `categories` DISABLE KEYS */;
INSERT INTO `categories` VALUES (6,'Appetizer & Salad','Appetizer & Salad menu items',1,'2025-08-21 15:54:07.572','2025-08-21 15:54:07.572'),(7,'Appetizers and Snack','Appetizers and Snack menu items',1,'2025-08-21 15:54:07.594','2025-08-21 15:54:07.594'),(8,'Main course','Main course menu items',1,'2025-08-21 15:54:07.622','2025-08-21 15:54:07.622'),(9,'Rice and Noodle','Rice and Noodle menu items',1,'2025-08-21 15:54:07.644','2025-08-21 15:54:07.644'),(10,'Soup','Soup menu items',1,'2025-08-21 15:54:07.664','2025-08-21 15:54:07.664'),(11,'Western Soup','Western Soup menu items',1,'2025-08-21 15:54:07.685','2025-08-21 15:54:07.685'),(12,'Dessert','Dessert menu items',1,'2025-08-21 15:54:07.698','2025-08-21 15:54:07.698'),(13,'Soft Drinks','Soft Drinks menu items',1,'2025-08-21 15:54:07.707','2025-08-21 15:54:07.707'),(14,'Hot&Cold Drinks','Hot&Cold Drinks menu items',1,'2025-08-21 15:54:07.733','2025-08-21 15:54:07.733'),(16,'a1','',1,'2025-10-09 06:35:03.063','2025-10-09 06:35:03.063');
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
) ENGINE=InnoDB AUTO_INCREMENT=190 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `order_items`
--

LOCK TABLES `order_items` WRITE;
/*!40000 ALTER TABLE `order_items` DISABLE KEYS */;
INSERT INTO `order_items` VALUES (2,2,15,1,8.99,8.99,'2025-08-21 16:19:30.445'),(3,3,22,1,15.99,15.99,'2025-08-21 16:20:47.168'),(4,4,57,1,11.99,11.99,'2025-08-26 10:51:21.433'),(5,4,56,1,10.99,10.99,'2025-08-26 10:51:21.433'),(6,5,54,2,12.99,25.98,'2025-08-26 10:58:41.224'),(7,5,67,2,3.99,7.98,'2025-08-26 10:58:41.224'),(8,6,15,2,8.99,17.98,'2025-08-26 11:10:54.957'),(9,7,73,1,3.49,3.49,'2025-08-26 11:11:56.657'),(10,8,54,1,12.99,12.99,'2025-10-01 04:25:38.794'),(11,9,54,1,12.99,12.99,'2025-10-01 05:43:09.457'),(12,10,71,1,6.99,6.99,'2025-10-01 05:45:33.451'),(13,11,26,1,12.99,12.99,'2025-10-01 05:45:49.226'),(14,12,15,1,8.99,8.99,'2025-10-01 05:52:00.002'),(15,12,24,1,6.99,6.99,'2025-10-01 05:52:00.002'),(19,14,55,2,11.99,23.98,'2025-10-01 14:09:20.088'),(20,14,57,1,11.99,11.99,'2025-10-01 14:09:20.088'),(21,14,76,1,4.49,4.49,'2025-10-01 14:09:20.088'),(29,16,45,1,15.99,15.99,'2025-10-01 14:21:53.372'),(30,16,22,1,15.99,15.99,'2025-10-01 14:21:53.372'),(31,16,26,1,12.99,12.99,'2025-10-01 14:21:53.372'),(32,16,15,1,8.99,8.99,'2025-10-01 14:21:53.372'),(33,16,69,1,10.99,10.99,'2025-10-01 14:21:53.372'),(34,16,67,1,3.99,3.99,'2025-10-01 14:21:53.372'),(35,15,32,1,17.99,17.99,'2025-10-01 14:43:09.739'),(36,15,31,1,19.99,19.99,'2025-10-01 14:43:09.739'),(37,17,22,1,15.99,15.99,'2025-10-01 15:47:26.838'),(38,17,73,1,3.49,3.49,'2025-10-01 15:47:26.838'),(39,17,32,1,17.99,17.99,'2025-10-01 15:47:26.838'),(40,17,76,1,4.49,4.49,'2025-10-01 15:47:26.838'),(41,17,71,1,6.99,6.99,'2025-10-01 15:47:26.838'),(42,17,59,1,8.99,8.99,'2025-10-01 15:47:26.838'),(43,17,45,1,15.99,15.99,'2025-10-01 15:47:26.838'),(44,17,15,1,8.99,8.99,'2025-10-01 15:47:26.838'),(45,17,77,1,3.99,3.99,'2025-10-01 15:47:26.838'),(46,17,66,1,3.99,3.99,'2025-10-01 15:47:26.838'),(47,17,28,1,14.99,14.99,'2025-10-01 15:47:26.838'),(48,17,20,1,7.99,7.99,'2025-10-01 15:47:26.838'),(49,17,16,1,12.99,12.99,'2025-10-01 15:47:26.838'),(50,17,42,1,17.99,17.99,'2025-10-01 15:47:26.838'),(51,17,62,1,4.99,4.99,'2025-10-01 15:47:26.838'),(52,17,74,1,3.49,3.49,'2025-10-01 15:47:26.838'),(53,17,18,1,9.99,9.99,'2025-10-01 15:47:26.838'),(54,17,46,1,16.99,16.99,'2025-10-01 15:47:26.838'),(55,18,22,2,15.99,31.98,'2025-10-01 16:19:16.497'),(56,18,15,1,8.99,8.99,'2025-10-01 16:19:16.497'),(57,18,69,1,10.99,10.99,'2025-10-01 16:19:16.497'),(58,18,24,1,6.99,6.99,'2025-10-01 16:19:16.497'),(59,18,41,1,15.99,15.99,'2025-10-01 16:19:16.497'),(60,18,50,1,16.99,16.99,'2025-10-01 16:19:16.497'),(61,18,65,1,3.99,3.99,'2025-10-01 16:19:16.497'),(62,18,64,1,3.99,3.99,'2025-10-01 16:19:16.497'),(63,18,57,1,11.99,11.99,'2025-10-01 16:19:16.497'),(64,18,56,1,10.99,10.99,'2025-10-01 16:19:16.497'),(65,18,48,1,17.99,17.99,'2025-10-01 16:19:16.497'),(66,18,60,1,9.99,9.99,'2025-10-01 16:19:16.497'),(67,18,55,1,11.99,11.99,'2025-10-01 16:19:16.497'),(68,18,61,1,12.99,12.99,'2025-10-01 16:19:16.497'),(69,18,21,1,16.99,16.99,'2025-10-01 16:19:16.497'),(70,18,38,1,20.99,20.99,'2025-10-01 16:19:16.497'),(71,19,59,1,8.99,8.99,'2025-10-01 16:58:01.722'),(72,20,15,1,8.99,8.99,'2025-10-01 17:01:08.109'),(73,21,26,1,12.99,12.99,'2025-10-01 17:03:58.599'),(74,22,73,1,3.49,3.49,'2025-10-01 17:04:35.344'),(75,23,22,1,15.99,15.99,'2025-10-01 17:06:19.502'),(76,24,73,1,3.49,3.49,'2025-10-01 17:08:30.231'),(77,25,67,1,3.99,3.99,'2025-10-01 17:09:59.216'),(78,26,22,1,15.99,15.99,'2025-10-01 17:10:26.756'),(79,27,73,1,3.49,3.49,'2025-10-02 03:23:34.817'),(93,35,26,1,12.99,12.99,'2025-10-02 04:00:54.311'),(94,35,69,2,10.99,21.98,'2025-10-02 04:00:54.311'),(95,37,76,1,4.49,4.49,'2025-10-02 04:45:18.263'),(96,38,59,1,8.99,8.99,'2025-10-02 05:25:30.516'),(97,39,26,1,12.99,12.99,'2025-10-02 16:08:19.756'),(98,40,71,1,6.99,6.99,'2025-10-03 04:34:35.620'),(99,41,32,1,17.99,17.99,'2025-10-03 04:34:43.288'),(100,41,67,1,3.99,3.99,'2025-10-03 04:34:43.288'),(101,42,71,1,6.99,6.99,'2025-10-03 05:35:13.876'),(102,43,54,1,12.99,12.99,'2025-10-03 12:45:43.625'),(103,44,59,1,8.99,8.99,'2025-10-03 15:28:43.334'),(104,45,76,1,4.49,4.49,'2025-10-04 07:09:00.460'),(105,46,28,2,14.99,29.98,'2025-10-04 07:09:14.574'),(106,46,27,1,10.99,10.99,'2025-10-04 07:09:14.574'),(107,47,48,1,17.99,17.99,'2025-10-04 08:45:41.486'),(108,48,71,1,6.99,6.99,'2025-10-04 08:47:05.124'),(109,49,59,1,8.99,8.99,'2025-10-04 11:54:32.957'),(110,50,48,1,17.99,17.99,'2025-10-04 12:15:19.536'),(111,50,47,1,14.99,14.99,'2025-10-04 12:15:19.536'),(113,51,71,1,6.99,6.99,'2025-10-04 12:59:00.306'),(114,52,54,1,12.99,12.99,'2025-10-05 07:17:25.122'),(115,53,32,1,17.99,17.99,'2025-10-05 07:18:18.739'),(116,54,59,1,8.99,8.99,'2025-10-05 07:35:41.868'),(117,54,45,1,15.99,15.99,'2025-10-05 07:35:41.868'),(118,55,59,1,8.99,8.99,'2025-10-05 07:42:18.104'),(119,55,71,6,6.99,41.94,'2025-10-05 07:42:18.104'),(120,55,32,1,17.99,17.99,'2025-10-05 07:42:18.104'),(121,55,76,1,4.49,4.49,'2025-10-05 07:42:18.104'),(122,55,45,1,15.99,15.99,'2025-10-05 07:42:18.104'),(123,56,26,1,12.99,12.99,'2025-10-07 03:55:37.814'),(124,56,32,1,17.99,17.99,'2025-10-07 03:55:37.814'),(125,57,45,1,15.99,15.99,'2025-10-07 05:00:34.580'),(126,58,71,1,6.99,6.99,'2025-10-07 05:46:23.843'),(127,59,54,1,12.99,12.99,'2025-10-07 06:47:20.646'),(128,60,45,1,15.99,15.99,'2025-10-07 06:47:34.811'),(129,60,76,1,4.49,4.49,'2025-10-07 06:47:34.811'),(130,61,28,1,14.99,14.99,'2025-10-07 07:57:54.899'),(131,62,24,1,6.99,6.99,'2025-10-07 08:11:20.345'),(132,63,16,1,12.99,12.99,'2025-10-07 08:36:06.276'),(133,63,62,3,4.99,14.97,'2025-10-07 08:36:06.276'),(134,63,24,1,6.99,6.99,'2025-10-07 08:36:06.276'),(135,63,69,1,10.99,10.99,'2025-10-07 08:36:06.276'),(136,64,32,1,17.99,17.99,'2025-10-07 08:38:11.885'),(137,64,76,1,4.49,4.49,'2025-10-07 08:38:11.885'),(138,65,32,1,17.99,17.99,'2025-10-07 08:45:43.918'),(139,65,45,1,15.99,15.99,'2025-10-07 08:45:43.918'),(140,66,71,1,6.99,6.99,'2025-10-07 08:48:29.209'),(141,66,26,1,12.99,12.99,'2025-10-07 08:48:29.209'),(142,67,18,1,9.99,9.99,'2025-10-07 08:55:24.494'),(143,67,41,1,15.99,15.99,'2025-10-07 08:55:24.494'),(144,67,33,4,21.99,87.96,'2025-10-07 08:55:24.494'),(145,67,48,1,17.99,17.99,'2025-10-07 08:55:24.494'),(146,68,45,1,15.99,15.99,'2025-10-08 04:13:40.587'),(147,68,26,1,12.99,12.99,'2025-10-08 04:13:40.587'),(148,69,22,1,15.99,15.99,'2025-10-08 05:18:34.158'),(149,69,73,1,3.49,3.49,'2025-10-08 05:18:34.158'),(153,71,54,1,12.99,12.99,'2025-10-08 06:40:01.277'),(154,71,76,1,4.49,4.49,'2025-10-08 06:40:01.277'),(155,71,32,1,17.99,17.99,'2025-10-08 06:40:01.277'),(156,71,26,1,12.99,12.99,'2025-10-08 06:40:01.277'),(157,71,22,2,15.99,31.98,'2025-10-08 06:40:01.277'),(158,70,54,1,12.99,12.99,'2025-10-08 06:40:17.503'),(159,70,55,1,11.99,11.99,'2025-10-08 06:40:17.503'),(160,70,56,1,10.99,10.99,'2025-10-08 06:40:17.503'),(161,72,54,3,12.99,38.97,'2025-10-08 06:42:06.132'),(162,72,71,1,6.99,6.99,'2025-10-08 06:42:06.132'),(163,73,32,1,17.99,17.99,'2025-10-08 06:43:00.543'),(164,73,45,1,15.99,15.99,'2025-10-08 06:43:00.543'),(165,74,59,1,8.99,8.99,'2025-10-08 08:04:12.181'),(166,74,45,1,15.99,15.99,'2025-10-08 08:04:12.181'),(167,75,71,1,6.99,6.99,'2025-10-08 08:14:41.489'),(168,75,32,1,17.99,17.99,'2025-10-08 08:14:41.489'),(169,75,76,1,4.49,4.49,'2025-10-08 08:14:41.489'),(170,76,59,1,8.99,8.99,'2025-10-08 10:47:37.317'),(171,76,76,1,4.49,4.49,'2025-10-08 10:47:37.317'),(172,76,32,3,17.99,53.97,'2025-10-08 10:47:37.317'),(173,77,54,1,12.99,12.99,'2025-10-08 11:44:10.837'),(174,77,45,1,15.99,15.99,'2025-10-08 11:44:10.837'),(175,77,76,1,4.49,4.49,'2025-10-08 11:44:10.837'),(176,77,59,1,8.99,8.99,'2025-10-08 11:44:10.837'),(177,77,26,1,12.99,12.99,'2025-10-08 11:44:10.837'),(178,77,22,1,15.99,15.99,'2025-10-08 11:44:10.837'),(179,78,54,1,12.99,12.99,'2025-10-09 07:06:33.368'),(180,78,45,1,15.99,15.99,'2025-10-09 07:06:33.368'),(181,78,26,1,12.99,12.99,'2025-10-09 07:06:33.368'),(182,78,32,1,17.99,17.99,'2025-10-09 07:06:33.368'),(183,79,71,1,6.99,6.99,'2025-10-09 07:08:09.639'),(184,80,59,1,8.99,8.99,'2025-10-09 07:15:29.344'),(185,80,45,1,15.99,15.99,'2025-10-09 07:15:29.344'),(186,81,45,1,15.99,15.99,'2025-10-09 07:19:05.856'),(187,81,26,1,12.99,12.99,'2025-10-09 07:19:05.856'),(188,81,22,1,15.99,15.99,'2025-10-09 07:19:05.856'),(189,82,59,1,8.99,8.99,'2025-10-09 07:46:45.185');
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
  `paymentMethod` enum('CASH','CARD','QR') DEFAULT NULL,
  `customerNote` varchar(191) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  `businessSnapshot` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`businessSnapshot`)),
  `currency` varchar(191) DEFAULT 'USD',
  `splitAmounts` text DEFAULT NULL,
  `splitBill` tinyint(1) NOT NULL DEFAULT 0,
  `mixedPayments` tinyint(1) NOT NULL DEFAULT 0,
  `paymentMethods` text DEFAULT NULL,
  `nestedPayments` tinyint(1) NOT NULL DEFAULT 0,
  `mixedCurrency` tinyint(1) NOT NULL DEFAULT 0,
  `splitMixedCurrency` tinyint(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `orders_orderNumber_key` (`orderNumber`),
  KEY `orders_tableId_fkey` (`tableId`),
  KEY `orders_userId_fkey` (`userId`),
  CONSTRAINT `orders_tableId_fkey` FOREIGN KEY (`tableId`) REFERENCES `tables` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `orders_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=83 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `orders`
--

LOCK TABLES `orders` WRITE;
/*!40000 ALTER TABLE `orders` DISABLE KEYS */;
INSERT INTO `orders` VALUES (2,'ORD-20250821-231930',1,1,'COMPLETED',8.99,0.76,0.00,9.75,'CARD','Test order','2025-08-21 16:19:30.443','2025-08-21 16:22:06.573','{\"restaurantName\":\"Restaurant POS\",\"address\":\"123 Main Street, City, State 12345\",\"phone\":\"+1 (555) 123-4567\",\"email\":\"info@restaurant.com\",\"taxRate\":8.5,\"currency\":\"USD\",\"timezone\":\"America/New_York\"}','USD',NULL,0,0,NULL,0,0,0),(3,'ORD-20250821-232047',2,1,'COMPLETED',15.99,1.36,0.00,17.35,'CARD',NULL,'2025-08-21 16:20:47.164','2025-08-21 16:20:58.090','{\"restaurantName\":\"Restaurant POS\",\"address\":\"123 Main Street, City, State 12345\",\"phone\":\"+1 (555) 123-4567\",\"email\":\"info@restaurant.com\",\"taxRate\":8.5,\"currency\":\"USD\",\"timezone\":\"America/New_York\"}','USD',NULL,0,0,NULL,0,0,0),(4,'ORD-20250826-175121',1,1,'CANCELLED',22.98,1.95,0.00,24.93,NULL,NULL,'2025-08-26 10:51:21.425','2025-08-26 10:58:51.261','{\"restaurantName\":\"Restaurant POS\",\"address\":\"123 Main Street, City, State 12345\",\"phone\":\"+1 (555) 123-4567\",\"email\":\"info@restaurant.com\",\"taxRate\":8.5,\"currency\":\"USD\",\"timezone\":\"America/New_York\"}','USD',NULL,0,0,NULL,0,0,0),(5,'ORD-20250826-175841',2,1,'COMPLETED',33.96,2.89,3.40,33.45,'CARD',NULL,'2025-08-26 10:58:41.217','2025-08-26 10:58:58.092','{\"restaurantName\":\"Restaurant POS\",\"address\":\"123 Main Street, City, State 12345\",\"phone\":\"+1 (555) 123-4567\",\"email\":\"info@restaurant.com\",\"taxRate\":8.5,\"currency\":\"USD\",\"timezone\":\"America/New_York\"}','USD',NULL,0,0,NULL,0,0,0),(6,'ORD-20250826-181054',1,1,'COMPLETED',17.98,1.53,0.00,19.51,'CARD',NULL,'2025-08-26 11:10:54.947','2025-08-26 11:11:11.177','{\"restaurantName\":\"Restaurant POS\",\"address\":\"123 Main Street, City, State 12345\",\"phone\":\"+1 (555) 123-4567\",\"email\":\"info@restaurant.com\",\"taxRate\":8.5,\"currency\":\"USD\",\"timezone\":\"America/New_York\"}','USD',NULL,0,0,NULL,0,0,0),(7,'ORD-20250826-181156',1,1,'COMPLETED',3.49,0.30,0.00,3.79,'CARD',NULL,'2025-08-26 11:11:56.648','2025-08-26 11:13:38.773','{\"restaurantName\":\"Restaurant POS\",\"address\":\"123 Main Street, City, State 12345\",\"phone\":\"+1 (555) 123-4567\",\"email\":\"info@restaurant.com\",\"taxRate\":8.5,\"currency\":\"USD\",\"timezone\":\"America/New_York\"}','USD',NULL,0,0,NULL,0,0,0),(8,'ORD-20251001-112538',1,1,'COMPLETED',12.99,1.10,0.00,14.09,'CARD',NULL,'2025-10-01 04:25:38.790','2025-10-01 04:25:47.421','{\"restaurantName\":\"Restaurant POS\",\"address\":\"123 Main Street, City, State 12345\",\"phone\":\"+1 (555) 123-4567\",\"email\":\"info@restaurant.com\",\"taxRate\":8.5,\"currency\":\"USD\",\"timezone\":\"America/New_York\"}','USD',NULL,0,0,NULL,0,0,0),(9,'ORD-20251001-124309',1,1,'COMPLETED',12.99,1.10,0.00,14.09,'CARD',NULL,'2025-10-01 05:43:09.452','2025-10-01 05:43:21.448','{\"restaurantName\":\"Restaurant POS\",\"address\":\"123 Main Street, City, State 12345\",\"phone\":\"+1 (555) 123-4567\",\"email\":\"info@restaurant.com\",\"taxRate\":8.5,\"currency\":\"USD\",\"timezone\":\"America/New_York\"}','USD',NULL,0,0,NULL,0,0,0),(10,'ORD-20251001-124533',3,1,'COMPLETED',6.99,0.59,0.00,7.58,'CARD',NULL,'2025-10-01 05:45:33.446','2025-10-01 05:45:38.731','{\"restaurantName\":\"Restaurant POS\",\"address\":\"123 Main Street, City, State 12345\",\"phone\":\"+1 (555) 123-4567\",\"email\":\"info@restaurant.com\",\"taxRate\":8.5,\"currency\":\"USD\",\"timezone\":\"America/New_York\"}','USD',NULL,0,0,NULL,0,0,0),(11,'ORD-20251001-124549',10,1,'COMPLETED',12.99,1.10,0.00,14.09,'CASH',NULL,'2025-10-01 05:45:49.223','2025-10-01 05:45:53.868','{\"restaurantName\":\"Restaurant POS\",\"address\":\"123 Main Street, City, State 12345\",\"phone\":\"+1 (555) 123-4567\",\"email\":\"info@restaurant.com\",\"taxRate\":8.5,\"currency\":\"USD\",\"timezone\":\"America/New_York\"}','USD',NULL,0,0,NULL,0,0,0),(12,'ORD-20251001-125159',1,1,'COMPLETED',15.98,1.60,0.00,17.58,'CASH',NULL,'2025-10-01 05:51:59.998','2025-10-01 05:52:08.812','{\"restaurantName\":\"Restaurant POS\",\"address\":\"123 Main Street, City, State 12345\",\"phone\":\"+1 (555) 123-4567\",\"email\":\"info@restaurant.com\",\"taxRate\":10,\"currency\":\"USD\",\"timezone\":\"America/New_York\"}','USD',NULL,0,0,NULL,0,0,0),(14,'ORD-20251001-205742',1,1,'COMPLETED',40.46,4.05,6.07,38.44,'CARD','','2025-10-01 13:57:42.273','2025-10-01 14:09:39.308','{\"restaurantName\":\"Restaurant POS\",\"address\":\"123 Main Street, City, State 12345\",\"phone\":\"+1 (555) 123-4567\",\"email\":\"info@restaurant.com\",\"taxRate\":10,\"currency\":\"USD\",\"timezone\":\"America/New_York\"}','USD',NULL,0,0,NULL,0,0,0),(15,'ORD-20251001-211234',2,1,'COMPLETED',37.98,3.80,0.00,41.78,'CARD',NULL,'2025-10-01 14:12:34.582','2025-10-01 14:43:23.693','{\"restaurantName\":\"Restaurant POS\",\"address\":\"123 Main Street, City, State 12345\",\"phone\":\"+1 (555) 123-4567\",\"email\":\"info@restaurant.com\",\"taxRate\":10,\"currency\":\"USD\",\"timezone\":\"America/New_York\"}','USD',NULL,0,0,NULL,0,0,0),(16,'ORD-20251001-211306',4,1,'COMPLETED',68.94,6.89,6.89,68.94,'CASH',NULL,'2025-10-01 14:13:06.500','2025-10-01 14:43:16.425','{\"restaurantName\":\"Restaurant POS\",\"address\":\"123 Main Street, City, State 12345\",\"phone\":\"+1 (555) 123-4567\",\"email\":\"info@restaurant.com\",\"taxRate\":10,\"currency\":\"USD\",\"timezone\":\"America/New_York\"}','USD',NULL,0,0,NULL,0,0,0),(17,'ORD-20251001-224726',1,1,'COMPLETED',180.32,18.03,27.05,171.30,'CASH',NULL,'2025-10-01 15:47:26.830','2025-10-01 16:33:16.370','{\"restaurantName\":\"Restaurant POS\",\"address\":\"123 Main Street, City, State 12345\",\"phone\":\"+1 (555) 123-4567\",\"email\":\"info@restaurant.com\",\"taxRate\":10,\"currency\":\"USD\",\"timezone\":\"America/New_York\"}','USD',NULL,0,0,NULL,0,0,0),(18,'ORD-20251001-231916',3,1,'COMPLETED',213.83,21.38,0.00,235.21,'CASH',NULL,'2025-10-01 16:19:16.494','2025-10-01 16:54:26.277','{\"restaurantName\":\"Restaurant POS\",\"address\":\"123 Main Street, City, State 12345\",\"phone\":\"+1 (555) 123-4567\",\"email\":\"info@restaurant.com\",\"taxRate\":10,\"currency\":\"USD\",\"timezone\":\"America/New_York\"}','USD',NULL,0,0,NULL,0,0,0),(19,'ORD-20251001-235801',1,1,'COMPLETED',8.99,0.90,0.00,9.89,'CARD',NULL,'2025-10-01 16:58:01.715','2025-10-01 16:58:06.173','{\"restaurantName\":\"Restaurant POS\",\"address\":\"123 Main Street, City, State 12345\",\"phone\":\"+1 (555) 123-4567\",\"email\":\"info@restaurant.com\",\"taxRate\":10,\"currency\":\"USD\",\"timezone\":\"America/New_York\"}','USD',NULL,0,0,NULL,0,0,0),(20,'ORD-20251002-000108',12,1,'COMPLETED',8.99,0.90,0.00,9.89,'CARD',NULL,'2025-10-01 17:01:08.107','2025-10-01 17:01:11.984','{\"restaurantName\":\"Restaurant POS\",\"address\":\"123 Main Street, City, State 12345\",\"phone\":\"+1 (555) 123-4567\",\"email\":\"info@restaurant.com\",\"taxRate\":10,\"currency\":\"USD\",\"timezone\":\"America/New_York\"}','USD',NULL,0,0,NULL,0,0,0),(21,'ORD-20251002-000358',8,1,'COMPLETED',12.99,1.30,0.00,14.29,'CARD',NULL,'2025-10-01 17:03:58.594','2025-10-01 17:04:04.036','{\"restaurantName\":\"Restaurant POS\",\"address\":\"123 Main Street, City, State 12345\",\"phone\":\"+1 (555) 123-4567\",\"email\":\"info@restaurant.com\",\"taxRate\":10,\"currency\":\"USD\",\"timezone\":\"America/New_York\"}','USD',NULL,0,0,NULL,0,0,0),(22,'ORD-20251002-000435',4,1,'COMPLETED',3.49,0.35,0.00,3.84,'CARD',NULL,'2025-10-01 17:04:35.343','2025-10-01 17:04:42.528','{\"restaurantName\":\"Restaurant POS\",\"address\":\"123 Main Street, City, State 12345\",\"phone\":\"+1 (555) 123-4567\",\"email\":\"info@restaurant.com\",\"taxRate\":10,\"currency\":\"USD\",\"timezone\":\"America/New_York\"}','USD',NULL,0,0,NULL,0,0,0),(23,'ORD-20251002-000619',2,1,'COMPLETED',15.99,1.60,0.00,17.59,'CASH',NULL,'2025-10-01 17:06:19.499','2025-10-01 17:06:22.979','{\"restaurantName\":\"Restaurant POS\",\"address\":\"123 Main Street, City, State 12345\",\"phone\":\"+1 (555) 123-4567\",\"email\":\"info@restaurant.com\",\"taxRate\":10,\"currency\":\"USD\",\"timezone\":\"America/New_York\"}','USD',NULL,0,0,NULL,0,0,0),(24,'ORD-20251002-000830',1,1,'COMPLETED',3.49,0.35,0.00,3.84,'CARD',NULL,'2025-10-01 17:08:30.228','2025-10-01 17:08:37.013','{\"restaurantName\":\"Restaurant POS\",\"address\":\"123 Main Street, City, State 12345\",\"phone\":\"+1 (555) 123-4567\",\"email\":\"info@restaurant.com\",\"taxRate\":10,\"currency\":\"USD\",\"timezone\":\"America/New_York\"}','USD',NULL,0,0,NULL,0,0,0),(25,'ORD-20251002-000959',12,1,'COMPLETED',3.99,0.40,0.00,4.39,'CARD',NULL,'2025-10-01 17:09:59.211','2025-10-01 17:10:04.702','{\"restaurantName\":\"Restaurant POS\",\"address\":\"123 Main Street, City, State 12345\",\"phone\":\"+1 (555) 123-4567\",\"email\":\"info@restaurant.com\",\"taxRate\":10,\"currency\":\"USD\",\"timezone\":\"America/New_York\"}','USD',NULL,0,0,NULL,0,0,0),(26,'ORD-20251002-001026',2,1,'COMPLETED',15.99,1.60,0.00,17.59,'CARD',NULL,'2025-10-01 17:10:26.753','2025-10-01 17:15:09.388','{\"restaurantName\":\"Restaurant POS\",\"address\":\"123 Main Street, City, State 12345\",\"phone\":\"+1 (555) 123-4567\",\"email\":\"info@restaurant.com\",\"taxRate\":10,\"currency\":\"USD\",\"timezone\":\"America/New_York\"}','USD',NULL,0,0,NULL,0,0,0),(27,'ORD-20251002-102334',1,1,'COMPLETED',3.49,0.35,0.00,3.84,'CARD',NULL,'2025-10-02 03:23:34.811','2025-10-02 03:23:39.160','{\"restaurantName\":\"Angkor Holiday\",\"address\":\"Sivutha Street, Siem Reap, Cambodia\",\"phone\":\"+(855) 12457288\",\"email\":\"angkorholiday@gmail.com\",\"taxRate\":10,\"currency\":\"USD\",\"timezone\":\"America/New_York\"}','USD',NULL,0,0,NULL,0,0,0),(35,'ORD-20251002-110054',20,1,'COMPLETED',34.97,2.97,0.00,37.94,'CARD',NULL,'2025-10-02 04:00:54.306','2025-10-02 04:14:38.066','{\"restaurantName\":\"Angkor Holiday\",\"address\":\"123 Main Street, City, State 12345\",\"phone\":\"+(855) 123-4567\",\"email\":\"info@restaurant.com\",\"taxRate\":8.5,\"currency\":\"USD\",\"timezone\":\"America/New_York\"}','USD',NULL,0,0,NULL,0,0,0),(37,'ORD-20251002-114518',34,1,'COMPLETED',4.49,0.38,0.00,4.87,'CASH',NULL,'2025-10-02 04:45:18.259','2025-10-02 04:45:57.847','{\"restaurantName\":\"Angkor Holiday\",\"address\":\"123 Main Street, City, State 12345\",\"phone\":\"+(855) 123-4567\",\"email\":\"info@restaurant.com\",\"taxRate\":8.5,\"currency\":\"USD\",\"timezone\":\"America/New_York\"}','USD',NULL,0,0,NULL,0,0,0),(38,'ORD-20251002-122530',5,1,'COMPLETED',8.99,0.76,0.00,9.75,'CARD',NULL,'2025-10-02 05:25:30.507','2025-10-02 14:11:51.901','{\"restaurantName\":\"Angkor Holiday\",\"address\":\"123 Main Street, City, State 12345\",\"phone\":\"+(855) 123-4567\",\"email\":\"info@restaurant.com\",\"taxRate\":8.5,\"currency\":\"USD\",\"timezone\":\"America/New_York\"}','USD',NULL,0,0,NULL,0,0,0),(39,'ORD-20251002-230819',1,1,'COMPLETED',12.99,1.10,1.95,12.15,'CASH',NULL,'2025-10-02 16:08:19.751','2025-10-02 16:08:55.096','{\"restaurantName\":\"Angkor Holiday\",\"address\":\"123 Main Street, City, State 12345\",\"phone\":\"+(855) 123-4567\",\"email\":\"info@restaurant.com\",\"taxRate\":8.5,\"currency\":\"USD\",\"timezone\":\"America/New_York\"}','USD',NULL,0,0,NULL,0,0,0),(40,'ORD-20251003-113435',1,1,'COMPLETED',6.99,0.59,0.00,7.58,'CARD',NULL,'2025-10-03 04:34:35.612','2025-10-03 04:35:48.844','{\"restaurantName\":\"Angkor Holiday\",\"address\":\"123 Main Street, City, State 12345\",\"phone\":\"+(855) 123-4567\",\"email\":\"info@restaurant.com\",\"taxRate\":8.5,\"currency\":\"USD\",\"timezone\":\"America/New_York\"}','USD',NULL,0,0,NULL,0,0,0),(41,'ORD-20251003-113443',7,1,'COMPLETED',21.98,1.87,0.00,23.85,'CARD',NULL,'2025-10-03 04:34:43.282','2025-10-03 04:35:43.900','{\"restaurantName\":\"Angkor Holiday\",\"address\":\"123 Main Street, City, State 12345\",\"phone\":\"+(855) 123-4567\",\"email\":\"info@restaurant.com\",\"taxRate\":8.5,\"currency\":\"USD\",\"timezone\":\"America/New_York\"}','USD',NULL,0,0,NULL,0,0,0),(42,'ORD-20251003-123513',8,1,'COMPLETED',6.99,0.59,0.00,7.58,'CASH',NULL,'2025-10-03 05:35:13.871','2025-10-03 05:35:21.479','{\"restaurantName\":\"Angkor Holiday\",\"address\":\"123 Main Street, City, State 12345\",\"phone\":\"+(855) 123-4567\",\"email\":\"info@restaurant.com\",\"taxRate\":8.5,\"currency\":\"USD\",\"timezone\":\"America/New_York\"}','USD',NULL,0,0,NULL,0,0,0),(43,'ORD-20251003-194543',1,1,'COMPLETED',12.99,1.10,0.00,14.09,'CARD',NULL,'2025-10-03 12:45:43.613','2025-10-03 12:45:47.279','{\"restaurantName\":\"Angkor Holiday\",\"address\":\"123 Main Street, City, State 12345\",\"phone\":\"+(855) 123-4567\",\"email\":\"info@restaurant.com\",\"taxRate\":8.5,\"currency\":\"USD\",\"timezone\":\"America/New_York\"}','USD',NULL,0,0,NULL,0,0,0),(44,'ORD-20251003-222843',1,1,'COMPLETED',8.99,0.76,0.00,9.75,'CARD',NULL,'2025-10-03 15:28:43.331','2025-10-03 15:28:47.744','{\"restaurantName\":\"Angkor Holiday\",\"address\":\"123 Main Street, City, State 12345\",\"phone\":\"+(855) 123-4567\",\"email\":\"info@restaurant.com\",\"taxRate\":8.5,\"currency\":\"USD\",\"timezone\":\"America/New_York\"}','USD',NULL,0,0,NULL,0,0,0),(45,'ORD-20251004-140900',5,1,'COMPLETED',4.49,0.38,0.00,4.87,'CARD',NULL,'2025-10-04 07:09:00.455','2025-10-04 07:09:25.240','{\"restaurantName\":\"Angkor Holiday\",\"address\":\"123 Main Street, City, State 12345\",\"phone\":\"+(855) 123-4567\",\"email\":\"info@restaurant.com\",\"taxRate\":8.5,\"currency\":\"USD\",\"timezone\":\"America/New_York\"}','USD',NULL,0,0,NULL,0,0,0),(46,'ORD-20251004-140914',15,1,'COMPLETED',40.97,3.48,0.00,44.45,'CARD',NULL,'2025-10-04 07:09:14.569','2025-10-04 07:09:18.977','{\"restaurantName\":\"Angkor Holiday\",\"address\":\"123 Main Street, City, State 12345\",\"phone\":\"+(855) 123-4567\",\"email\":\"info@restaurant.com\",\"taxRate\":8.5,\"currency\":\"USD\",\"timezone\":\"America/New_York\"}','USD',NULL,0,0,NULL,0,0,0),(47,'ORD-20251004-154541',1,1,'COMPLETED',17.99,1.80,0.00,19.79,'CASH',NULL,'2025-10-04 08:45:41.481','2025-10-04 08:45:45.286','{\"restaurantName\":\"Angkor Holiday\",\"address\":\"123 Main Street, City, State 12345\",\"phone\":\"+(855) 123-4567\",\"email\":\"info@restaurant.com\",\"taxRate\":10,\"currency\":\"USD\",\"timezone\":\"Asia/Phnom_Penh\"}','USD',NULL,0,0,NULL,0,0,0),(48,'ORD-20251004-154705',6,1,'COMPLETED',6.99,0.70,0.00,7.69,'CASH',NULL,'2025-10-04 08:47:05.118','2025-10-04 11:33:43.700','{\"restaurantName\":\"Angkor Holiday\",\"address\":\"123 Main Street, City, State 12345\",\"phone\":\"+(855) 123-4567\",\"email\":\"info@restaurant.com\",\"taxRate\":10,\"currency\":\"USD\",\"timezone\":\"Asia/Phnom_Penh\"}','USD',NULL,0,0,NULL,0,0,0),(49,'ORD-20251004-185432',1,2,'COMPLETED',8.99,0.90,0.00,9.89,'CARD',NULL,'2025-10-04 11:54:32.953','2025-10-04 11:54:36.611','{\"restaurantName\":\"Angkor Holiday\",\"address\":\"123 Main Street, City, State 12345\",\"phone\":\"+(855) 123-4567\",\"email\":\"info@restaurant.com\",\"taxRate\":10,\"currency\":\"USD\",\"timezone\":\"Asia/Phnom_Penh\"}','USD',NULL,0,0,NULL,0,0,0),(50,'ORD-20251004-191519',5,2,'COMPLETED',32.98,3.30,3.30,32.98,'CARD',NULL,'2025-10-04 12:15:19.533','2025-10-04 12:16:12.254','{\"restaurantName\":\"Angkor Holiday\",\"address\":\"123 Main Street, City, State 12345\",\"phone\":\"+(855) 123-4567\",\"email\":\"info@restaurant.com\",\"taxRate\":10,\"currency\":\"USD\",\"timezone\":\"Asia/Phnom_Penh\"}','USD',NULL,0,0,NULL,0,0,0),(51,'ORD-20251004-195846',6,1,'COMPLETED',6.99,0.70,0.70,6.99,'CARD',NULL,'2025-10-04 12:58:46.867','2025-10-04 12:59:05.134','{\"restaurantName\":\"Angkor Holiday\",\"address\":\"123 Main Street, City, State 12345\",\"phone\":\"+(855) 123-4567\",\"email\":\"info@restaurant.com\",\"taxRate\":10,\"currency\":\"USD\",\"timezone\":\"Asia/Phnom_Penh\"}','USD',NULL,0,0,NULL,0,0,0),(52,'ORD-20251005-141725',1,1,'COMPLETED',12.99,1.30,0.00,14.29,'CASH',NULL,'2025-10-05 07:17:25.115','2025-10-05 07:17:47.619','{\"restaurantName\":\"Angkor Holiday\",\"address\":\"123 Main Street, City, State 12345\",\"phone\":\"+(855) 123-4567\",\"email\":\"info@restaurant.com\",\"taxRate\":10,\"currency\":\"USD\",\"timezone\":\"Asia/Phnom_Penh\"}','USD',NULL,0,0,NULL,0,0,0),(53,'ORD-20251005-141818',1,1,'COMPLETED',17.99,1.80,1.80,17.99,'CARD',NULL,'2025-10-05 07:18:18.733','2025-10-05 07:18:33.007','{\"restaurantName\":\"Angkor Holiday\",\"address\":\"123 Main Street, City, State 12345\",\"phone\":\"+(855) 123-4567\",\"email\":\"info@restaurant.com\",\"taxRate\":10,\"currency\":\"USD\",\"timezone\":\"Asia/Phnom_Penh\"}','USD',NULL,0,0,NULL,0,0,0),(54,'ORD-20251005-143541',6,1,'COMPLETED',24.98,2.50,2.50,24.98,'CASH',NULL,'2025-10-05 07:35:41.860','2025-10-05 07:36:00.315','{\"restaurantName\":\"Angkor Holiday\",\"address\":\"123 Main Street, City, State 12345\",\"phone\":\"+(855) 123-4567\",\"email\":\"info@restaurant.com\",\"taxRate\":10,\"currency\":\"USD\",\"timezone\":\"Asia/Phnom_Penh\"}','USD',NULL,0,0,NULL,0,0,0),(55,'ORD-20251005-144218',8,1,'COMPLETED',89.40,8.94,8.94,89.40,'CASH',NULL,'2025-10-05 07:42:18.097','2025-10-05 07:43:00.159','{\"restaurantName\":\"Angkor Holiday\",\"address\":\"123 Main Street, City, State 12345\",\"phone\":\"+(855) 123-4567\",\"email\":\"info@restaurant.com\",\"taxRate\":10,\"currency\":\"USD\",\"timezone\":\"Asia/Phnom_Penh\"}','USD',NULL,0,0,NULL,0,0,0),(56,'ORD-20251007-105537',10,1,'COMPLETED',30.98,3.10,0.00,34.08,'CARD',NULL,'2025-10-07 03:55:37.809','2025-10-07 06:47:12.507','{\"restaurantName\":\"Angkor Holiday\",\"address\":\"123 Main Street, City, State 12345\",\"phone\":\"+(855) 123-4567\",\"email\":\"info@restaurant.com\",\"taxRate\":10,\"currency\":\"USD\",\"timezone\":\"Asia/Phnom_Penh\"}','USD',NULL,0,0,NULL,0,0,0),(57,'ORD-20251007-120034',4,1,'COMPLETED',15.99,1.60,0.00,17.59,'CASH',NULL,'2025-10-07 05:00:34.574','2025-10-07 06:07:52.416','{\"restaurantName\":\"Angkor Holiday\",\"address\":\"123 Main Street, City, State 12345\",\"phone\":\"+(855) 123-4567\",\"email\":\"info@restaurant.com\",\"taxRate\":10,\"currency\":\"USD\",\"timezone\":\"Asia/Phnom_Penh\"}','USD',NULL,0,0,NULL,0,0,0),(58,'ORD-20251007-124623',8,1,'COMPLETED',6.99,0.70,0.00,7.69,'CARD',NULL,'2025-10-07 05:46:23.838','2025-10-07 06:07:21.967','{\"restaurantName\":\"Angkor Holiday\",\"address\":\"123 Main Street, City, State 12345\",\"phone\":\"+(855) 123-4567\",\"email\":\"info@restaurant.com\",\"taxRate\":10,\"currency\":\"USD\",\"timezone\":\"Asia/Phnom_Penh\"}','USD',NULL,0,0,NULL,0,0,0),(59,'ORD-20251007-134720',6,1,'COMPLETED',12.99,1.30,0.00,14.29,'CARD',NULL,'2025-10-07 06:47:20.641','2025-10-07 06:47:46.358','{\"restaurantName\":\"Angkor Holiday\",\"address\":\"123 Main Street, City, State 12345\",\"phone\":\"+(855) 123-4567\",\"email\":\"info@restaurant.com\",\"taxRate\":10,\"currency\":\"USD\",\"timezone\":\"Asia/Phnom_Penh\"}','USD',NULL,0,0,NULL,0,0,0),(60,'ORD-20251007-134734',1,1,'COMPLETED',20.48,2.05,10.24,12.29,'CARD',NULL,'2025-10-07 06:47:34.809','2025-10-07 06:47:43.166','{\"restaurantName\":\"Angkor Holiday\",\"address\":\"123 Main Street, City, State 12345\",\"phone\":\"+(855) 123-4567\",\"email\":\"info@restaurant.com\",\"taxRate\":10,\"currency\":\"USD\",\"timezone\":\"Asia/Phnom_Penh\"}','USD',NULL,0,0,NULL,0,0,0),(61,'ORD-20251007-145754',6,1,'COMPLETED',14.99,1.50,0.00,16.49,'CARD',NULL,'2025-10-07 07:57:54.896','2025-10-07 08:03:15.018','{\"restaurantName\":\"Angkor Holiday\",\"address\":\"123 Main Street, City, State 12345\",\"phone\":\"+(855) 123-4567\",\"email\":\"info@restaurant.com\",\"taxRate\":10,\"currency\":\"USD\",\"timezone\":\"Asia/Phnom_Penh\"}','USD',NULL,0,0,NULL,0,0,0),(62,'ORD-20251007-151120',11,1,'COMPLETED',6.99,0.70,0.00,7.69,'CASH',NULL,'2025-10-07 08:11:20.340','2025-10-07 08:27:10.596','{\"restaurantName\":\"Angkor Holiday\",\"address\":\"123 Main Street, City, State 12345\",\"phone\":\"+(855) 123-4567\",\"email\":\"info@restaurant.com\",\"taxRate\":10,\"currency\":\"USD\",\"timezone\":\"Asia/Phnom_Penh\"}','USD',NULL,0,0,NULL,0,0,0),(63,'ORD-20251007-153606',4,1,'COMPLETED',45.94,4.59,4.59,45.94,'CARD',NULL,'2025-10-07 08:36:06.273','2025-10-07 08:37:56.979','{\"restaurantName\":\"Angkor Holiday\",\"address\":\"123 Main Street, City, State 12345\",\"phone\":\"+(855) 123-4567\",\"email\":\"info@restaurant.com\",\"taxRate\":10,\"currency\":\"USD\",\"timezone\":\"Asia/Phnom_Penh\"}','USD',NULL,0,0,NULL,0,0,0),(64,'ORD-20251007-153811',5,1,'COMPLETED',22.48,2.25,0.00,24.73,'CASH',NULL,'2025-10-07 08:38:11.883','2025-10-07 08:45:27.926','{\"restaurantName\":\"Angkor Holiday\",\"address\":\"123 Main Street, City, State 12345\",\"phone\":\"+(855) 123-4567\",\"email\":\"info@restaurant.com\",\"taxRate\":10,\"currency\":\"USD\",\"timezone\":\"Asia/Phnom_Penh\"}','USD',NULL,0,1,'[{\"method\":\"CASH\",\"amount\":\"10\",\"id\":1},{\"method\":\"CARD\",\"amount\":\"14.73\",\"id\":2}]',0,0,0),(65,'ORD-20251007-154543',6,1,'COMPLETED',33.98,3.40,0.00,37.38,'CASH',NULL,'2025-10-07 08:45:43.913','2025-10-07 08:46:08.538','{\"restaurantName\":\"Angkor Holiday\",\"address\":\"123 Main Street, City, State 12345\",\"phone\":\"+(855) 123-4567\",\"email\":\"info@restaurant.com\",\"taxRate\":10,\"currency\":\"USD\",\"timezone\":\"Asia/Phnom_Penh\"}','USD',NULL,0,1,'[{\"method\":\"CASH\",\"amount\":\"30\",\"id\":1},{\"method\":\"QR\",\"amount\":\"7.38\",\"id\":2}]',0,0,0),(66,'ORD-20251007-154829',6,1,'COMPLETED',19.98,2.00,0.00,21.98,'CASH',NULL,'2025-10-07 08:48:29.205','2025-10-07 08:53:25.297','{\"restaurantName\":\"Angkor Holiday\",\"address\":\"123 Main Street, City, State 12345\",\"phone\":\"+(855) 123-4567\",\"email\":\"info@restaurant.com\",\"taxRate\":10,\"currency\":\"USD\",\"timezone\":\"Asia/Phnom_Penh\"}','USD','[{\"amount\":\"10\",\"id\":1,\"paymentMethods\":[{\"method\":\"CASH\",\"amount\":\"5\",\"id\":1},{\"method\":\"CARD\",\"amount\":\"5\",\"id\":2}],\"mixedPayments\":true},{\"amount\":\"11.98\",\"id\":2}]',1,0,NULL,0,0,0),(67,'ORD-20251007-155524',1,1,'COMPLETED',131.93,13.19,13.19,131.93,'CASH',NULL,'2025-10-07 08:55:24.490','2025-10-07 11:06:42.068','{\"restaurantName\":\"Angkor Holiday\",\"address\":\"123 Main Street, City, State 12345\",\"phone\":\"+(855) 123-4567\",\"email\":\"info@restaurant.com\",\"taxRate\":10,\"currency\":\"USD\",\"timezone\":\"Asia/Phnom_Penh\"}','USD','[{\"id\":1,\"currency\":\"USD\",\"method\":\"CASH\",\"amount\":\"50\"},{\"id\":2,\"currency\":\"USD\",\"method\":\"QR\",\"amount\":\"81.93\"}]',1,0,NULL,0,0,0),(68,'ORD-20251008-111340',4,1,'COMPLETED',28.98,2.90,2.90,28.98,'CASH',NULL,'2025-10-08 04:13:40.583','2025-10-08 05:18:20.601','{\"restaurantName\":\"Angkor Holiday\",\"address\":\"123 Main Street, City, State 12345\",\"phone\":\"+(855) 123-4567\",\"email\":\"info@restaurant.com\",\"taxRate\":10,\"currency\":\"USD\",\"timezone\":\"Asia/Phnom_Penh\"}','USD',NULL,0,1,'[{\"id\":1,\"currency\":\"USD\",\"method\":\"CASH\",\"amount\":\"20.98\"},{\"id\":2,\"currency\":\"USD\",\"method\":\"QR\",\"amount\":\"8\"}]',0,0,0),(69,'ORD-20251008-121834',1,1,'COMPLETED',19.48,1.95,0.00,21.43,'CASH',NULL,'2025-10-08 05:18:34.151','2025-10-08 05:18:46.581','{\"restaurantName\":\"Angkor Holiday\",\"address\":\"123 Main Street, City, State 12345\",\"phone\":\"+(855) 123-4567\",\"email\":\"info@restaurant.com\",\"taxRate\":10,\"currency\":\"USD\",\"timezone\":\"Asia/Phnom_Penh\"}','USD','[{\"id\":1,\"currency\":\"USD\",\"method\":\"QR\",\"amount\":\"10.71\"},{\"id\":2,\"currency\":\"USD\",\"method\":\"CARD\",\"amount\":\"10.71\"}]',1,0,NULL,0,0,0),(70,'ORD-20251008-133947',1,1,'COMPLETED',35.97,3.60,3.60,35.97,'CASH',NULL,'2025-10-08 06:39:47.371','2025-10-08 06:40:49.698','{\"restaurantName\":\"Angkor Holiday\",\"address\":\"123 Main Street, City, State 12345\",\"phone\":\"+(855) 123-4567\",\"email\":\"info@restaurant.com\",\"taxRate\":10,\"currency\":\"USD\",\"timezone\":\"Asia/Phnom_Penh\"}','USD','[{\"id\":1,\"currency\":\"USD\",\"method\":\"CASH\",\"amount\":\"17.98\"},{\"id\":2,\"currency\":\"USD\",\"method\":\"CARD\",\"amount\":\"17.98\"}]',1,0,NULL,0,0,0),(71,'ORD-20251008-134001',6,1,'COMPLETED',80.44,8.04,0.00,88.48,'CASH',NULL,'2025-10-08 06:40:01.270','2025-10-08 06:40:39.614','{\"restaurantName\":\"Angkor Holiday\",\"address\":\"123 Main Street, City, State 12345\",\"phone\":\"+(855) 123-4567\",\"email\":\"info@restaurant.com\",\"taxRate\":10,\"currency\":\"USD\",\"timezone\":\"Asia/Phnom_Penh\"}','USD',NULL,0,0,NULL,0,0,0),(72,'ORD-20251008-134206',4,1,'COMPLETED',45.96,4.60,4.60,45.96,'CASH',NULL,'2025-10-08 06:42:06.128','2025-10-08 06:42:27.654','{\"restaurantName\":\"Angkor Holiday\",\"address\":\"123 Main Street, City, State 12345\",\"phone\":\"+(855) 123-4567\",\"email\":\"info@restaurant.com\",\"taxRate\":10,\"currency\":\"USD\",\"timezone\":\"Asia/Phnom_Penh\"}','USD',NULL,0,1,'[{\"id\":1,\"currency\":\"USD\",\"method\":\"CASH\",\"amount\":\"35.96\"},{\"id\":2,\"currency\":\"USD\",\"method\":\"QR\",\"amount\":\"10\"}]',0,0,0),(73,'ORD-20251008-134300',11,1,'COMPLETED',33.98,3.40,3.40,33.98,'CASH',NULL,'2025-10-08 06:43:00.540','2025-10-08 08:03:41.902','{\"restaurantName\":\"Angkor Holiday\",\"address\":\"123 Main Street, City, State 12345\",\"phone\":\"+(855) 123-4567\",\"email\":\"info@restaurant.com\",\"taxRate\":10,\"currency\":\"USD\",\"timezone\":\"Asia/Phnom_Penh\"}','USD','[{\"id\":1,\"currency\":\"USD\",\"method\":\"CASH\",\"amount\":\"15\"},{\"id\":2,\"currency\":\"USD\",\"method\":\"CASH\",\"amount\":\"18.98\"}]',1,0,NULL,0,0,0),(74,'ORD-20251008-150412',5,1,'COMPLETED',24.98,2.50,0.00,27.48,'CASH',NULL,'2025-10-08 08:04:12.175','2025-10-08 08:09:23.726','{\"restaurantName\":\"Angkor Holiday\",\"address\":\"123 Main Street, City, State 12345\",\"phone\":\"+(855) 123-4567\",\"email\":\"info@restaurant.com\",\"taxRate\":10,\"currency\":\"USD\",\"timezone\":\"Asia/Phnom_Penh\"}','USD','[{\"id\":1,\"currency\":\"USD\",\"method\":\"CASH\",\"amount\":\"13.74\"},{\"id\":2,\"currency\":\"USD\",\"method\":\"CASH\",\"amount\":\"13.74\"}]',1,0,NULL,0,0,0),(75,'ORD-20251008-151441',6,1,'COMPLETED',29.47,2.95,2.95,29.47,'CASH',NULL,'2025-10-08 08:14:41.486','2025-10-08 08:14:50.150','{\"restaurantName\":\"Angkor Holiday\",\"address\":\"123 Main Street, City, State 12345\",\"phone\":\"+(855) 123-4567\",\"email\":\"info@restaurant.com\",\"taxRate\":10,\"currency\":\"USD\",\"timezone\":\"Asia/Phnom_Penh\"}','USD',NULL,0,0,NULL,0,0,0),(76,'ORD-20251008-174737',10,1,'COMPLETED',67.45,6.75,0.00,74.20,'CASH',NULL,'2025-10-08 10:47:37.309','2025-10-08 10:48:45.070','{\"restaurantName\":\"Angkor Holiday\",\"address\":\"123 Main Street, City, State 12345\",\"phone\":\"+(855) 123-4567\",\"email\":\"info@restaurant.com\",\"taxRate\":10,\"currency\":\"USD\",\"timezone\":\"Asia/Phnom_Penh\"}','USD','[{\"id\":1,\"currency\":\"USD\",\"method\":\"CASH\",\"amount\":\"37.10\"},{\"id\":2,\"currency\":\"USD\",\"method\":\"CASH\",\"amount\":\"37.10\"}]',1,0,NULL,0,0,0),(77,'ORD-20251008-184410',5,1,'COMPLETED',71.44,7.14,0.00,78.58,'CASH',NULL,'2025-10-08 11:44:10.833','2025-10-08 11:46:25.356','{\"restaurantName\":\"Angkor Holiday\",\"address\":\"123 Main Street, City, State 12345\",\"phone\":\"+(855) 123-4567\",\"email\":\"info@restaurant.com\",\"taxRate\":10,\"currency\":\"USD\",\"timezone\":\"Asia/Phnom_Penh\"}','USD',NULL,0,0,NULL,0,0,0),(78,'ORD-20251009-140633',1,2,'COMPLETED',59.96,6.00,0.00,65.96,'CARD',NULL,'2025-10-09 07:06:33.350','2025-10-09 07:07:49.571','{\"restaurantName\":\"Angkor Holiday\",\"address\":\"123 Main Street, City, State 12345\",\"phone\":\"+(855) 123-4567\",\"email\":\"info@restaurant.com\",\"taxRate\":10,\"currency\":\"USD\",\"timezone\":\"Asia/Phnom_Penh\",\"vatRate\":10,\"exchangeRate\":4100}','USD',NULL,0,0,NULL,0,0,0),(79,'ORD-20251009-140809',5,1,'COMPLETED',6.99,0.70,0.00,7.69,'CASH',NULL,'2025-10-09 07:08:09.633','2025-10-09 07:11:27.006','{\"restaurantName\":\"Angkor Holiday\",\"address\":\"123 Main Street, City, State 12345\",\"phone\":\"+(855) 123-4567\",\"email\":\"info@restaurant.com\",\"taxRate\":10,\"currency\":\"USD\",\"timezone\":\"Asia/Phnom_Penh\",\"vatRate\":10,\"exchangeRate\":4100}','USD',NULL,0,0,NULL,0,1,0),(80,'ORD-20251009-141529',1,5,'COMPLETED',24.98,2.50,2.50,24.98,'QR',NULL,'2025-10-09 07:15:29.339','2025-10-09 07:15:54.484','{\"restaurantName\":\"Angkor Holiday\",\"address\":\"123 Main Street, City, State 12345\",\"phone\":\"+(855) 123-4567\",\"email\":\"info@restaurant.com\",\"taxRate\":10,\"currency\":\"USD\",\"timezone\":\"Asia/Phnom_Penh\",\"vatRate\":10,\"exchangeRate\":4100}','USD',NULL,0,0,NULL,0,0,0),(81,'ORD-20251009-141905',5,5,'COMPLETED',44.97,4.50,0.00,49.47,'QR',NULL,'2025-10-09 07:19:05.852','2025-10-09 07:19:43.029','{\"restaurantName\":\"Angkor Holiday\",\"address\":\"123 Main Street, City, State 12345\",\"phone\":\"+(855) 123-4567\",\"email\":\"info@restaurant.com\",\"taxRate\":10,\"currency\":\"USD\",\"timezone\":\"Asia/Phnom_Penh\",\"vatRate\":10,\"exchangeRate\":4100}','Riel',NULL,0,0,NULL,0,1,0),(82,'ORD-20251009-144645',6,1,'COMPLETED',8.99,0.90,0.00,9.89,'CASH',NULL,'2025-10-09 07:46:45.181','2025-10-09 07:46:50.356','{\"restaurantName\":\"Angkor Holiday\",\"address\":\"123 Main Street, City, State 12345\",\"phone\":\"+(855) 123-4567\",\"email\":\"info@restaurant.com\",\"taxRate\":10,\"currency\":\"USD\",\"timezone\":\"Asia/Phnom_Penh\",\"vatRate\":10,\"exchangeRate\":4100}','USD',NULL,0,0,NULL,0,0,0);
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
) ENGINE=InnoDB AUTO_INCREMENT=132 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `products`
--

LOCK TABLES `products` WRITE;
/*!40000 ALTER TABLE `products` DISABLE KEYS */;
INSERT INTO `products` VALUES (15,'Deep Fry Spring Roll','Crispy deep-fried spring rolls with vegetables',8.99,6,1,'http://localhost:5000/food_and_berverage/Appetizer & Salad/Deep fry sping roll.jpg','2025-08-21 15:54:07.575','2025-10-03 03:53:12.947','PROD0001',6.29,0),(16,'Fresh Shrimp Salad','Fresh shrimp salad with mixed greens',12.99,6,1,'http://localhost:5000/food_and_berverage/Appetizer & Salad/fresh shrimp salad.jpg','2025-08-21 15:54:07.579','2025-10-03 03:53:12.950','PROD0002',9.09,0),(17,'Seafood Vermicelli Salad','Vermicelli salad with fresh seafood',14.99,6,1,'http://localhost:5000/food_and_berverage/Appetizer & Salad/Seafood Vermicelli Salad.jpg','2025-08-21 15:54:07.583','2025-10-03 03:53:12.951','PROD0003',10.49,0),(18,'Green Mango Salad','Traditional green mango salad with herbs',9.99,6,1,'http://localhost:5000/food_and_berverage/Appetizer & Salad/green mango salad.jpg','2025-08-21 15:54:07.586','2025-10-03 03:53:12.953','PROD0004',6.99,0),(19,'Raw Beef Salad','Traditional raw beef salad with herbs and spices',13.99,6,1,'http://localhost:5000/food_and_berverage/Appetizer & Salad/raw beef salad.jpg','2025-08-21 15:54:07.588','2025-10-03 03:53:12.956','PROD0005',9.79,0),(20,'Fresh Spring Roll','Fresh vegetable spring rolls with dipping sauce',7.99,6,1,'http://localhost:5000/food_and_berverage/Appetizer & Salad/fresh spring roll.jpg','2025-08-21 15:54:07.590','2025-10-03 03:53:12.957','PROD0006',5.59,0),(21,'Pizza','Classic pizza with tomato sauce and cheese',16.99,7,1,'http://localhost:5000/food_and_berverage/Appetizers and Snack/Pizza.jpg','2025-08-21 15:54:07.596','2025-10-03 03:53:12.959','PROD0007',11.89,0),(22,'Burgers','Juicy beef burger with fresh vegetables',15.99,7,1,'http://localhost:5000/food_and_berverage/Appetizers and Snack/Burgers.jpg','2025-08-21 15:54:07.598','2025-10-03 03:53:12.961','PROD0008',11.19,0),(23,'Sandwiches','Fresh sandwiches with various fillings',11.99,7,1,'http://localhost:5000/food_and_berverage/Appetizers and Snack/Sandwiches.jpg','2025-08-21 15:54:07.602','2025-10-03 03:53:12.963','PROD0009',8.39,0),(24,'French Fries Platter','Crispy golden french fries',6.99,7,1,'http://localhost:5000/food_and_berverage/Appetizers and Snack/French Fries Platter.jpg','2025-08-21 15:54:07.605','2025-10-03 03:53:12.964','PROD0010',4.89,0),(25,'Tempura Prawn','Crispy tempura prawns with dipping sauce',13.99,7,1,'http://localhost:5000/food_and_berverage/Appetizers and Snack/Tempura Prawn.jpg','2025-08-21 15:54:07.606','2025-10-03 03:53:12.968','PROD0011',9.79,0),(26,'Calamari Fritters','Crispy calamari fritters with tartar sauce',12.99,7,1,'http://localhost:5000/food_and_berverage/Appetizers and Snack/Calamari Fritters.jpg','2025-08-21 15:54:07.611','2025-10-03 03:53:12.971','PROD0012',9.09,0),(27,'Fish Fingers','Crispy fish fingers with dipping sauce',10.99,7,1,'http://localhost:5000/food_and_berverage/Appetizers and Snack/Fish Fingers.webp','2025-08-21 15:54:07.616','2025-10-03 03:53:12.972','PROD0013',7.69,0),(28,'Fish and Chips','Classic fish and chips with tartar sauce',14.99,7,1,'http://localhost:5000/food_and_berverage/Appetizers and Snack/Fish and Chips.jpg','2025-08-21 15:54:07.619','2025-10-03 03:53:12.974','PROD0014',10.49,0),(29,'Steamed Rice','Steamed white rice',3.99,8,1,'http://localhost:5000/food_and_berverage/Main course/Steamed Rice.jpg','2025-08-21 15:54:07.624','2025-10-03 03:53:12.975','PROD0015',2.79,0),(30,'Work Fried Sweet & Sour','Stir-fried sweet and sour dish',18.99,8,1,'http://localhost:5000/food_and_berverage/Main course/Work fried Sweet & Sour.jpg','2025-08-21 15:54:07.626','2025-10-03 03:53:12.977','PROD0016',13.29,0),(31,'Kung Pao Chicken','Spicy kung pao chicken with peanuts',19.99,8,1,'http://localhost:5000/food_and_berverage/Main course/Kung Pao Chicken.jpg','2025-08-21 15:54:07.629','2025-10-03 03:53:12.978','PROD0017',13.99,0),(32,'Chicken or Beef Satay','Grilled satay with peanut sauce',17.99,8,1,'http://localhost:5000/food_and_berverage/Main course/Chicken or Beef Satay.webp','2025-08-21 15:54:07.631','2025-10-03 03:53:12.980','PROD0018',12.59,0),(33,'Lok Lac','Traditional Cambodian lok lac beef',21.99,8,1,'http://localhost:5000/food_and_berverage/Main course/Lok Lac.jpg','2025-08-21 15:54:07.634','2025-10-03 03:53:12.981','PROD0019',15.39,0),(34,'Work Fried Khmer Spicy Paste','Stir-fried with Khmer spicy paste',20.99,8,1,'http://localhost:5000/food_and_berverage/Main course/Work Fried Khmer Spicy paste.webp','2025-08-21 15:54:07.635','2025-10-03 03:53:12.982','PROD0020',14.69,0),(35,'Stir-fried Hot Basil','Stir-fried with hot basil and chili',18.99,8,1,'http://localhost:5000/food_and_berverage/Main course/Stir-fried Hot Basil.jpg','2025-08-21 15:54:07.638','2025-10-03 03:53:12.984','PROD0021',13.29,0),(36,'Steamed Amok Fish','Traditional steamed fish amok',22.99,8,1,'http://localhost:5000/food_and_berverage/Main course/Steamed Amok Fish.webp','2025-08-21 15:54:07.640','2025-10-03 03:53:12.985','PROD0022',16.09,0),(37,'Sweet & Soup Vegetable','Sweet and sour vegetable dish',12.99,9,1,'http://localhost:5000/food_and_berverage/Rice and Noodle/Sweet & Soup Vegetable.jpg','2025-08-21 15:54:07.646','2025-10-03 03:53:12.986','PROD0023',9.09,0),(38,'Steak & Shrimp Noodle','Noodles with steak and shrimp',20.99,9,1,'http://localhost:5000/food_and_berverage/Rice and Noodle/Steak & Shrimp Noodle.webp','2025-08-21 15:54:07.647','2025-10-03 03:53:12.988','PROD0024',14.69,0),(39,'Shrimp Chow Mein','Stir-fried noodles with shrimp',18.99,9,1,'http://localhost:5000/food_and_berverage/Rice and Noodle/Shrimp Chow Mein.jpg','2025-08-21 15:54:07.650','2025-10-03 03:53:12.989','PROD0025',13.29,0),(40,'Pad Thai','Traditional Thai pad thai',16.99,9,1,'http://localhost:5000/food_and_berverage/Rice and Noodle/Pad Thai.jpg','2025-08-21 15:54:07.652','2025-10-03 03:53:12.990','PROD0026',11.89,0),(41,'Lad Na','Stir-fried wide rice noodles',15.99,9,1,'http://localhost:5000/food_and_berverage/Rice and Noodle/Lad Na.jpg','2025-08-21 15:54:07.653','2025-10-03 03:53:12.991','PROD0027',11.19,0),(42,'Hookean Noodle','Traditional hookean noodles',17.99,9,1,'http://localhost:5000/food_and_berverage/Rice and Noodle/Hookean Noodle.jpg','2025-08-21 15:54:07.656','2025-10-03 03:53:12.993','PROD0028',12.59,0),(43,'Yellow Fried Rice','Yellow fried rice with vegetables',13.99,9,1,'http://localhost:5000/food_and_berverage/Rice and Noodle/Yellow Fried Rice.jpg','2025-08-21 15:54:07.658','2025-10-03 03:53:12.994','PROD0029',9.79,0),(44,'Fried Rice','Classic fried rice with vegetables',12.99,9,1,'http://localhost:5000/food_and_berverage/Rice and Noodle/Fried Rice.jpg','2025-08-21 15:54:07.661','2025-10-03 03:53:12.995','PROD0030',9.09,0),(45,'Cambodian Curry','Traditional Cambodian curry soup',15.99,10,1,'http://localhost:5000/food_and_berverage/Soup/Cambodian Curry.jpg','2025-08-21 15:54:07.665','2025-10-03 03:53:12.996','PROD0031',11.19,0),(46,'Green Curry','Spicy green curry soup',16.99,10,1,'http://localhost:5000/food_and_berverage/Soup/green curry.jpg','2025-08-21 15:54:07.667','2025-10-03 03:53:12.998','PROD0032',11.89,0),(47,'Khmer Hot Sour Soup','Traditional Khmer hot and sour soup',14.99,10,1,'http://localhost:5000/food_and_berverage/Soup/khmer hot sour soup.jpg','2025-08-21 15:54:07.670','2025-10-03 03:53:12.999','PROD0033',10.49,0),(48,'Meat Curry','Rich meat curry soup',17.99,10,1,'http://localhost:5000/food_and_berverage/Soup/meat curry.webp','2025-08-21 15:54:07.672','2025-10-03 03:53:13.000','PROD0034',12.59,0),(49,'Noodle Soup','Traditional noodle soup',13.99,10,1,'http://localhost:5000/food_and_berverage/Soup/noodle soup.jpg','2025-08-21 15:54:07.675','2025-10-03 03:53:13.001','PROD0035',9.79,0),(50,'Red Curry','Spicy red curry soup',16.99,10,1,'http://localhost:5000/food_and_berverage/Soup/Red Curry.jpg','2025-08-21 15:54:07.677','2025-10-03 03:53:13.003','PROD0036',11.89,0),(51,'Tom Kha Gai','Coconut milk soup with chicken',15.99,10,1,'http://localhost:5000/food_and_berverage/Soup/Tom Kha Gai.jpg','2025-08-21 15:54:07.678','2025-10-03 03:53:13.004','PROD0037',11.19,0),(52,'Tom Yam Soup','Spicy and sour tom yam soup',16.99,10,1,'http://localhost:5000/food_and_berverage/Soup/Tom Yam Soup.jpg','2025-08-21 15:54:07.680','2025-10-03 03:53:13.006','PROD0038',11.89,0),(53,'Vegetable Curry','Vegetable curry soup',14.99,10,1,'http://localhost:5000/food_and_berverage/Soup/Vegetable Curry.jpg','2025-08-21 15:54:07.683','2025-10-03 03:53:13.007','PROD0039',10.49,0),(54,'Bake French Onion Soup','Classic baked French onion soup',12.99,11,1,'http://localhost:5000/food_and_berverage/Western Soup/Bake French Onion Soup.jpg','2025-08-21 15:54:07.687','2025-10-07 03:33:46.351','PROD0040',9.09,0),(55,'Mushroom Cream Soup','Creamy mushroom soup',11.99,11,1,'http://localhost:5000/food_and_berverage/Western Soup/Mushroom Cream Soup.jpg','2025-08-21 15:54:07.689','2025-10-03 03:53:13.011','PROD0041',8.39,0),(56,'Potato Cream Soup','Creamy potato soup',10.99,11,1,'http://localhost:5000/food_and_berverage/Western Soup/Potato Cream Soup.jpg','2025-08-21 15:54:07.691','2025-10-03 03:53:13.012','PROD0042',7.69,0),(57,'Pumpkin Cream Soup','Creamy pumpkin soup',11.99,11,1,'http://localhost:5000/food_and_berverage/Western Soup/Pumpkin Cream Soup.jpg','2025-08-21 15:54:07.693','2025-10-03 03:53:13.014','PROD0043',8.39,0),(58,'Tomato Cream Soup','Creamy tomato soup',10.99,11,1,'http://localhost:5000/food_and_berverage/Western Soup/Tomato Cream Soup.jpg','2025-08-21 15:54:07.695','2025-10-03 03:53:13.016','PROD0044',7.69,0),(59,'Banana in Coconut Cream','Sweet banana in coconut cream',8.99,12,1,'http://localhost:5000/food_and_berverage/Dessert/Banana in coconut cream.jpg','2025-08-21 15:54:07.700','2025-10-03 03:53:13.017','PROD0045',6.29,0),(60,'Mixed Fruit','Fresh mixed fruit platter',9.99,12,1,'http://localhost:5000/food_and_berverage/Dessert/Mixed Fruit.jpg','2025-08-21 15:54:07.702','2025-10-03 03:53:13.018','PROD0046',6.99,0),(61,'Seasonal Tropical Fresh Fruit Platter','Seasonal tropical fruit platter',12.99,12,1,'http://localhost:5000/food_and_berverage/Dessert/Seasonal Tropical Fresh Fruit platter.webp','2025-08-21 15:54:07.705','2025-10-03 03:53:13.020','PROD0047',9.09,0),(62,'Fresh Juice','Fresh fruit juice',4.99,13,1,'http://localhost:5000/food_and_berverage/Soft Drinks/Fresh Juice.jpg','2025-08-21 15:54:07.708','2025-10-03 03:53:13.024','PROD0048',3.49,0),(63,'Water','Bottled water',2.99,13,1,'/uploads/product-1759984020473-945378227.png','2025-08-21 15:54:07.713','2025-10-09 04:27:00.500','PROD0049',2.09,1),(64,'Soda','Carbonated soft drink',3.99,13,1,'http://localhost:5000/food_and_berverage/Soft Drinks/Soda.jpg','2025-08-21 15:54:07.718','2025-10-03 03:53:13.027','PROD0050',2.79,0),(65,'Sprite','Lemon-lime soft drink',3.99,13,1,NULL,'2025-08-21 15:54:07.722','2025-10-03 06:20:41.995','PROD0051',2.79,1),(66,'Fanta','Orange flavored soft drink',3.99,13,1,NULL,'2025-08-21 15:54:07.726','2025-10-03 06:10:42.585','PROD0052',2.79,1),(67,'Coca-Cola','Classic Coca-Cola',3.99,13,1,NULL,'2025-08-21 15:54:07.731','2025-10-03 06:10:48.513','PROD0053',2.79,1),(68,'Whiskey','Premium whiskey',12.99,14,1,NULL,'2025-08-21 15:54:07.736','2025-10-03 06:10:09.677','PROD0054',9.09,1),(69,'Cocktail','House cocktail',10.99,14,1,'http://localhost:5000/food_and_berverage/Hot&Cold Drinks/Cocktail.webp','2025-08-21 15:54:07.738','2025-10-03 03:53:13.033','PROD0055',7.69,0),(70,'Wine','House wine',9.99,14,1,NULL,'2025-08-21 15:54:07.743','2025-10-03 06:10:03.333','PROD0056',6.99,1),(71,'Beer','Draft beer',6.99,14,1,'http://localhost:5000/food_and_berverage/Hot&Cold Drinks/Beer.jpg','2025-08-21 15:54:07.746','2025-10-03 03:53:13.036','PROD0057',4.89,0),(72,'Jasmine Tea','Hot jasmine tea',3.99,14,1,'http://localhost:5000/food_and_berverage/Hot&Cold Drinks/Jasmine tea.jpg','2025-08-21 15:54:07.749','2025-10-03 03:53:13.037','PROD0058',2.79,0),(73,'Black Tea','Hot black tea',3.49,14,1,'http://localhost:5000/food_and_berverage/Hot&Cold Drinks/Black tea.jpg','2025-08-21 15:54:07.753','2025-10-03 03:53:13.038','PROD0059',2.44,0),(74,'Green Tea','Hot green tea',3.49,14,1,'http://localhost:5000/food_and_berverage/Hot&Cold Drinks/Green tea.jpg','2025-08-21 15:54:07.756','2025-10-03 03:53:13.039','PROD0060',2.44,0),(75,'Latte','Coffee latte',4.99,14,1,'http://localhost:5000/food_and_berverage/Hot&Cold Drinks/Latte.jpg','2025-08-21 15:54:07.760','2025-10-03 03:53:13.040','PROD0061',3.49,0),(76,'Cappuccino','Coffee cappuccino',4.49,14,1,'http://localhost:5000/food_and_berverage/Hot&Cold Drinks/Cappuccino.jpg','2025-08-21 15:54:07.762','2025-10-03 03:53:13.041','PROD0062',3.14,0),(77,'Espresso','Single shot espresso',3.99,14,1,'http://localhost:5000/food_and_berverage/Hot&Cold Drinks/Espresso.jpg','2025-08-21 15:54:07.766','2025-10-03 03:53:13.042','PROD0063',2.79,0),(129,'a1','',50.00,14,1,NULL,'2025-10-07 11:09:03.662','2025-10-07 11:09:03.662','PROD0079',20.00,1),(130,'a3','',70.00,13,1,NULL,'2025-10-07 11:09:03.664','2025-10-07 11:09:03.664','PROD0080',50.00,0),(131,'a4','',500.00,7,1,NULL,'2025-10-07 11:09:03.665','2025-10-07 11:09:03.665','PROD0081',100.00,1);
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
INSERT INTO `settings` VALUES (2,'business','{\"restaurantName\":\"Angkor Holiday\",\"address\":\"123 Main Street, City, State 12345\",\"phone\":\"+(855) 123-4567\",\"email\":\"info@restaurant.com\",\"taxRate\":10,\"currency\":\"USD\",\"timezone\":\"Asia/Phnom_Penh\",\"vatRate\":10,\"exchangeRate\":4100}','2025-10-01 05:46:18.708','2025-10-09 06:36:11.284'),(4,'security','{\"sessionTimeout\":480,\"forceLogoutOnPasswordChange\":true,\"minPasswordLength\":8,\"requireUppercase\":true,\"requireNumbers\":true}','2025-10-04 08:18:37.011','2025-10-05 08:15:12.916'),(5,'system','{\"autoRefreshInterval\":30,\"lowStockThreshold\":10,\"maxTables\":20,\"enableNotifications\":true,\"enableAutoBackup\":true,\"backupFrequency\":\"weekly\"}','2025-10-04 08:27:44.720','2025-10-04 10:36:42.572'),(6,'payment','{\"acceptedMethods\":[\"cash\",\"card\"],\"requirePaymentConfirmation\":true,\"allowSplitPayments\":true,\"cashDrawerAutoOpen\":true,\"receiptRequired\":true,\"allowRefunds\":true,\"requireManagerApprovalForRefunds\":false,\"maxRefundAmount\":1000}','2025-10-04 08:36:52.801','2025-10-04 08:46:28.188'),(7,'ui','{\"theme\":\"dark\",\"language\":\"en\",\"dateFormat\":\"MM/DD/YYYY\",\"timeFormat\":\"12h\",\"currencyDisplay\":\"symbol\",\"showTooltips\":true,\"compactMode\":false,\"animations\":true,\"soundEffects\":false,\"confirmBeforeDelete\":true}','2025-10-04 08:36:52.801','2025-10-04 08:46:47.349'),(8,'order','{\"defaultOrderStatus\":\"pending\",\"allowPartialPayments\":false,\"requireCustomerInfo\":false,\"autoAssignTables\":false,\"orderTimeout\":30,\"maxOrderItems\":50,\"allowOrderSplitting\":true,\"requireOrderConfirmation\":false,\"autoSaveOrders\":true}','2025-10-04 08:36:52.801','2025-10-04 08:36:52.801'),(9,'receipt','{\"showTaxBreakdown\":false,\"showItemDetails\":true,\"footerMessage\":\"Thank you for dining with us!\",\"logoUrl\":null,\"receiptWidth\":80,\"autoPrint\":true,\"printOnPayment\":true,\"includeOrderNumber\":true,\"includeServerName\":true,\"includeTableNumber\":true}','2025-10-04 08:36:52.801','2025-10-04 08:45:21.660');
/*!40000 ALTER TABLE `settings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `shift_logs`
--

DROP TABLE IF EXISTS `shift_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `shift_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `userId` int(11) NOT NULL,
  `shiftId` int(11) NOT NULL,
  `type` enum('CLOCK_IN','CLOCK_OUT','BREAK_START','BREAK_END','OVERTIME_START','OVERTIME_END') NOT NULL,
  `clockIn` datetime(3) DEFAULT NULL,
  `clockOut` datetime(3) DEFAULT NULL,
  `notes` varchar(191) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  `cashDifference` decimal(10,2) DEFAULT NULL,
  `closingBalance` decimal(10,2) DEFAULT NULL,
  `expectedBalance` decimal(10,2) DEFAULT NULL,
  `openingBalance` decimal(10,2) DEFAULT NULL,
  `adminOverride` tinyint(1) NOT NULL DEFAULT 0,
  `adminOverrideBy` int(11) DEFAULT NULL,
  `adminOverrideReason` varchar(191) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `shift_logs_userId_fkey` (`userId`),
  KEY `shift_logs_shiftId_fkey` (`shiftId`),
  KEY `shift_logs_adminOverrideBy_fkey` (`adminOverrideBy`),
  CONSTRAINT `shift_logs_adminOverrideBy_fkey` FOREIGN KEY (`adminOverrideBy`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `shift_logs_shiftId_fkey` FOREIGN KEY (`shiftId`) REFERENCES `shifts` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `shift_logs_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `shift_logs`
--

LOCK TABLES `shift_logs` WRITE;
/*!40000 ALTER TABLE `shift_logs` DISABLE KEYS */;
INSERT INTO `shift_logs` VALUES (1,2,1,'CLOCK_IN','2025-10-08 05:35:36.850','2025-10-08 05:36:13.628','','2025-10-08 05:35:36.851','2025-10-08 05:36:13.629',NULL,NULL,NULL,NULL,0,NULL,NULL),(2,2,1,'CLOCK_IN','2025-10-08 05:38:37.256','2025-10-08 07:11:35.060',' [Auto-logout: Shift ended]','2025-10-08 05:38:37.258','2025-10-08 07:11:35.064',NULL,NULL,NULL,NULL,0,NULL,NULL),(3,4,1,'CLOCK_IN','2025-10-08 05:44:24.884','2025-10-08 05:45:28.674','Force logout by admin. bye','2025-10-08 05:44:24.885','2025-10-08 05:45:28.675',NULL,NULL,NULL,NULL,0,NULL,NULL),(4,4,1,'CLOCK_IN','2025-10-08 05:45:46.743','2025-10-08 07:11:35.060',' [Auto-logout: Shift ended]','2025-10-08 05:45:46.745','2025-10-08 07:11:35.069',NULL,NULL,NULL,NULL,0,NULL,NULL),(5,5,2,'CLOCK_IN','2025-10-08 10:52:11.821','2025-10-08 10:54:15.312','Force logout by admin. bye','2025-10-08 10:52:11.822','2025-10-08 10:54:15.313',NULL,NULL,NULL,NULL,0,NULL,NULL),(6,5,2,'OVERTIME_START',NULL,NULL,'Shift extended by 30 minutes. jg oy tver','2025-10-08 10:53:40.041','2025-10-08 10:53:40.041',NULL,NULL,NULL,NULL,0,NULL,NULL),(7,2,1,'CLOCK_IN','2025-10-09 06:08:33.565','2025-10-09 07:11:27.341',' [Auto-logout: Shift ended]','2025-10-09 06:08:33.566','2025-10-09 07:11:27.342',NULL,NULL,NULL,NULL,0,NULL,NULL),(8,5,2,'CLOCK_IN','2025-10-09 07:15:06.705',NULL,'','2025-10-09 07:15:06.706','2025-10-09 07:15:06.706',NULL,NULL,NULL,NULL,0,NULL,NULL);
/*!40000 ALTER TABLE `shift_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `shift_overrides`
--

DROP TABLE IF EXISTS `shift_overrides`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `shift_overrides` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `shiftId` int(11) NOT NULL,
  `userId` int(11) DEFAULT NULL,
  `adminId` int(11) NOT NULL,
  `action` varchar(191) NOT NULL,
  `reason` varchar(191) NOT NULL,
  `oldValue` varchar(191) DEFAULT NULL,
  `newValue` varchar(191) DEFAULT NULL,
  `notes` varchar(191) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `metadata` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`metadata`)),
  PRIMARY KEY (`id`),
  KEY `shift_overrides_shiftId_fkey` (`shiftId`),
  KEY `shift_overrides_userId_fkey` (`userId`),
  KEY `shift_overrides_adminId_fkey` (`adminId`),
  KEY `shift_overrides_createdAt_idx` (`createdAt`),
  CONSTRAINT `shift_overrides_adminId_fkey` FOREIGN KEY (`adminId`) REFERENCES `users` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `shift_overrides_shiftId_fkey` FOREIGN KEY (`shiftId`) REFERENCES `shifts` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `shift_overrides_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `shift_overrides`
--

LOCK TABLES `shift_overrides` WRITE;
/*!40000 ALTER TABLE `shift_overrides` DISABLE KEYS */;
/*!40000 ALTER TABLE `shift_overrides` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `shifts`
--

DROP TABLE IF EXISTS `shifts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `shifts` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(191) NOT NULL,
  `startTime` varchar(191) NOT NULL,
  `endTime` varchar(191) NOT NULL,
  `isActive` tinyint(1) NOT NULL DEFAULT 1,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  `description` varchar(191) DEFAULT NULL,
  `gracePeriod` int(11) NOT NULL DEFAULT 10,
  `daysOfWeek` varchar(191) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `shifts_name_key` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `shifts`
--

LOCK TABLES `shifts` WRITE;
/*!40000 ALTER TABLE `shifts` DISABLE KEYS */;
INSERT INTO `shifts` VALUES (1,'Morning','06:00:00','14:00:00',1,'2025-10-04 11:29:12.685','2025-10-04 11:29:12.685',NULL,10,NULL),(2,'Afternoon','14:00:00','22:00:00',1,'2025-10-04 11:29:12.688','2025-10-04 11:29:12.688',NULL,10,NULL);
/*!40000 ALTER TABLE `shifts` ENABLE KEYS */;
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
) ENGINE=InnoDB AUTO_INCREMENT=35 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `stock`
--

LOCK TABLES `stock` WRITE;
/*!40000 ALTER TABLE `stock` DISABLE KEYS */;
INSERT INTO `stock` VALUES (8,62,49,10,'2025-08-21 15:54:07.711','2025-10-01 16:33:16.400'),(9,63,50,10,'2025-08-21 15:54:07.714','2025-08-21 15:54:07.714'),(10,64,49,10,'2025-08-21 15:54:07.720','2025-10-01 16:54:26.293'),(11,65,49,10,'2025-08-21 15:54:07.724','2025-10-01 16:54:26.288'),(12,66,49,10,'2025-08-21 15:54:07.728','2025-10-01 16:33:16.397'),(13,67,45,10,'2025-08-21 15:54:07.732','2025-10-03 04:35:43.905'),(14,68,50,10,'2025-08-21 15:54:07.737','2025-08-21 15:54:07.737'),(15,69,46,10,'2025-08-21 15:54:07.741','2025-10-02 04:14:38.071'),(16,70,50,10,'2025-08-21 15:54:07.744','2025-08-21 15:54:07.744'),(17,71,47,10,'2025-08-21 15:54:07.748','2025-10-03 04:35:48.848'),(18,72,50,10,'2025-08-21 15:54:07.751','2025-08-21 15:54:07.751'),(19,73,45,10,'2025-08-21 15:54:07.755','2025-10-02 03:23:39.166'),(20,74,49,10,'2025-08-21 15:54:07.757','2025-10-01 16:33:16.404'),(21,75,50,10,'2025-08-21 15:54:07.761','2025-08-21 15:54:07.761'),(22,76,47,10,'2025-08-21 15:54:07.764','2025-10-02 04:45:57.851'),(23,77,49,10,'2025-08-21 15:54:07.768','2025-10-01 16:33:16.394'),(33,129,0,10,'2025-10-07 11:09:03.668','2025-10-07 11:09:03.668'),(34,131,0,10,'2025-10-07 11:09:03.668','2025-10-07 11:09:03.668');
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
) ENGINE=InnoDB AUTO_INCREMENT=33 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `stock_logs`
--

LOCK TABLES `stock_logs` WRITE;
/*!40000 ALTER TABLE `stock_logs` DISABLE KEYS */;
INSERT INTO `stock_logs` VALUES (1,13,1,'REMOVE',2,'Order #ORD-20250826-175841 payment','2025-08-26 10:58:58.114'),(2,19,1,'REMOVE',1,'Order #ORD-20250826-181156 payment','2025-08-26 11:13:38.785'),(3,17,1,'REMOVE',1,'Order #ORD-20251001-124533 payment','2025-10-01 05:45:38.736'),(4,22,1,'REMOVE',1,'Order #ORD-20251001-205742 payment','2025-10-01 14:09:39.319'),(5,15,1,'REMOVE',1,'Order #ORD-20251001-211306 payment','2025-10-01 14:43:16.432'),(6,13,1,'REMOVE',1,'Order #ORD-20251001-211306 payment','2025-10-01 14:43:16.437'),(7,19,1,'REMOVE',1,'Order #ORD-20251001-224726 payment','2025-10-01 16:33:16.379'),(8,22,1,'REMOVE',1,'Order #ORD-20251001-224726 payment','2025-10-01 16:33:16.386'),(9,17,1,'REMOVE',1,'Order #ORD-20251001-224726 payment','2025-10-01 16:33:16.393'),(10,23,1,'REMOVE',1,'Order #ORD-20251001-224726 payment','2025-10-01 16:33:16.395'),(11,12,1,'REMOVE',1,'Order #ORD-20251001-224726 payment','2025-10-01 16:33:16.399'),(12,8,1,'REMOVE',1,'Order #ORD-20251001-224726 payment','2025-10-01 16:33:16.403'),(13,20,1,'REMOVE',1,'Order #ORD-20251001-224726 payment','2025-10-01 16:33:16.406'),(14,15,1,'REMOVE',1,'Order #ORD-20251001-231916 payment','2025-10-01 16:54:26.286'),(15,11,1,'REMOVE',1,'Order #ORD-20251001-231916 payment','2025-10-01 16:54:26.291'),(16,10,1,'REMOVE',1,'Order #ORD-20251001-231916 payment','2025-10-01 16:54:26.295'),(17,19,1,'REMOVE',1,'Order #ORD-20251002-000435 payment','2025-10-01 17:04:42.535'),(18,19,1,'REMOVE',1,'Order #ORD-20251002-000830 payment','2025-10-01 17:08:37.018'),(19,13,1,'REMOVE',1,'Order #ORD-20251002-000959 payment','2025-10-01 17:10:04.707'),(20,19,1,'REMOVE',1,'Order #ORD-20251002-102334 payment','2025-10-02 03:23:39.171'),(21,15,1,'REMOVE',2,'Order #ORD-20251002-110054 payment','2025-10-02 04:14:38.074'),(22,22,1,'REMOVE',1,'Order #ORD-20251002-114518 payment','2025-10-02 04:45:57.853'),(23,13,1,'REMOVE',1,'Order #ORD-20251003-113443 payment','2025-10-03 04:35:43.909'),(24,17,1,'REMOVE',1,'Order #ORD-20251003-113435 payment','2025-10-03 04:35:48.852');
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
) ENGINE=InnoDB AUTO_INCREMENT=40 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tables`
--

LOCK TABLES `tables` WRITE;
/*!40000 ALTER TABLE `tables` DISABLE KEYS */;
INSERT INTO `tables` VALUES (1,1,'AVAILABLE',4,'General',NULL,0,1,'2025-08-21 15:48:13.374','2025-10-09 07:15:54.486'),(2,2,'OCCUPIED',4,'General',NULL,0,1,'2025-08-21 15:48:13.378','2025-10-05 07:49:53.214'),(3,3,'OCCUPIED',4,'General',NULL,0,1,'2025-08-21 15:48:13.379','2025-10-05 07:49:53.214'),(4,4,'AVAILABLE',4,'Center',NULL,0,1,'2025-08-21 15:48:13.384','2025-10-08 06:42:27.659'),(5,5,'AVAILABLE',8,'General',NULL,0,1,'2025-08-21 15:48:13.386','2025-10-09 07:19:43.033'),(6,6,'AVAILABLE',6,'General',NULL,0,1,'2025-08-21 15:48:13.390','2025-10-09 07:46:50.363'),(7,7,'AVAILABLE',6,'General',NULL,1,1,'2025-08-21 15:48:13.397','2025-10-03 13:46:24.572'),(8,8,'AVAILABLE',6,'General',NULL,0,1,'2025-08-21 15:48:13.401','2025-10-07 06:07:21.971'),(9,9,'AVAILABLE',8,'General',NULL,0,1,'2025-08-21 15:48:13.405','2025-08-21 15:48:13.405'),(10,10,'AVAILABLE',8,'General',NULL,0,1,'2025-08-21 15:48:13.409','2025-10-08 10:48:45.072'),(11,11,'AVAILABLE',8,'General',NULL,0,1,'2025-08-21 15:48:13.413','2025-10-08 08:03:41.905'),(12,12,'AVAILABLE',8,'General',NULL,0,1,'2025-08-21 15:48:13.417','2025-10-01 17:10:04.712'),(13,13,'AVAILABLE',8,'General',NULL,0,1,'2025-08-21 15:48:13.421','2025-08-21 15:48:13.421'),(14,14,'AVAILABLE',8,'General',NULL,0,1,'2025-08-21 15:48:13.424','2025-08-21 15:48:13.424'),(15,15,'AVAILABLE',8,'General',NULL,0,1,'2025-08-21 15:48:13.428','2025-10-04 07:09:18.983'),(16,16,'AVAILABLE',8,'General',NULL,0,1,'2025-08-21 15:48:13.431','2025-08-21 15:48:13.431'),(17,17,'AVAILABLE',8,'General',NULL,0,1,'2025-08-21 15:48:13.434','2025-08-21 15:48:13.434'),(18,18,'AVAILABLE',8,'General',NULL,0,1,'2025-08-21 15:48:13.438','2025-08-21 15:48:13.438'),(19,19,'AVAILABLE',8,'General',NULL,0,1,'2025-08-21 15:48:13.441','2025-08-21 15:48:13.441'),(20,20,'AVAILABLE',8,'General',NULL,0,1,'2025-08-21 15:48:13.446','2025-10-02 04:14:38.078'),(34,21,'AVAILABLE',4,'Center',NULL,0,1,'2025-10-02 04:39:18.241','2025-10-02 04:45:57.856'),(36,888,'AVAILABLE',4,'Test','Test table for history protection',0,0,'2025-10-02 04:43:14.849','2025-10-02 04:45:01.893'),(39,22,'AVAILABLE',8,'Center',NULL,0,1,'2025-10-05 07:49:14.524','2025-10-05 07:49:14.524');
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
) ENGINE=InnoDB AUTO_INCREMENT=140 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_permissions`
--

LOCK TABLES `user_permissions` WRITE;
/*!40000 ALTER TABLE `user_permissions` DISABLE KEYS */;
INSERT INTO `user_permissions` VALUES (73,5,'orders.create','2025-10-08 05:31:22.928'),(74,5,'orders.read','2025-10-08 05:31:22.928'),(75,5,'orders.update','2025-10-08 05:31:22.928'),(76,5,'products.view','2025-10-08 05:31:22.928'),(77,5,'categories.view','2025-10-08 05:31:22.928'),(78,5,'tables.read','2025-10-08 05:31:22.928'),(79,5,'tables.update','2025-10-08 05:31:22.928'),(80,5,'stock.read','2025-10-08 05:31:22.928'),(81,5,'stock.update','2025-10-08 05:31:22.928'),(82,5,'reports.view','2025-10-08 05:31:22.928'),(83,5,'settings.view','2025-10-08 05:31:22.928'),(112,2,'orders.create','2025-10-08 05:43:01.889'),(113,2,'orders.read','2025-10-08 05:43:01.889'),(114,2,'orders.update','2025-10-08 05:43:01.889'),(115,2,'products.view','2025-10-08 05:43:01.889'),(116,2,'categories.view','2025-10-08 05:43:01.889'),(117,2,'tables.read','2025-10-08 05:43:01.889'),(118,2,'tables.update','2025-10-08 05:43:01.889'),(119,2,'stock.read','2025-10-08 05:43:01.889'),(120,2,'stock.update','2025-10-08 05:43:01.889'),(121,2,'reports.view','2025-10-08 05:43:01.889'),(122,2,'settings.view','2025-10-08 05:43:01.889'),(123,2,'categories.read','2025-10-08 05:43:01.889'),(124,2,'products.read','2025-10-08 05:43:01.889'),(125,2,'reports.read','2025-10-08 05:43:01.889'),(126,4,'orders.create','2025-10-08 05:44:08.717'),(127,4,'orders.read','2025-10-08 05:44:08.717'),(128,4,'orders.update','2025-10-08 05:44:08.717'),(129,4,'products.view','2025-10-08 05:44:08.717'),(130,4,'categories.view','2025-10-08 05:44:08.717'),(131,4,'tables.read','2025-10-08 05:44:08.717'),(132,4,'tables.update','2025-10-08 05:44:08.717'),(133,4,'stock.read','2025-10-08 05:44:08.717'),(134,4,'stock.update','2025-10-08 05:44:08.717'),(135,4,'reports.view','2025-10-08 05:44:08.717'),(136,4,'settings.view','2025-10-08 05:44:08.717'),(137,4,'categories.read','2025-10-08 05:44:08.717'),(138,4,'products.read','2025-10-08 05:44:08.717'),(139,4,'reports.read','2025-10-08 05:44:08.717');
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
  `shiftId` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_username_key` (`username`),
  UNIQUE KEY `users_email_key` (`email`),
  KEY `users_createdBy_fkey` (`createdBy`),
  KEY `users_shiftId_fkey` (`shiftId`),
  CONSTRAINT `users_createdBy_fkey` FOREIGN KEY (`createdBy`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `users_shiftId_fkey` FOREIGN KEY (`shiftId`) REFERENCES `shifts` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'admin','$2a$12$SkrkldCtmBZ3TnNAUKaDOux1SH6YvDiJC5IyHUCcD1gA2K.0i835C','ADMIN','System Administrator','admin@restaurant.com',1,'2025-08-21 15:48:13.155','2025-10-09 06:15:13.280',NULL,'2025-10-09 06:15:13.280',19,NULL),(2,'cashier','$2a$12$Oy1RaaIg8cy/t083s/YZnO6dSpPi70nWqCUiD9MmdlxdmIt5LJSDC','CASHIER','Cashier1','cashier@restaurant.com',1,'2025-08-21 15:48:13.367','2025-10-09 06:08:14.375',NULL,'2025-10-09 06:08:14.375',12,1),(3,'admin01','$2a$12$/xzQxlrGjGM1w.uiaMqee.uQekugriuQwPFaZjSmpLcjfnEymAeH6','ADMIN','admin01','vireak@gmail.com',1,'2025-10-03 15:09:38.520','2025-10-03 15:09:38.520',NULL,NULL,0,NULL),(4,'cashier 2','$2a$12$HcFQz2pOVDS1HSxefaFbEO9t5wl.Juwv9HZwb3WtSCMcUkD4CWc0K','CASHIER','cashier 2','dsfah@gmail.com',1,'2025-10-05 05:19:22.802','2025-10-08 05:44:12.103',1,'2025-10-08 05:44:12.103',1,1),(5,'cashier3','$2a$12$YuIxLtKyv88BZoWMdsHt9.HK3DDdXiVJWJUK2/r5toKomUR8.uJle','CASHIER','cashier3','cas@gmail.com',1,'2025-10-05 08:01:45.079','2025-10-09 07:14:58.017',1,'2025-10-09 07:14:58.017',6,2);
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

-- Dump completed on 2025-10-09 14:52:25
