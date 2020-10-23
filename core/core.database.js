const sqlite3 = require('better-sqlite3');

var db = new sqlite3(__dirname.replace('core','database') + '/database.db');

module.exports = { 

    // Query data from the database
    query: function(sql) {
        return db.prepare(sql).all();
    },

    // Execute a SQL statement
    exec: function(sql) {
        return db.prepare(sql).run();
    },

    // Select data from the database
    select: function(table, where = []) {
        var sql = '';
        var whereList = [];
        for (var key in where) {
            var val = where[key];
            whereList.push("`" + key + "`='" + val + "'");
        }
        var sql = "SELECT * FROM `" + table + "`" + (whereList.length > 0 ? " WHERE " + whereList.join(" AND ") : "") + ";";
        return this.query(sql);
    },

    // Insert into table
    insert: function(table, data) {
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
    },

    // Select data from the database
    update: function(table, data, where = []) {
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
    },

    // Delete data from the database
    delete: function(table, where = []) {
        var sql = '';
        var whereList = [];
        for (var key in where) {
            var val = where[key];
            whereList.push("`" + key + "`='" + val + "'");
        }
        var sql = "DELETE FROM `" + table + "`" + (whereList.length > 0 ? " WHERE " + whereList.join(" AND ") : "") + ";";
        return this.exec(sql);
    },

    // Insert or update
    insertOrUpdate: function(table, data, where = []) {
        var data  = this.select(table, where);
        if (data.count > 0) {
            return this.update(table, data, where);
        } else {
            return this.insert(table, data);
        }
    },    

    // Insert or Replace
    insertOrReplace: function(table, data) {
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
    },

}