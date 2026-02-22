/*
  Warnings:

  - You are about to drop the column `next_due` on the `maintenance_logs` table. All the data in the column will be lost.
  - Added the required column `company_id` to the `maintenance_logs` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX `maintenance_logs_next_due_idx` ON `maintenance_logs`;

-- AlterTable
ALTER TABLE `customers` ADD COLUMN `deleted_at` DATETIME(3) NULL;

-- AlterTable
ALTER TABLE `drivers` ADD COLUMN `deleted_at` DATETIME(3) NULL;

-- AlterTable
ALTER TABLE `maintenance_logs` DROP COLUMN `next_due`,
    ADD COLUMN `company_id` VARCHAR(191) NOT NULL,
    ADD COLUMN `next_maintenance_date` DATETIME(3) NULL,
    ADD COLUMN `next_maintenance_odometer` INTEGER NULL,
    ADD COLUMN `performed_by` VARCHAR(191) NULL;

-- CreateIndex
CREATE INDEX `maintenance_logs_company_id_idx` ON `maintenance_logs`(`company_id`);

-- CreateIndex
CREATE INDEX `maintenance_logs_next_maintenance_date_idx` ON `maintenance_logs`(`next_maintenance_date`);
