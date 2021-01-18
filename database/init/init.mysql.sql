-- Create settings table

CREATE TABLE IF NOT EXISTS `settings` (
	`uid` INT UNSIGNED NOT NULL AUTO_INCREMENT,
    `uuid` CHAR(36) NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
	`mainkey` VARCHAR(50) NOT NULL,
	`subkey` VARCHAR(50) NOT NULL,
	`value` JSON NOT NULL,
	PRIMARY KEY (`uid`),
	UNIQUE INDEX `UNQ` (`uuid`, `mainkey`, `subkey`)
) COLLATE='latin1_swedish_ci';

-- Insert default settings into settings table

REPLACE INTO `settings` ( `mainkey`, `subkey`, `value` ) 
VALUES 
	( 'core', 'build', '1' ),
	( 'core', 'language', '"en"' );

-- Create default whitelist entries

REPLACE INTO `settings` ( `mainkey`, `subkey`, `value` ) 
VALUES 
	( 'whitelist', '52.32.178.7', '{"ip":"52.32.178.7", "description":"TradingView Server Address","canDelete":0}'),
	( 'whitelist', '54.218.53.128', '{"ip":"54.218.53.128", "description":"TradingView Server Address","canDelete":0}'),
	( 'whitelist', '34.212.75.30', '{"ip":"34.212.75.30", "description":"TradingView Server Address","canDelete":0}'),
	( 'whitelist', '52.89.214.238', '{"ip":"52.89.214.238", "description":"TradingView Server Address","canDelete":0}'),
	( 'whitelist', '127.0.0.1', '{"ip":"127.0.0.1", "description":"localhost","canDelete":0}');

-- Create tenants table if required		

CREATE TABLE IF NOT EXISTS tenants (
	`uid` INT UNSIGNED NOT NULL AUTO_INCREMENT,
	`uuid` CHAR(38) NOT NULL,
	`email` VARCHAR(100) NOT NULL,
	`password` JSON NOT NULL,
	`enabled` BOOL NOT NULL DEFAULT true,
	`elevated` BOOL NOT NULL DEFAULT false,
	`last` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	PRIMARY KEY (`uid`),
	UNIQUE INDEX `UNQ_UUID` (`uuid`),
	UNIQUE INDEX `UNQ_EMAIL` (`email`),
	INDEX `IDX_UUID` (`uuid` ASC) VISIBLE,
	INDEX `IDX_EMAIL` (`email` ASC) VISIBLE
) COLLATE='latin1_swedish_ci';    

-- Create multitenant_enable procedure

DROP PROCEDURE IF EXISTS `multitenant_enable`;

DELIMITER $$
CREATE PROCEDURE `multitenant_enable` ()
BEGIN

	-- Create tenants table if required		
	CREATE TABLE IF NOT EXISTS tenants (
		`uid` INT UNSIGNED NOT NULL AUTO_INCREMENT,
		`uuid` CHAR(38) NOT NULL,
		`email` VARCHAR(100) NOT NULL,
		`password` JSON NOT NULL,
		`enabled` BOOL NOT NULL DEFAULT true,
		`elevated` BOOL NOT NULL DEFAULT false,
		`last` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
		PRIMARY KEY (`uid`),
		UNIQUE INDEX `UNQ_UUID` (`uuid`),
		UNIQUE INDEX `UNQ_EMAIL` (`email`),
		INDEX `IDX_UUID` (`uuid` ASC) VISIBLE,
		INDEX `IDX_EMAIL` (`email` ASC) VISIBLE
	) COLLATE='latin1_swedish_ci';    
	
	-- Check for existance of context column and create if required
	SELECT count(*) INTO @exist FROM information_schema.columns WHERE table_schema = (SELECT DATABASE()) AND table_name = 'settings' AND column_name = 'uuid' LIMIT 1;
	IF @exist = 0 THEN 
		ALTER TABLE `settings` ADD COLUMN `uuid` CHAR(36) NULL AFTER `uid`, DROP INDEX `UNQ`, ADD UNIQUE INDEX `UNQ` (`uuid` ASC, `mainkey` ASC, `subkey` ASC) VISIBLE;
		SET @uuid = NULL;
		SELECT REPLACE(value,'"','') INTO @uuid FROM `settings` WHERE mainkey='core' AND subkey='uuid';
        IF @uuid = NULL THEN
			SET @uuid = uuid_v4();
            INSERT INTO `settings` (uuid, mainkey, subkey, value) VALUES (NULL, 'core', 'uuid', CONCAT('"',@uuid,'"'));
        END IF;
		UPDATE `settings` SET `uuid`='00000000-0000-0000-0000-000000000000' WHERE mainkey IN ('core','whitelist');
		UPDATE `settings` SET `uuid`=@uuid WHERE mainkey NOT IN ('core','whitelist') AND uuid IN ('00000000-0000-0000-0000-000000000000',NULL);
	END IF;
	
	-- Enable multi tenant mode
	REPLACE INTO `settings` (uuid, mainkey, subkey, value) VALUES ('00000000-0000-0000-0000-000000000000','core', 'multitenant:enabled','true');
		
END$$
DELIMITER ;

-- Create multitenant_disable procedure

DROP procedure IF EXISTS `multitenant_disable`;

DELIMITER $$
USE `frostybot`$$
CREATE PROCEDURE `multitenant_disable` ()
BEGIN
	SELECT REPLACE(value,'"','') INTO @uuid FROM `settings` WHERE mainkey='core' AND subkey='uuid';
    IF @uuid IS NOT NULL THEN
		UPDATE `settings` SET `uuid`=@uuid WHERE mainkey NOT IN ('core','whitelist') AND uuid IN (@uuid);
	END IF;
	REPLACE INTO `settings` (uuid, mainkey, subkey, value) VALUES ('00000000-0000-0000-0000-000000000000','core', 'multitenant:enabled','false');
END$$

DELIMITER ;