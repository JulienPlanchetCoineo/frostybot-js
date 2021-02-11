--
-- Function `uuid_v4`
--

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


--
-- Table structure for table `logs`
--

CREATE TABLE IF NOT EXISTS `logs` (
  `uid` int unsigned NOT NULL AUTO_INCREMENT,
  `uuid` char(36) NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
  `timestamp` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `type` varchar(10) NOT NULL,
  `message` text NOT NULL,
  PRIMARY KEY (`uid`),
  KEY `IDX_UUID_TS` (`uuid`,`timestamp`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=latin1;


--
-- Table structure for table `settings`
--

CREATE TABLE IF NOT EXISTS `settings` (
  `uid` int unsigned NOT NULL AUTO_INCREMENT,
  `uuid` char(36) NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
  `mainkey` varchar(50) NOT NULL,
  `subkey` varchar(50) NOT NULL,
  `value` json NOT NULL,
  PRIMARY KEY (`uid`),
  UNIQUE KEY `UNQ` (`uuid`,`mainkey`,`subkey`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=latin1;

--
-- Data for table `settings`
--

REPLACE INTO `settings` (`uuid`, `mainkey`, `subkey`, `value`) VALUES ('00000000-0000-0000-0000-000000000000','core','build','1');
REPLACE INTO `settings` (`uuid`, `mainkey`, `subkey`, `value`) VALUES ('00000000-0000-0000-0000-000000000000','core','language','\"en\"');
REPLACE INTO `settings` (`uuid`, `mainkey`, `subkey`, `value`) VALUES ('00000000-0000-0000-0000-000000000000','whitelist','52.32.178.7','{\"canDelete\": 0, \"ip\": \"52.32.178.7\", \"description\": \"TradingView Server Address\"}');
REPLACE INTO `settings` (`uuid`, `mainkey`, `subkey`, `value`) VALUES ('00000000-0000-0000-0000-000000000000','whitelist','54.218.53.128','{\"canDelete\": 0, \"ip\": \"54.218.53.128\", \"description\": \"TradingView Server Address\"}');
REPLACE INTO `settings` (`uuid`, `mainkey`, `subkey`, `value`) VALUES ('00000000-0000-0000-0000-000000000000','whitelist','34.212.75.30','{\"canDelete\": 0, \"ip\": \"34.212.75.30\", \"description\": \"TradingView Server Address\"}');
REPLACE INTO `settings` (`uuid`, `mainkey`, `subkey`, `value`) VALUES ('00000000-0000-0000-0000-000000000000','whitelist','52.89.214.238','{\"canDelete\": 0, \"ip\": \"52.89.214.238\", \"description\": \"TradingView Server Address\"}');
REPLACE INTO `settings` (`uuid`, `mainkey`, `subkey`, `value`) VALUES ('00000000-0000-0000-0000-000000000000','whitelist','127.0.0.1','{\"canDelete\": 0, \"ip\": \"127.0.0.1\", \"description\": \"localhost\"}');
REPLACE INTO `settings` (`uuid`, `mainkey`, `subkey`, `value`) VALUES ('00000000-0000-0000-0000-000000000000','whitelist','::1','{\"canDelete\": 0, \"ip\": \"::1\", \"description\": \"localhost\"}');

--
-- Table structure for table `users`
--

CREATE TABLE IF NOT EXISTS `users` (
  `uid` int unsigned NOT NULL AUTO_INCREMENT,
  `uuid` varchar(36) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` text NOT NULL,
  `enabled` tinyint NOT NULL DEFAULT '1',
  `last` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `token` varchar(36) DEFAULT NULL,
  `expiry` datetime DEFAULT NULL,
  `2fa` varchar(40) DEFAULT 'false',
  PRIMARY KEY (`uid`),
  UNIQUE KEY `UNQ_UUID` (`uuid`),
  UNIQUE KEY `UNQ_EMAIL` (`email`),
  KEY `IDX_UUID` (`uuid`),
  KEY `IDX_EMAIL` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=latin1;


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




--
-- Update version
--

REPLACE INTO `settings` (`mainkey`, `subkey`, `value`) VALUES ('core', 'mysql:dbver', '1');