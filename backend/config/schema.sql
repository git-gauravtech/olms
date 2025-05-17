
-- Database: lab_management_db
-- Make sure to create the database first if it doesn't exist:
CREATE DATABASE IF NOT EXISTS lab_management_db;
USE lab_management_db;

-- Table structure for table `users`
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `fullName` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL UNIQUE,
  `passwordHash` VARCHAR(255) NOT NULL,
  `role` VARCHAR(50) NOT NULL COMMENT 'Admin, Faculty, Student, Assistant',
  `department` VARCHAR(255) NULL,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table structure for table `labs`
CREATE TABLE IF NOT EXISTS `labs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `capacity` INT NOT NULL,
  `roomNumber` VARCHAR(50) NOT NULL,
  `location` VARCHAR(255) NULL,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table structure for table `equipment`
CREATE TABLE IF NOT EXISTS `equipment` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `type` VARCHAR(100) NOT NULL,
  `status` VARCHAR(50) NOT NULL DEFAULT 'available' COMMENT 'e.g., available, in-use, maintenance, broken',
  `labId` INT NULL, -- Foreign key to labs table, can be NULL if equipment is not assigned to a specific lab
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`labId`) REFERENCES `labs`(`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table structure for table `bookings`
CREATE TABLE IF NOT EXISTS `bookings` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `labId` INT NOT NULL,
  `userId` INT NOT NULL,
  `date` DATE NOT NULL,
  `timeSlotId` VARCHAR(50) NOT NULL COMMENT 'e.g., ts_0900_1000',
  `purpose` TEXT NULL,
  `equipmentIds` JSON NULL COMMENT 'Store as JSON array of equipment IDs',
  `status` VARCHAR(50) NOT NULL DEFAULT 'pending' COMMENT 'e.g., pending, pending-admin-approval, booked, rejected, cancelled',
  `requestedByRole` VARCHAR(50) NULL,
  `batchIdentifier` VARCHAR(255) NULL,
  `submittedDate` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`labId`) REFERENCES `labs`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table structure for table `lab_seat_statuses`
CREATE TABLE IF NOT EXISTS `lab_seat_statuses` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `labId` INT NOT NULL,
  `seatIndex` VARCHAR(50) NOT NULL COMMENT 'Unique identifier for the seat within the lab, e.g., "0", "1"',
  `status` VARCHAR(20) NOT NULL DEFAULT 'working' COMMENT 'working, not-working',
  `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `unique_lab_seat` (`labId`, `seatIndex`),
  FOREIGN KEY (`labId`) REFERENCES `labs`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Optional: Add some initial data for roles if needed, or default labs/time slots
-- For example, to insert a default admin user (change credentials before production):
-- INSERT INTO `users` (`fullName`, `email`, `passwordHash`, `role`, `department`)
-- VALUES ('Admin User', 'admin@example.com', '$2a$10$somebcryptgeneratedhash', 'Admin', 'Administration')
-- ON DUPLICATE KEY UPDATE fullName = fullName; -- Do nothing if email already exists

-- Example labs:
-- INSERT INTO `labs` (`name`, `capacity`, `roomNumber`, `location`) VALUES
-- ('Physics Lab Alpha', 20, 'P-101', 'Block A, Floor 1'),
-- ('Computer Lab Gamma', 70, 'CS-302', 'Block C, Floor 3')
-- ON DUPLICATE KEY UPDATE name=name;

-- Note: `timeSlotId` in `bookings` refers to string IDs defined in your frontend constants (e.g., `ts_0900_1000`).
-- If time slots were to be managed by admins, you'd need a `time_slots` table.
