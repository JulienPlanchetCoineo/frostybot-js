// Config Handling Module

const frostybot_module = require('./mod.base')

const config_keys = {
    'dummy:unittest': 'string',                   // Dummy key for unit testing
    'output:messages': 'oneof:none,brief,full',   // (none/brief/full) Include messages in result JSON object
    'output:debug': 'boolean',                    // (Boolean) Enable debug output
    'output:stats': 'boolean',                    // (Boolean) Enable debug output
    'debug:noexecute': 'boolean',                 // (Boolean) Do not process order queue and execute orders on the exchange
    'trade:require_maxsize': 'boolean',           // (Boolean) Whether or not to require the maxsize parameter when using relative pricing
    '{stub}:provider': 'string',                  // (UUID) Signal provider configured for stub
    '{stub}:defsize': 'string',                   // Default order size for orders on this stub
    '{stub}:defstoptrigger': 'string',            // Default trigger for stoploss on this stub
    '{stub}:defprofittrigger': 'string',          // Default trigger for take profit on this stub
    '{stub}:defprofitsize': 'string',             // Default take profit size on this stub
    '{stub}:maxposqty': 'string',                 // Maximum number oif allowed positions on this stub
    '{stub}:ignored': 'string',                   // List of market symbols ignored from signals
    '{stub}:{symbol}:ignored': 'boolean',         // (Boolean) Market symbol is ignored
    '{stub}:{symbol}:defsize': 'string',          // Default order size for orders on this stub and symbol
    '{stub}:{symbol}:defstoptrigger': 'string',   // Default trigger for stoploss on this stub and symbol
    '{stub}:{symbol}:defprofittrigger': 'string', // Default trigger for take profit on this stub and symbol
    '{stub}:{symbol}:defprofitsize': 'string',    // Default take profit size on this stub and symbol

};

module.exports = class frostybot_config_module extends frostybot_module {

    // Constructor

    constructor() {
        super()
    }
    

    // Get all config parameters for a user
    
    async getall() {
        return await this.settings.get('config');
    }


    // Get config parameter

    async get(params, defval = null) {

        delete params.token;

        var check = {};
        var results = {};

        // Internal 
        if (this.utils.is_string(params)) {
            check[params] = false;            
        }
        
        // User
        if (this.utils.is_object(params) && Object.keys(params).length > 0) {
            check = params;
        }

        // Cycle through params and validate
        var check_keys = Object.keys(check);


        for (var i=0; i<check_keys.length; i++) {
            var key = check_keys[i].toLowerCase();
            var val = check[key];
            var validate = await this.validate_key(key);
            if (validate !== false) {
                var val = await this.settings.get('config', key, null);
                if (val != null)
                    results[key] = this.utils.is_json(val) ? JSON.parse(val) : val;
                else 
                    if (defval !== null) 
                        results[key] = defval;
                    //else
                    //    this.output.warning('config_get', [key])        
            }
        }

        switch (Object.values(results).length) {
            case 0  :   return false;
            case 1  :   return Object.values(results)[0];
            default :   return results;
        }

    }

    // Validate stub in config key

    async validatestub(stub) {
        var accounts = await this.accounts.get();
        if (this.utils.is_object(accounts)) {
            if (Object.keys(accounts).includes(stub))
                return stub;
        }
        return false;
    }

    // Validate symbol in config key

    async validatesymbol(stub, symbol) {
        if (stub != undefined) {
            var exchange = new this.classes.exchange(stub);
            var market = await exchange.execute('get_market_by_symbol',symbol.toUpperCase());
            if (market !== null) return symbol.toUpperCase();
        }
        return false;
    }

    // Find a matching config key

    match_config_key(key) {
        var key_parts = key.split(':');
        var val_keys = Object.keys(config_keys);
        for(var i = 0; i < val_keys.length; i++) {
            var val_key = val_keys[i];
            var val_parts = val_key.split(':');
            if (key_parts.length == val_parts.length) {
                if (key_parts[key_parts.length - 1] == val_parts[val_parts.length - 1]) {
                    return val_key;
                }
            }
        }
        return false;
    }

    // Validate config key

    async validate_key(key) {
        var val_key = this.match_config_key(key);
        if (val_key !== false) {
            var val_parts = val_key.split(':');
            var key_parts = key.split(':');
            if (val_parts.includes('{stub}')) {
                var idx = val_parts.indexOf('{stub}');
                var stub = await this.validatestub(key_parts[idx]);
                if (stub !== false) {
                    if (val_parts.includes('{symbol}')) {
                        var idx = val_parts.indexOf('{symbol}');
                        var symbol = await this.validatesymbol(stub, key_parts[idx]);
                        if (symbol !== false) {
                            return val_key;
                        } else {
                            this.output.error('config_invalid_symbol', [key]);
                            return false;
                        }
                    } else {
                        return val_key;
                    }
                } else {
                    this.output.error('config_invalid_stub', [key]);
                    return false;
                }
            } else {
                return val_key;
            }
        }
        this.output.error('config_invalid_key', [key]);
        return false;
    }

    // Validate supplied config 

    async validate(key, val) {
        var valkey = await this.validate_key(key);
        var validated = false;
        if (valkey !== false) {
            var valstr = config_keys[valkey];
            if (valstr.indexOf(':') > 0) 
                var [valtype, valopt] = valstr.split(':');
            else
                var valtype = valstr;
            switch (valtype) {
                case 'boolean'  :   if (this.utils.is_bool(val) || String(val) == 'null') {
                                        validated = true;
                                        val = String(val) == 'true' ? true : String(val) == 'null' ? null : false;
                                    } else
                                        this.output.error('config_invalid_value', [key, 'true or false']);
                                    break;
                case 'array'    :   val = this.utils.is_json(val) ? JSON.parse(val) : val;
                                    if (this.utils.is_array(val) || this.utils.is_object(val)) {
                                        validated = true;
                                    } else
                                        this.output.error('config_invalid_value', [key, 'an array']);
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
        } else {
            validated = false;
        }
        return validated;
    }

    // Set config parameter

    async set(params, val = null) {

        delete params.token;

        var check = {};
        var results = {};

        // Internal 
        if (this.utils.is_string(params)) {
            check[key] = val;            
        }
        
        // User
        if (this.utils.is_object(params) && Object.keys(params).length > 0) {
            check = params;
        }

        // Cycle through params and validate
        var check_keys = Object.keys(check);

        for (var i=0; i<check_keys.length; i++) {
            var key = check_keys[i].toLowerCase();
            var val = check[key];
            var validate = await this.validate(key, val);
            if (validate !== false) {
                if (val == null || val == '' || val == "null") { 
                    await this.settings.delete('config', key);
                    results[key] = '(deleted)';
                } else {
                    if (await this.settings.set('config', key, val)) {
                        this.output.success('config_set', [key, val])
                        results[key] = val;
                    } else {
                        this.output.error('config_set', [key, val])
                    }   
                }
            }
        }

        // Retrun result
        switch (Object.values(results).length) {
            case 0  :   return false;
            case 1  :   return Object.values(results)[0];
            default :   return results;
        }    

    }

    // Delete config parameter

    async delete(key) {
        return await this.settings.delete('config', key.toLowerCase());
    }
    
};