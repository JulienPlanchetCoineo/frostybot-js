// Config Handling Module

const frostybot_module = require('./mod.base')

const config_keys = {
    'dummy:unittest': 'string',                 // Dummy key for unit testing
    'output:messages': 'oneof:none,brief,full', // (none/brief/full) Include messages in result JSON object
    'output:debug': 'boolean',                  // (Boolean) Enable debug output
    'debug:noexecute': 'boolean',               // (Boolean) Do not process order queue and execute orders on the exchange
    'trade:require_maxsize': 'boolean',         // (Boolean) Whether or not to require the maxsize parameter when using relative pricing
};

module.exports = class frostybot_config_module extends frostybot_module {

    // Constructor

    constructor() {
        super()
    }
    

    // Get config parameter

    async get(params, defval = null) {

        // Internal 
        if (this.utils.is_string(params)) {
            var key = params;
            if (!Object.keys(config_keys).includes(key)) {
                this.output.error('config_invalid_key', [key]);
                return null;
            } else {
                return await this.settings.get('config', key, defval);
            }
        }

        // User

        var results = {};

        if (this.utils.is_object(params) && Object.keys(params).length > 0) {
            var keys = Object.keys(params);
            for (var i = 0; i < keys.length; i++) {
                var key = keys[i];
                if (!Object.keys(config_keys).includes(key)) {
                    this.output.error('config_invalid_key', [key]);
                } else {
                    var val = await this.settings.get('config', key, null);
                    if (val != null)
                        results[key] = val;
                    else 
                        this.output.warning('config_get', [key])        
                }    
            }
        }

        switch (Object.values(results).length) {
            case 0  :   return false;
            case 1  :   return Object.values(results)[0];
            default :   return results;
        }

    }


    // Set config parameter

    async set(params, val = null) {

        // Internal 
        if (this.utils.is_string(params)) {
            var key = params;
            if (!Object.keys(config_keys).includes(key)) {
                this.output.error('config_invalid_key', [key]);
                return false;;
            } else {
                return await this.settings.set('config', key, val);
            }
        }

        // User 
        var results = {};

        if (this.utils.is_object(params) && Object.keys(params).length > 0) {
            var keys = Object.keys(params);
            for (var i = 0; i < keys.length; i++) {
                var key = keys[i];
                var val = params[key];
                var validated = false;
                if (!Object.keys(config_keys).includes(key)) {
                    this.output.error('config_invalid_key', [key]);
                } else {
                    var valstr = config_keys[key];
                    if (valstr.indexOf(':') > 0) 
                        var [valtype, valopt] = valstr.split(':');
                    else
                        var valtype = valstr;
                    switch (valtype) {
                        case 'boolean'  :   if (this.utils.is_bool(val)) {
                                                validated = true;
                                                val = val == 'true' ? true : false;
                                            } else
                                                this.output.error('config_invalid_value', [key, 'true or false']);
                                            break;
                        case 'string'   :   if (this.utils.is_string(val)) 
                                                validated = true;
                                            else
                                                this.output.error('config_invalid_value', [key, 'a string']);
                                            break;
                        case 'oneof'    :   if (valopt.split(',').includes(val))
                                                validated = true;
                                            else
                                                this.output.error('config_invalid_value', [key, 'one of [' + valopt + ']']);
                                            break;
                }

                    if (validated) {
                        if (await this.settings.set('config', key, val)) {
                            this.output.success('config_set', [key, val])
                            results[key] = val;
                        } else {
                            this.output.error('config_set', [key, val])
                        }   
                    }
                }    
            }
        }

        switch (Object.values(results).length) {
            case 0  :   return false;
            case 1  :   return Object.values(results)[0];
            default :   return results;
        }    

    }

    // Delete config parameter

    async delete(key) {

        if (!Object.keys(config_keys).includes(key)) {
            this.output.error('config_invalid_key', [key]);
            return false;
        }
        
        return await this.settings.delete('config', key);
    }
    
};