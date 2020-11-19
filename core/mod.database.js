// Database Abstraction Layer

const sqlite3 = require('better-sqlite3');
const db = new sqlite3(__dirname.replace('core','database') + '/database.db');
const frostybot_module = require('./mod.base')

module.exports = class frostybot_database_module extends frostybot_module {

    // Constructor

    constructor() {
        super()
    }

    // Query data from the database

    query(sql) {
        return db.prepare(sql).all();
    }

    // Execute a SQL statement

    exec(sql) {
        return db.prepare(sql).run();
    }


    // Select data from the database

    select(table, where = []) {
        var sql = '';
        var whereList = [];
        for (var key in where) {
            var val = where[key];
            whereList.push("`" + key + "`='" + val + "'");
        }
        var sql = "SELECT * FROM `" + table + "`" + (whereList.length > 0 ? " WHERE " + whereList.join(" AND ") : "") + ";";
        return this.query(sql);
    }


    // Insert into table

    insert(table, data) {
        var sql = '';
        var colList = [];
        var valList = [];
        for (var key in data) {
            var val = data[key];
            colList.push(key);
            valList.push(val);
        }
        sql = "INSERT INTO `" + table + "` (`" + colList.join("`,`") + "`) VALUES ('" + valList.join("','") + "');";
        return this.exec(sql);
    }


    // Select data from the database

    update(table, data, where = []) {
        var sql = '';
        var dataList = [];
        for (var key in data) {
            var val = data[key];
            dataList.push("`" + key + "`='" + val + "'");
        }
        var whereList = [];
        for (var key in where) {
            var val = where[key];
            whereList.push("`" + key + "`='" + val + "'");
        }
        var sql = "UPDATE `" + table + "` SET " + dataList.join(",") + " " + (whereList.length > 0 ? " WHERE " + whereList.join(" AND ") : "") + ";";
        return this.exec(sql);
    }


    // Delete data from the database

    delete(table, where = []) {
        var sql = '';
        var whereList = [];
        for (var key in where) {
            var val = where[key];
            whereList.push("`" + key + "`='" + val + "'");
        }
        var sql = "DELETE FROM `" + table + "`" + (whereList.length > 0 ? " WHERE " + whereList.join(" AND ") : "") + ";";
        return this.exec(sql);
    }


    // Insert or update

    insertOrUpdate(table, data, where = []) {
        var data  = this.select(table, where);
        if (data.count > 0) {
            return this.update(table, data, where);
        } else {
            return this.insert(table, data);
        }
    }

    
    // Insert or Replace

    insertOrReplace(table, data) {
        var sql = '';
        var colList = [];
        var valList = [];
        for (var key in data) {
            var val = data[key];
            colList.push(key);
            valList.push(val);
        }
        sql = "INSERT OR REPLACE INTO `" + table + "` (`" + colList.join("`,`") + "`) VALUES ('" + valList.join("','") + "');";
        return this.exec(sql);       
    }


}