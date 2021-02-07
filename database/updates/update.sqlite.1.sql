-- Version 1
ALTER TABLE `users` ADD COLUMN `2fa` VARCHAR(40) DEFAULT 'false';

-- Update version
INSERT OR REPLACE INTO `settings` (mainkey, subkey, value) VALUES ('core', 'sqlite:dbver', 2);