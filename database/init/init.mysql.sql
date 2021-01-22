
-- Create uuid_v4 function

DROP function IF EXISTS `uuid_v4`;

DELIMITER $$
CREATE FUNCTION uuid_v4()
    RETURNS CHAR(36) DETERMINISTIC
BEGIN
    -- 1th and 2nd block are made of 6 random bytes
    SET @h1 = HEX(RANDOM_BYTES(4));
    SET @h2 = HEX(RANDOM_BYTES(2));

    -- 3th block will start with a 4 indicating the version, remaining is random
    SET @h3 = SUBSTR(HEX(RANDOM_BYTES(2)), 2, 3);

    -- 4th block first nibble can only be 8, 9 A or B, remaining is random
    SET @h4 = CONCAT(HEX(FLOOR(ASCII(RANDOM_BYTES(1)) / 64)+8),
                SUBSTR(HEX(RANDOM_BYTES(2)), 2, 3));

    -- 5th block is made of 6 random bytes
    SET @h5 = HEX(RANDOM_BYTES(6));

    -- Build the complete UUID
    RETURN LOWER(CONCAT(
        @h1, '-', @h2, '-4', @h3, '-', @h4, '-', @h5
    ));
END$$

DELIMITER ;

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
	( 'whitelist', '::1', '{"ip":"::1", "description":"localhost","canDelete":0}'),
	( 'whitelist', '127.0.0.1', '{"ip":"127.0.0.1", "description":"localhost","canDelete":0}');

-- Create users table if required		

CREATE TABLE IF NOT EXISTS `users` (
	`uid` INT UNSIGNED NOT NULL AUTO_INCREMENT,
	`uuid` VARCHAR(36) NOT NULL,
	`email` VARCHAR(100) NOT NULL,
	`password` TEXT NOT NULL,
	`enabled` BOOL NOT NULL DEFAULT true,
	`last` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `token` VARCHAR(36) NULL DEFAULT NULL,
    `expiry` DATETIME NULL DEFAULT NULL,
	PRIMARY KEY (`uid`),
	UNIQUE INDEX `UNQ_UUID` (`uuid`),
	UNIQUE INDEX `UNQ_EMAIL` (`email`),
	INDEX `IDX_UUID` (`uuid` ASC) VISIBLE,
	INDEX `IDX_EMAIL` (`email` ASC) VISIBLE
) COLLATE='latin1_swedish_ci';    

DROP TRIGGER IF EXISTS `users_before_insert`;
DROP TRIGGER IF EXISTS `users_before_update`;

DELIMITER $$
CREATE TRIGGER `users_before_insert` BEFORE INSERT ON `users`
FOR EACH ROW
  IF new.uuid IS NULL
  THEN
    SET new.uuid = uuid_v4();
  END IF$$
DELIMITER ;

DELIMITER $$
CREATE TRIGGER `users_before_update` BEFORE UPDATE ON `users`
FOR EACH ROW
  SET new.last = CURRENT_TIMESTAMP;
$$
DELIMITER ;

