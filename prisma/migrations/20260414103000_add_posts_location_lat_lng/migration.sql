-- AlterTable
ALTER TABLE `posts` ADD COLUMN `location` VARCHAR(120) NULL,
    ADD COLUMN `latitude` DOUBLE NULL,
    ADD COLUMN `longitude` DOUBLE NULL;
