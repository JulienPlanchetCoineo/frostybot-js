// Module to manage program settings in the database settings table

const frostybot_module = require('./mod.base')

module.exports = class frostybot_settings_module extends frostybot_module {

    // Constructor

    constructor() {
        super()
    }

    // Get settings(s)

    async get(mainkey = null, subkey = null, defval = null) {
        //this.link('database')
        if (mainkey == null) {
            result = await this.database.select('settings' )
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
                result = await this.database.select('settings', { mainkey: mainkey } )
                var obj = {}
                result.forEach(function(setting) {
                    var subkey = setting.subkey;
                    var value = setting.value
                    obj[subkey] = JSON.parse(value);
                });
                return obj    
            } else {
                var result = await this.database.select('settings', { mainkey: mainkey, subkey: subkey } )
                if (result.length == 0) {
                    if (defval != undefined) {
                        this.set(mainkey, subkey, defval);
                        return defval
                    } else {
                        return null;
                    }
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
    }


    // Set Settings(s)

    async set(mainkey, subkey, value) {
        if (value != null && typeof value === 'object' && value.value !== null && Object.keys(value).length == 1) {
            value = JSON.stringify(value.value)
        } else {
            value = JSON.stringify(value)
        }
        var result = await this.database.insertOrReplace('settings',  { mainkey: mainkey, subkey: subkey, value: value });
        if (result.changes > 0) {
            return true;
        }    
        return false;
    }

    
    // Delete Settings(s)

    async delete(mainkey, subkey) {
        if (subkey == null) {
            var result = await this.database.delete('settings', { mainkey: mainkey });
        } else {
            var result = await this.database.delete('settings', { mainkey: mainkey, subkey: subkey });
        }
        if (result.changes > 0) {
            return true;
        }    
        return false;
    }


}