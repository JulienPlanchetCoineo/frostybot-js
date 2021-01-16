// Database Abstraction Layer

const mysql = require(`mysql-await`);
const frostybot_database_base_module = require('./core.database.base');

module.exports = class frostybot_database_mysql_module extends frostybot_database_base_module {

    // Constructor

    constructor() {
        super()
        const fs = require('fs');
        const dir = __dirname.substr(0, __dirname.lastIndexOf( '/' ) );
        const dbcfgfile = dir + '/.dbcfg';
        var dbcfgjson = fs.readFileSync(dbcfgfile, {encoding:'utf8', flag:'r'}); 
        if (dbcfgjson.length > 0) {
            var dbcfg = JSON.parse(dbcfgjson);
            var concfg = {
                "connectionLimit" : 10,
                "host"            : dbcfg.host,
                "port"            : (dbcfg.port > 0 ? dbcfg.port : 3306),
                "user"            : dbcfg.user,
                "password"        : dbcfg.pass,
                "database"        : dbcfg.name
            }
            this.db = mysql.createConnection( concfg );
        }
    }

    // Parse result

    parse(result) {
        for (const i in result) {
            var keys = Object.keys(result[i]) 
            var row = {};
            keys.forEach(key => {
                row[key] = result[i][key];
            });
            result[i] = row;
        }
        return result;
    }

    // Query data from the database

    async query(sql, values = []) {
        var result = await this.db.awaitQuery(sql, values);
        if (result == undefined) return null;
        return this.parse(result);
    }

    // Execute a SQL statement

    async exec(sql, values = []) {
        var result = await this.db.awaitQuery(sql, values);
        var rows = result.hasOwnProperty('affectedRows') ? result.affectedRows : 0;
        return { changes: rows };
    }
    
    // Insert or Replace

    async insertOrReplace(table, data) {
        var sql = '';
        var colList = [];
        var valList = [];
        var updList = [];
        for (var key in data) {
            colList.push(key);
            valList.push("?");
            updList.push("`" + key + "`= ?");
        }
//        sql = "INSERT INTO `" + table + "` (`" + colList.join("`,`") + "`) VALUES (" + valList.join(",") + ") ON DUPLICATE KEY UPDATE " + updList.join(",") + ";";
        sql = "REPLACE INTO `" + table + "` (`" + colList.join("`,`") + "`) VALUES (" + valList.join(",") + ");";
        var vals = [];
        for (var key in data) {
            vals.push(data[key]);
        }
        var dupVals = vals.concat(vals);
        return await this.exec(sql, dupVals);       
    }


}