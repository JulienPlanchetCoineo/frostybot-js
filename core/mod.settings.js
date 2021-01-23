// Module to manage program settings in the database settings table

const frostybot_module = require('./mod.base')
var context = require('express-http-context');
md5 = require('md5');

const global_keys = ['core', 'whitelist', 'signalprovider'];

module.exports = class frostybot_settings_module extends frostybot_module {

    // Constructor

    constructor() {
        super()
    }

    // Get settings(s)

    async get(mainkey = null, subkey = null, defval = null) {
        var uuid = global_keys.includes(mainkey) ? '00000000-0000-0000-0000-000000000000' : context.get('uuid');
        if (uuid == undefined) uuid = '00000000-0000-0000-0000-000000000000';
        var cachekey = md5(uuid + (mainkey != null ? mainkey : '') + (subkey != null ? subkey : ''));
        //if (result = this.cache.get(cachekey)) {
        //    return result;
        //}
        //var query = this.database.type == 'mysql' ? { uuid: uuid } : {};
        var query = { uuid: uuid };
        if (mainkey != null) query['mainkey'] = mainkey;
        if (subkey != null)  query['subkey'] = subkey;
        var result = await this.database.select('settings', query);
        
        switch (result.length) {
            case 0      :   if (defval != undefined) {
                                this.set(mainkey, subkey, defval);
                                return defval
                            } else return null;
            case 1      :   var val = result[0].value
                            val = this.utils.is_json(val) ? JSON.parse(val) : val;
                            this.cache.set(cachekey, val, 60);
                            return val;
            default     :   var obj = {};
                            result.forEach(function(setting) {
                                var subkey = setting.subkey;
                                var value = setting.value;
                                obj[subkey] = JSON.parse(value);
                            })
                            this.cache.set(cachekey, obj, 5);
                            return obj;
        }
    }


    // Set Settings(s)

    async set(mainkey, subkey, value) {
        var uuid = global_keys.includes(mainkey) ? '00000000-0000-0000-0000-000000000000' : context.get('uuid');
        if (uuid == undefined) uuid = '00000000-0000-0000-0000-000000000000';
        var cachekey = md5(uuid + (mainkey != null ? mainkey : '') + (subkey != null ? subkey : ''));
        //var query = this.database.type == 'mysql' ? { uuid: uuid } : {};
        var query = { uuid: uuid };
        if (mainkey != null) query['mainkey'] = mainkey;
        if (subkey != null)  query['subkey'] = subkey;
        if (value != null && typeof value === 'object' && value.value !== null && Object.keys(value).length == 1) {
            var val = JSON.stringify(value.value)
        } else {
            var val = JSON.stringify(value)
        }
        query['value'] = val;
        var result = await this.database.insertOrReplace('settings', query);
        if (result.changes > 0) {
            var cachekey = md5(uuid + (mainkey != null ? mainkey : '') + (subkey != null ? subkey : ''));
            this.cache.set(cachekey, value, 60);
            return true;
        }    
        return false;
    }

    
    // Delete Settings(s)

    async delete(mainkey, subkey) {
        var uuid = global_keys.includes(mainkey) ? '00000000-0000-0000-0000-000000000000' : context.get('uuid');
        if (uuid == undefined) uuid = '00000000-0000-0000-0000-000000000000';
        var cachekey = md5(uuid + (mainkey != null ? mainkey : '') + (subkey != null ? subkey : ''));
        this.cache.set(cachekey, undefined, 60);
        var query = this.database.type == 'mysql' ? { uuid: uuid } : {};
        if (mainkey != null) query['mainkey'] = mainkey;
        if (subkey != null)  query['subkey'] = subkey;
        var result = await this.database.delete('settings', query);
        if (result.changes > 0) {
            return true;
        }    
        return false;
    }


}