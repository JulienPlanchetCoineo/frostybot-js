// Database Abstraction Layer

const frostybot_module = require(__dirname.substr(0, __dirname.lastIndexOf( '/' ) ) + '/core/mod.base')

module.exports = class frostybot_database_base_module extends frostybot_module {

    // Constructor

    constructor() {
        super()
    }

    // Select data from the database

    async select(table, where = {}) {
        var sql = '';
        var whereList = [];
        for (var key in where) {
            whereList.push("`" + key + "` = ?");
        }
        var sql = "SELECT * FROM `" + table + "`" + (whereList.length > 0 ? " WHERE " + whereList.join(" AND ") : "") + ";";
        return await this.query(sql, Object.values(where));
    }


    // Insert into table

    async insert(table, data) {
        var sql = '';
        var colList = [];
        var valList = [];
        for (var key in data) {
            colList.push(key);
            valList.push('?');
        }
        sql = "INSERT INTO `" + table + "` (`" + colList.join("`,`") + "`) VALUES (" + valList.join(",") + ");";
        return await this.exec(sql, Object.values(data));
    }


    // Select data from the database

    async update(table, data, where = []) {
        var sql = '';
        var dataList = [];
        var values = [];
        for (var key in data) {
            var val = data[key];
            dataList.push("`" + key + "`= ?");
            values.push(val);
        }
        var whereList = [];
        for (var key in where) {
            var val = where[key];
            whereList.push("`" + key + "` = ?");
            values.push(val);
        }
        var sql = "UPDATE `" + table + "` SET " + dataList.join(",") + " " + (whereList.length > 0 ? " WHERE " + whereList.join(" AND ") : "") + ";";
        return await this.exec(sql, values);
    }


    // Delete data from the database

    async delete(table, where = []) {
        var sql = '';
        var whereList = [];
        for (var key in where) {
            var val = where[key];
            whereList.push("`" + key + "`= ?");
        }
        var sql = "DELETE FROM `" + table + "`" + (whereList.length > 0 ? " WHERE " + whereList.join(" AND ") : "") + ";";
        return await this.exec(sql, Object.values(where));
    }


}