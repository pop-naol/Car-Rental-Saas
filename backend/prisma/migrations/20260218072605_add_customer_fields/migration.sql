/*
  Warnings:

  - Added the required column `address` to the `customers` table without a default value. This is not possible if the table is not empty.
  - Added the required column `date_of_birth` to the `customers` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `customers` ADD COLUMN `address` VARCHAR(191) NOT NULL,
    ADD COLUMN `date_of_birth` DATETIME(3) NOT NULL,
    ADD COLUMN `id_number` VARCHAR(191) NULL;
