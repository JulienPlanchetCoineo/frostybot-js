
// Whitelist Module for IP Access Control 


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
            if (method != 'whitelist') this[method] = module;
        }
    },
    

    // Add TradingView IPs

    tradingview() {
        this.initialize();
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
    },
    

    // Get whitelist

    get(params) {
        var ip = this.utils.extract_props(params, 'ip');
        //this.tradingview();
        var result = (ip == undefined ? this.settings.get('whitelist') : this.settings.get('whitelist', ip, false));
        if (result !== false) {
            if (result.hasOwnProperty('ip')) {
                this.output.debug('whitelist_get', [result.ip, result.description]);
            } else {
                result = this.utils.remove_values(result, [false, undefined]);
                Object.values(result).forEach(val => {
                    this.output.debug('whitelist_get', [val.ip, val.description]);
                });
            }
            return result;
        } 
        return this.output.error('whitelist_get', ip);
    },


    // Add IP to whitelist

    add(params) {
        var [ip, description] = this.utils.extract_props(params, ['ip', 'description']);
        if (!this.settings.get('whitelist', ip)) {
            var data = {
                ipAddress: ip,
                description: description,
                canDelete: 1
            }
            if (this.settings.set('whitelist', ip, data)) {
                return this.output.success('whitelist_add', ip);
            }
            return this.output.error('whitelist_add', ip);
        }
        return this.output.success('whitelist_add', ip);
    },


    // Delete IP from whitelist

    delete(params) {
        var ip = this.utils.extract_props(params, 'ip');
        var acl = this.settings.get('whitelist', ip);
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
    },


    // Enable whitelist verification

    enable() {
        if (this.settings.set('whitelist', 'enabled', true)) {
            this.output.notice('whitelist_enabled')
            return true
        }
        return false
    },


    // Disable whitelist verification
    
    disable() {
        if (this.settings.set('whitelist', 'enabled', false)) {
            this.output.notice('whitelist_disabled')
            return true
        }
        return false
    },


    // Check if whitelist is enabled

    is_enabled() {
        var result = this.settings.get('whitelist', 'enabled');
        if (result === null) {
            return true;
        }
        return result
    },

    // Verify IP in whitelist

    verify(ip) {
        this.initialize()
        if (this.is_enabled()) {
            var acl = this.settings.get('whitelist', ip);
            if (acl) {
                return this.output.notice('whitelist_verify', ip);
            }
            return this.output.error('whitelist_verify', ip);
        } else {
            this.output.notice('whitelist_disabled')
            return true
        }
    }



};