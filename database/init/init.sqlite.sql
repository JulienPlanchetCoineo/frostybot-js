-- Create settings table

CREATE TABLE IF NOT EXISTS settings (
    uid INTEGER PRIMARY KEY AUTOINCREMENT, 
    mainkey VARCHAR (50) NOT NULL, 
    subkey VARCHAR (50) NOT NULL, 
    value TEXT NOT NULL, 
    UNIQUE (mainkey COLLATE NOCASE ASC, subkey COLLATE NOCASE ASC) ON CONFLICT REPLACE
);

-- Insert default settings and whitelist entries

REPLACE INTO "settings" ("mainkey", "subkey", "value") VALUES
	('core', 'build', '1'),
	('core', 'language', '"en"'),
	('whitelist', '52.32.178.7', '{"ip":"52.32.178.7","description":"TradingView Server Address","canDelete":0}'),
	('whitelist', '54.218.53.128', '{"ip":"54.218.53.128","description":"TradingView Server Address","canDelete":0}'),
	('whitelist', '34.212.75.30', '{"ip":"34.212.75.30","description":"TradingView Server Address","canDelete":0}'),
	('whitelist', '52.89.214.238', '{"ip":"52.89.214.238","description":"TradingView Server Address","canDelete":0}'),
	('whitelist', '127.0.0.1', '{"ip":"127.0.0.1","description":"localhost","canDelete":0}'),
