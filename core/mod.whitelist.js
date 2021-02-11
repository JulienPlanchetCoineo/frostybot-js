
// Whitelist Module for IP Access Control 

const frostybot_module = require('./mod.base')

module.exports = class frostybot_whitelist_module extends frostybot_module {

    // Constructor

    constructor() {
        super()
    }
    

    // Add TradingView IPs

    tradingview() {
        var data = {
            ip: '52.32.178.7',
            description: 'TradingView Server Address',
            canDelete: 0
        }
        this.settings.set('whitelist', data.ip, data)
        data.ip = '54.218.53.128'
        this.settings.set('whitelist', data.ip, data)
        data.ip = '34.212.75.30'
        this.settings.set('whitelist', data.ip, data)
        data.ip = '52.89.214.238'
        this.settings.set('whitelist', data.ip, data)
        data.ip = '127.0.0.1'
        data.description = 'localhost'
        this.settings.set('whitelist', data.ip, data)
    }
    

    // Get whitelist

    async get(params) {

        var schema = {
            ip: {
                optional: 'ip',
                format:   'lowercase',
            },
        }

        if (!(params = this.utils.validator(params, schema))) return false; 

        var [ip, ipAddress] = this.utils.extract_props(params, ['ip','ipAddress']);
        ip = (ip != undefined ? ip : ipAddress);
        //this.tradingview();
        var result = (ip == undefined ? await this.settings.get('whitelist') : await this.settings.get('whitelist', ip, false));
        if (result !== false) {
            if (result.hasOwnProperty('ip') || result.hasOwnProperty('ipAddress') ) {
                var ip = result.ip !== undefined ? result.ip : (result.ipAddress != undefined ? result.ipAddress : false);
                this.output.debug('whitelist_get', [ip, result.description]);
            } else {
                result = this.utils.remove_values(result, [false, undefined]);
                Object.values(result).forEach(val => {
                    var ip = (val.ip !== undefined ? val.ip : val.ipAddress);
                    var description = String(val.description).toLowerCase() == 'localhost' ? 'localhost' : val.description;
                    var canDelete = val.canDelete;
                    val = {
                        ip: ip,
                        description: description,
                        canDelete: canDelete
                    }
                    result[ip] = val;
                    this.output.debug('whitelist_get', [ip , description]);
                });
            }
            return result;
        } 
        return this.output.error('whitelist_get', ip);
    }


    // Add IP to whitelist

    async add(params) {

        var schema = {
            ip: {
                required: 'ip',
                format: 'lowercase',
            },
        }

        if (!(params = this.utils.validator(params, schema))) return false; 

        var [ip, description] = this.utils.extract_props(params, ['ip', 'description']);
        if (!await this.settings.get('whitelist', ip)) {
            var data = {
                ip: ip,
                description: description,
                canDelete: 1
            }
            if (this.settings.set('whitelist', ip, data)) {
                return this.output.success('whitelist_add', ip);
            }
            return this.output.error('whitelist_add', ip);
        }
        return this.output.success('whitelist_add', ip);
    }


    // Delete IP from whitelist

    async delete(params) {
        
        var schema = {
            ip: {
                required: 'ip',
                format: 'lowercase',
            },
        }

        if (!(params = this.utils.validator(params, schema))) return false; 

        var ip = this.utils.extract_props(params, 'ip');
        var acl = await this.settings.get('whitelist', ip);
        if (acl) {
            if (acl.canDelete == 1) {
                if (this.settings.delete('whitelist', ip)) {
                    return this.output.success('whitelist_delete', ip);
                }
            } else {
                return this.output.error('whitelist_delete', ip + ' (protected)');
            }
        }
        return this.output.error('whitelist_delete', ip + ' (not found)');
    }


    // Enable whitelist verification

    async enable() {
        if (await this.settings.set('whitelist', 'enabled', true)) {
            return this.output.success('whitelist_enable')
        }
        return this.output.error('whitelist_enable')
    }


    // Disable whitelist verification
    
    async disable() {
        if (await this.settings.set('whitelist', 'enabled', false)) {
            return this.output.success('whitelist_disable')
        }
        return this.output.error('whitelist_disable')
    }


    // Check if whitelist is enabled

    async is_enabled() {
        var result = await this.settings.get('whitelist', 'enabled');
        if ((result === null) || (result == true)) {
            this.output.notice('whitelist_enabled')
            return true;
        }
        this.output.notice('whitelist_disabled')
        return result
    }

    // Verify IP in whitelist

    async verify(ip) {
        if (this.utils.is_object(ip) && (ip.hasOwnProperty('ip') || ip.hasOwnProperty('ipaddress'))) 
            ip = ip.ip != undefined ? ip.ip : ip.ipaddress;
        if (this.is_enabled()) {
            var acl = await this.settings.get('whitelist', ip);
            if (acl) {
                this.output.notice('whitelist_verify', ip);
                return true
            }
            return this.output.error('whitelist_verify', ip);
        } else {
            this.output.notice('whitelist_disabled')
            return true
        }
    }



};