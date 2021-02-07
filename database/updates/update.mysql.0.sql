
-- Create logs table

CREATE TABLE IF NOT EXISTS `logs` (
	`uid` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `uuid` CHAR(36) NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
	`timestamp` DATETIME NOT NULL DEFAULT current_timestamp,
	`type` VARCHAR(10) NOT NULL,
	`message` TEXT NOT NULL,
	PRIMARY KEY (`uid`),
	INDEX `IDX_UUID_TS` (`uuid`, `timestamp`)
) COLLATE='latin1_swedish_ci';

-- Update version
REPLACE INTO `settings` (mainkey, subkey, value) VALUES ('core', 'mysql:dbver', '1');