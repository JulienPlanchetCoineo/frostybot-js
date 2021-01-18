// Multi-Tenant Module

const frostybot_module = require('./mod.base')

module.exports = class frostybot_multitenant_module extends frostybot_module {

    // Constructor

    constructor() {
        super()
    }

    // Enable Multi-Tenant Mode

    async enable(params) {

        var schema = {
            email: {
                required: 'string',
            },
            url: {
                required: 'string',
            },
            clientid: {
                required: 'string',
            },
            secret: {
                required: 'string',
            }
        }

        if (!(params = this.utils.validator(params, schema))) return false; 
        var config = this.utils.extract_props(params, ['email', 'url', 'clientid', 'secret']);

        // Make sure that MySQL is being used
        var type = this.database.type;
        if (type != 'mysql') {
            return this.output.error('multitenant_mysql_req');
        }

        // Enable multi-tenant mode
        this.output.debug('multitenant_createdb');
        if ((await this.database.exec("CALL `frostybot`.`multitenant_enable`('" + config.join("','") + "');", [])) !== false) {
            this.output.success('multitenant_enable');
            return this.encryption.core_uuid();            
        }

        return this.output.error('multitenant_enable');
    }


    // Disable Multi-Tenant Mode

    async disable() {
        if (await this.database.exec("CALL `frostybot`.`multitenant_disable`();") !== false) 
            return this.output.success('multitenant_disable');
        else
            return this.output.error('multitenant_disable');
    }


    // Check if Multi-Tenant is Enabled

    async is_enabled() {
        return await this.settings.get('core', 'multitenant:enabled', false);
    }

    
    // Add New Tenant (returns the tenant UUID)

    async add(params) {

        var schema = {
            email: {
                required: 'string',
            }
        }

        if (!(params = this.utils.validator(params, schema))) return false; 

        var email = params.email;

        var uuid = await this.encryption.new_uuid();
        var user = {
            uuid     : String(uuid),
            email    : String(email),
            enabled  : true,
            elevated : false
        };
        var result = await this.database.insertOrReplace('tenants',  user);
        if (result.changes > 0) {
            this.output.success('multitenant_add', [uuid]);
            return uuid;
        }  
        return this.output.error('multitenant_add', [uuid]);  
    }

    // Delete Tenant

    async delete(params) {

        var schema = {
            uuid: {
                required: 'string',
            },
        }

        if (!(params = this.utils.validator(params, schema))) return false; 

        var uuid = params.uuid;
        var result = await this.database.delete('tenants',  {uuid: uuid});
        if (result.changes > 0) {
            this.output.success('multitenant_delete', [uuid]);
            return true;
        }  
        return this.output.error('multitenant_delete', [uuid]);  
    }

  

};