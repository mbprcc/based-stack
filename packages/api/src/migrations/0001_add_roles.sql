-- Create roles table
CREATE TABLE `role` (
    `id` text PRIMARY KEY NOT NULL,
    `name` text NOT NULL UNIQUE,
    `description` text,
    `createdAt` text NOT NULL,
    `updatedAt` text NOT NULL
);

-- Create user roles junction table
CREATE TABLE `userRole` (
    `id` text PRIMARY KEY NOT NULL,
    `userId` text NOT NULL,
    `roleId` text NOT NULL,
    `createdAt` text NOT NULL,
    FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
    FOREIGN KEY (`roleId`) REFERENCES `role`(`id`) ON UPDATE no action ON DELETE cascade
);

-- Create unique index to prevent duplicate role assignments
CREATE UNIQUE INDEX `userRole_userId_roleId_unique` ON `userRole` (`userId`, `roleId`);

-- Insert default roles
INSERT INTO `role` (`id`, `name`, `description`, `createdAt`, `updatedAt`) VALUES
    ('role_admin', 'admin', 'Administrator with full access', datetime('now'), datetime('now')),
    ('role_user', 'user', 'Regular user with limited access', datetime('now'), datetime('now')),
    ('role_moderator', 'moderator', 'Moderator with content management access', datetime('now'), datetime('now'));
