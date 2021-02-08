-- Create logs table

CREATE TABLE logs (
    uid       INTEGER      PRIMARY KEY AUTOINCREMENT
                           NOT NULL
                           UNIQUE,
    uuid      VARCHAR (36) NOT NULL
                           DEFAULT ('00000000-0000-0000-0000-000000000000'),
    timestamp TIMESTAMP    NOT NULL
                           DEFAULT (CURRENT_TIMESTAMP),
    type      VARCHAR (10) NOT NULL,
    message   TEXT         NOT NULL
);

CREATE INDEX IDX_UUID_TS ON logs (
    uuid,
    timestamp
);

-- Update version
INSERT OR REPLACE INTO `settings` (mainkey, subkey, value) VALUES ('core', 'sqlite:dbver', 3);