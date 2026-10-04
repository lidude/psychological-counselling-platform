-- CreateTable
CREATE TABLE `session_plans` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `counselor_profile_id` INTEGER NOT NULL,
    `duration` INTEGER NOT NULL,
    `price` DECIMAL(10, 2) NOT NULL,
    `quantity` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `session_plans` ADD CONSTRAINT `session_plans_counselor_profile_id_fkey` FOREIGN KEY (`counselor_profile_id`) REFERENCES `counselor_profiles`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
