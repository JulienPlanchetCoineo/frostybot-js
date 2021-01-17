// Symbol Mapping Module

const frostybot_module = require('./mod.base')

const config_keys = [
    'dummy:unittest',           // Dummy key for unit testing
    'debug:output',             // (Boolean) Enable debug output
    'debug:noexecute',          // (Boolean) Do not process order queue and execute orders on the exchange
    'trade:require_maxsize',    // (Boolean) Whether or not to require the maxsize parameter when using relative pricing
];

module.exports = class frostybot_config_module extends frostybot_module {

    // Constructor

    constructor() {
        super()
    }
    

    // Get config parameter

    async get(params) {

        var schema = {
            key: {
                required: 'string',
                format: 'lowercase',
            }
        }

        if (!(params = this.utils.validator(params, schema))) return false; 

        var key = String(params.key);
        if (!config_keys.includes(key)) 
            return this.output.error('config_invalid_key', [key]);

        var val = await this.settings.get('config', key, null);
        if (val != null) {
            this.output.success('config_get', [key])
            return JSON.parse((!this.utils.is_json(val) ? JSON.stringify(val) : val));
        }
        else
            return this.output.error('config_get', [key])        
    }


     // Set config parameter

     async set(params) {

        var schema = {
            key: {
                required: 'string',
                format: 'lowercase',
            },
            value: {
                required: 'string',
            }
        }

        if (!(params = this.utils.validator(params, schema))) return false; 

        var key = String(params.key);
        if (!config_keys.includes(key)) 
            return this.output.error('config_invalid_key', [key]);

        var value = (this.utils.is_json(params.value)) ? params.value : JSON.stringify(params.value);

        if (!this.utils.is_json(value))
            return this.output.error('config_invalid_value', [value]);
        if (await this.settings.set('config', key, value)) 
            return this.output.success('config_set', [key, value])
        else
            return this.output.error('config_set', [key, value])
    }

     // Delete config parameter

     async delete(params) {

        var schema = {
            key: {
                required: 'string',
                format: 'lowercase',
            }
        }

        if (!(params = this.utils.validator(params, schema))) return false; 

        var key = String(params.key);
        if (!config_keys.includes(key)) 
            return this.output.error('config_invalid_key', [key]);
        
        return await this.settings.delete('config', key);
     }
};