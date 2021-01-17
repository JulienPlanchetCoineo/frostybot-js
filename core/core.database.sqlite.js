// Database Abstraction Layer

const sqlite3 = require('better-sqlite3');
const frostybot_database_base_module = require('./core.database.base');

module.exports = class frostybot_database_sqlite_module extends frostybot_database_base_module {

    // Constructor

    constructor() {
        super()
        this.type = 'sqlite';
        const fs = require('fs');
        const dir = __dirname.substr(0, __dirname.lastIndexOf( '/' ) );
        const dbcfgfile = dir + '/.dbcfg';
        var dbcfgjson = fs.readFileSync(dbcfgfile, {encoding:'utf8', flag:'r'}); 
        if (dbcfgjson.length > 0) {
            var dbcfg = JSON.parse(dbcfgjson);
            var dbfile = (dbcfg.hasOwnProperty('file') ? dbcfg.file : '/usr/local/frostybot-js/database/database.db').toLowerCase();
        }
        this.db = new sqlite3(dbfile);
        this.db.pragma('journal_mode = wal');
        this.name = dbfile;
    }

    // Query data from the database

    async query(sql, values = []) {
        return await this.db.prepare(sql).all(values);
    }

    // Execute a SQL statement

    async exec(sql, values = []) {
        return await this.db.prepare(sql).run(values);
    }

    // Insert or Replace

    async insertOrReplace(table, data) {
        var sql = '';
        var colList = [];
        var valList = [];
        for (var key in data) {
            var val = data[key];
            colList.push(key);
            valList.push("?");
        }
        sql = "INSERT OR REPLACE INTO `" + table + "` (`" + colList.join("`,`") + "`) VALUES (" + valList.join(",") + ");";
        return await this.exec(sql, Object.values(data));       
    }


}