// Module to manage program settings in the database settings table

const db = require('./core.database');

module.exports = {  


    // Initialize Module

    initialize() {
        if (this.initialized !== true) {
            this.modules();
        }
        this.initialized = true;
    },


    // Create module shortcuts

    modules() {
        for (const [method, module] of Object.entries(global.frostybot.modules)) {
            if (method != 'settings') this[method] = module;
        }
    },


    // Get settings(s)

    get: function(mainkey = null, subkey = null, defval = null) {
        this.initialize();
        if (mainkey == null) {
            result = db.select('settings' )
            var obj = {}
            result.forEach(function(setting) {
                var mainkey = setting.mainkey
                var subkey = setting.subkey
                if (!obj.hasOwnProperty(mainkey)) {
                    obj[mainkey] = {}
                }
                obj[mainkey][subkey] = JSON.parse(setting.value)
            });
            return obj    
        } else {
            if (subkey == null) {
                result = db.select('settings', { mainkey: mainkey } )
                var obj = {}
                result.forEach(function(setting) {
                    var subkey = setting.subkey;
                    var value = setting.value
                    obj[subkey] = JSON.parse(value);
                });
                return obj    
            } else {
                var result = db.select('settings', { mainkey: mainkey, subkey: subkey } )
                if (result.length == 0) {
                    this.set(mainkey, subkey, defval);
                    return defval
                }
                if (result.length == 1) {
                    var value = result[0].value
                    return this.utils.is_json(value) ? JSON.parse(value) : value;
                } 
                if (result.length > 1) {
                    var arr = []
                    result.forEach(function(setting) {
                        var value = setting.value
                        arr.push(JSON.parse(value))
                    })
                    return arr
                } 
            }
        }
    },


    // Set Settings(s)

    set: function(mainkey, subkey, value) {
        this.initialize();

        if (value != null && typeof value === 'object' && value.value !== null && Object.keys(value).length == 1) {
            value = JSON.stringify(value.value)
        } else {
            value = JSON.stringify(value)
        }
        if (db.insert('settings',  { mainkey: mainkey, subkey: subkey, value: value }).changes == 1) {
            return true;
        }    
        return false;
    },

    
    // Delete Settings(s)

    delete: function(mainkey, subkey) {
        this.initialize();
        if (subkey == null) {
            if (db.delete('settings', { mainkey: mainkey }).changes > 0) {
                return true;
            }
        } else {
            if (db.delete('settings', { mainkey: mainkey, subkey: subkey }).changes > 0) {
                return true;
            }
        }
        return false;
    },

}