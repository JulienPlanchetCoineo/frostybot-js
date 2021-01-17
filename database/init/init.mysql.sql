-- IMPORTANT: 
--  Change the username, password and database name below to whatever 
--  you would like before running the init script
--  NB: Do NOT leave the password as default

SET @username = 'frostybotuser';  -- The database username to create
SET @userpass = 'CHANGE THIS!';   -- The database users password
SET @dbname = 'frostybot';        -- The database name to create

-- Create frostybot database

USE mysql;

SET @sql:= CONCAT("CREATE DATABASE IF NOT EXISTS ", @dbname, ";");
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql:= CONCAT("CREATE USER IF NOT EXISTS '", @username, "'@'localhost' IDENTIFIED WITH mysql_native_password BY '", @userpass, "';");
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql:= CONCAT("GRANT ALL PRIVILEGES ON ", @dbname, ".* TO '", @username, "'@'localhost';");
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

FLUSH PRIVILEGES;

-- Create settings table

SET @settings_table_sql := CONCAT("
	CREATE TABLE IF NOT EXISTS ", @dbname, ".settings (
		`uid` INT UNSIGNED NOT NULL AUTO_INCREMENT,
		`mainkey` VARCHAR(50) NOT NULL,
		`subkey` VARCHAR(50) NOT NULL,
		`value` JSON NOT NULL,
		PRIMARY KEY (`uid`),
		UNIQUE INDEX `UNQ_MAINKEY_SUBKEY` (`mainkey`, `subkey`)
	) COLLATE='latin1_swedish_ci';
");

PREPARE stmt FROM @settings_table_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Insert default settings into settings table

SET @settings_defaults_sql := CONCAT("
	REPLACE INTO ", @dbname, ".settings ( `mainkey`, `subkey`, `value` ) 
	VALUES 
		( 'core', 'build', '1' ),
        ( 'core', 'language', '\"en\"' );
");

PREPARE stmt FROM @settings_defaults_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Create default whitelist entries

SET @settings_whitelist_sql := CONCAT("
	REPLACE INTO ", @dbname, ".settings ( `mainkey`, `subkey`, `value` ) 
	VALUES 
		( 'whitelist', '52.32.178.7', '{\"ip\":\"52.32.178.7\", \"description\":\"TradingView Server Address\",\"canDelete\":0}'),
		( 'whitelist', '54.218.53.128', '{\"ip\":\"54.218.53.128\", \"description\":\"TradingView Server Address\",\"canDelete\":0}'),
		( 'whitelist', '34.212.75.30', '{\"ip\":\"34.212.75.30\", \"description\":\"TradingView Server Address\",\"canDelete\":0}'),
		( 'whitelist', '52.89.214.238', '{\"ip\":\"52.89.214.238\", \"description\":\"TradingView Server Address\",\"canDelete\":0}'),
		( 'whitelist', '127.0.0.1', '{\"ip\":\"127.0.0.1\", \"description\":\"localhost\",\"canDelete\":0}');
");

PREPARE stmt FROM @settings_whitelist_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Create tenants table

SET @tenants_table_sql := CONCAT("
	CREATE TABLE IF NOT EXISTS ", @dbname, ".tenants (
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
");

PREPARE stmt FROM @tenants_table_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;