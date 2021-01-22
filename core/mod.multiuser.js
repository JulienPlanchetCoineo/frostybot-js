// Multi-user Module

const frostybot_module = require('./mod.base')

module.exports = class frostybot_multiuser_module extends frostybot_module {

    // Constructor

    constructor() {
        super()
    }

    // Enable Multi-User Mode

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
            return this.output.error('multiuser_mysql_req');
        }

        // Enable multi-user mode
        //this.output.debug('multiuser_createdb');
        if ((await this.database.exec("CALL `frostybot`.`multiuser_enable`('" + config.join("','") + "');", [])) !== false) {
            this.output.success('multiuser_enable');
            return this.encryption.core_uuid();            
        }

        return this.output.error('multiuser_enable');
    }


    // Disable Multi-User Mode

    async disable() {
        if (await this.database.exec("CALL `frostybot`.`multiuser_disable`();") !== false) 
            return this.output.success('multiuser_disable');
        else
            return this.output.error('multiuser_disable');
    }


    // Check if Multi-User is Enabled

    async is_enabled() {
        return await this.settings.get('core', 'multiuser:enabled', false);
    }


    // Get user UUID by email address

    async uuid_by_email(email) {
        var result = await this.database.select('users', {email: email});
        if (result.length == 1)
            return result[0].uuid;
        else
            return false;
    }
    
    // Get use token or see if it is still valid for the UI access to the API

    async get_token(uuid, return_token = true) {
        var result = await this.database.select('users', {uuid: uuid});
        if (result.length == 1) {
            var token = result[0]['token'];
            var expiry = result[0]['expiry'];
            var ts = (new Date()).getTime();
            if (ts < expiry) {
                return return_token ? token : true;
            }
        }
        return false;
    }

    
    // Add New User (returns the user UUID)

    async add(params) {

        var schema = {
            email: {
                required: 'string',
            }
        }

        if (!(params = this.utils.validator(params, schema))) return false; 

        var email = params.email;

        var uuid = await this.uuid_by_email(email);
        if (uuid !== false)
            return uuid;

        var user = {
            email    : String(email)
        };
        var result = await this.database.insertOrReplace('users',  user);
        if (result.changes > 0) {
            var uuid = await this.uuid_by_email(email);
            this.output.success('multiuser_add', [uuid]);
            return uuid;
        }  
        return this.output.error('multiuser_add', [email]);  
    }

    // Delete user

    async delete(params) {

        var schema = {
            uuid: {
                required: 'string',
            },
        }

        if (!(params = this.utils.validator(params, schema))) return false; 

        var uuid = params.uuid;
        var result = await this.database.delete('users',  {uuid: uuid});
        if (result.changes > 0) {
            this.output.success('multiuser_delete', [uuid]);
            return true;
        }  
        return this.output.error('multiuser_delete', [uuid]);  
    }

  

};