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
            password: {
                required: 'string',
            }
        }

        if (!(params = this.utils.validator(params, schema))) return false; 

        // Make sure that MySQL is being used
        var type = this.database.type;
        if (type != 'mysql') {
            return this.output.error('multitenant_mysql_req');
        }

        // Create tenant table if required
        this.output.debug('multitenant_createdb');
        this.database.exec("CREATE TABLE IF NOT EXISTS tenants (`uid` INT UNSIGNED NOT NULL AUTO_INCREMENT,`uuid` CHAR(38) NOT NULL,`email` VARCHAR(100) NOT NULL,`password` JSON NOT NULL,`enabled` BOOL NOT NULL DEFAULT true,`elevated` BOOL NOT NULL DEFAULT false,`last` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,PRIMARY KEY (`uid`),UNIQUE INDEX `UNQ_UUID` (`uuid`),UNIQUE INDEX `UNQ_EMAIL` (`email`),INDEX `IDX_UUID` (`uuid` ASC) VISIBLE,INDEX `IDX_EMAIL` (`email` ASC) VISIBLE) COLLATE='latin1_swedish_ci';");

        // Add master tenant and enable multitenant functionality
        params['elevated'] = true;
        var uuid = await this.add(params);
        if (uuid !== false) {
            if (await this.settings.set('core', 'multitenant:enabled', true)) {
                this.output.success('multitenant_enable');
                return uuid;
            }
        }
        return this.output.error('multitenant_enable');
    }


    // Disable Multi-Tenant Mode

    async disable() {
        return await this.settings.set('core', 'multitenant:enabled', false);
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
            },
            password: {
                required: 'string',
            },
            elevated: {
                required: 'boolean',
            },
        }

        if (!(params = this.utils.validator(params, schema))) return false; 

        var [email, password, elevated] = this.utils.extract_props(params, ['email', 'password', 'elevated']);

        var uuid = await this.encryption.new_uuid();
        var user = {
            uuid     : String(uuid),
            email    : String(email),
            password : password,
            enabled  : true,
            elevated : (elevated == undefined ? false : elevated)
        };
        user = await this.utils.encrypt_values(user, ['password']);
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