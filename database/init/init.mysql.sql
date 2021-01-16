-- Create frostybot database

USE mysql;

CREATE DATABASE IF NOT EXISTS frostybot;

CREATE USER IF NOT EXISTS 'botuser'@'localhost' IDENTIFIED BY '<CHANGE THIS PASSWORD>';
GRANT ALL PRIVILEGES ON frostybot TO 'botuser'@'localhost';
FLUSH PRIVILEGES;

-- Create settings table

USE frostybot;

CREATE TABLE IF NOT EXISTS `settings` (
	`uid` INT UNSIGNED NOT NULL AUTO_INCREMENT,
	`mainkey` VARCHAR(50) NOT NULL,
	`subkey` VARCHAR(50) NOT NULL,
	`value` TEXT NOT NULL,
	PRIMARY KEY (`uid`),
	UNIQUE INDEX `UNQ` (`mainkey`, `subkey`)
) COLLATE='latin1_swedish_ci';

-- Insert default settings into settings table

USE frostybot;

REPLACE INTO settings ( `mainkey`, `subkey`, `value` ) VALUES ( 'core', 'build', '1' );
REPLACE INTO settings ( `mainkey`, `subkey`, `value` ) VALUES ( 'core', 'language', 'en' );

-- Create default whitelist entries

USE frostybot;

REPLACE INTO settings ( `mainkey`, `subkey`, `value` ) VALUES ( 'whitelist', '52.32.178.7',   '{"ip":"52.32.178.7",   "description":"TradingView Server Address","canDelete":0}');
REPLACE INTO settings ( `mainkey`, `subkey`, `value` ) VALUES ( 'whitelist', '54.218.53.128', '{"ip":"54.218.53.128", "description":"TradingView Server Address","canDelete":0}');
REPLACE INTO settings ( `mainkey`, `subkey`, `value` ) VALUES ( 'whitelist', '34.212.75.30',  '{"ip":"34.212.75.30",  "description":"TradingView Server Address","canDelete":0}');
REPLACE INTO settings ( `mainkey`, `subkey`, `value` ) VALUES ( 'whitelist', '52.89.214.238', '{"ip":"52.89.214.238", "description":"TradingView Server Address","canDelete":0}');
REPLACE INTO settings ( `mainkey`, `subkey`, `value` ) VALUES ( 'whitelist', '127.0.0.1',     '{"ip":"127.0.0.1",     "description":"localhost","canDelete":0}');

