--
-- Create logs table
--

CREATE TABLE IF NOT EXISTS `logs` (
  `uid` int unsigned NOT NULL AUTO_INCREMENT,
  `uuid` char(36) NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
  `timestamp` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `type` varchar(10) NOT NULL,
  `message` text NOT NULL,
  PRIMARY KEY (`uid`),
  KEY `IDX_UUID_TS` (`uuid`,`timestamp`)
) ENGINE=InnoDB AUTO_INCREMENT=9434 DEFAULT CHARSET=latin1;

--
-- Update version
--

REPLACE INTO `settings` (`mainkey`, `subkey`, `value`) VALUES ('core', 'mysql:dbver', '1');