// Main Frostybot module. All other modules are accessed via this module

const fs = require('fs');

// Method exported to the API

const api_methods = {
    
    accounts: [
        'get', 
        'add', 
        'delete', 
        'test',
    ],

    cache: [
        'flush', 
        'stats', 
    ],

    trade: [
        'long', 
        'short', 
        'buy', 
        'sell', 
        'stoploss', 
        'takeprofit', 
        'trailstop', 
        'close', 
        'market', 
        'markets', 
        'balances', 
        'position', 
        'positions', 
        'orders', 
        'cancel', 
        'cancelall',
    ],

    settings: [
        'get',
        'set',
    ],
    
    symbolmap:  [
        'get', 
        'add', 
        'delete', 
    ],

    whitelist:  [
        'get', 
        'add', 
        'delete',
        'verify',
        'enable',
        'disable', 
    ],

}

module.exports = {

    // Import Core Modules
    initialize() {
        // Load General Modules
        const dir = __dirname.substr(0, __dirname.lastIndexOf( '/' ) ) + '/core';
        global.frostybot = {
            modules  : {},
            settings : {},
        };
        fs.readdirSync( dir ).forEach( file => {
            if ((file != 'core.frostybot.js') && (file != 'core.api.js') && (file.indexOf('core.lang') < 0)) {
                var module = file.split('.')[1];
                global.frostybot.modules[module] = require('./' + file);
            }
        });
        this.modules();
    },

    
    // Create module shortcuts

    modules() {
        for (const [method, module] of Object.entries(global.frostybot.modules)) {
            this[method] = module;
        }
    },


    // Verify whitelist

    verify_whitelist(ip) {
        return this.whitelist.verify(ip);
        if (result === null) {
            return true;
        }
        return result
        var acl = this.settings.get('whitelist', ip);
        if (acl) {
            this.output.debug('whitelist_verify', ip);
            return true;
        }
        return this.output.error('whitelist_verify', ip);
    },

    // Parse request

    parse_request(request) {
        // Single pre-parsed command parameter
        if (request.body.hasOwnProperty('command')) return request.body;
        // Multiple pre-parsed command parameters
        if (this.utils.is_array(request.body) && request.body[0].hasOwnProperty('command')) return request.body;
        // Raw request body
        return this.parse_raw(request.rawBody);
    },
    

    // Parse raw text into parameter object

    parse_raw(text) {
        var lines = (text.trim() + '\n').split('\n');
        var commands = [];
        for (var l = 0; l < lines.length; l++) {
            var line = lines[l];
            if (line.trim() != '') {
                var params = line.split(' ');
                var paramObj = {};
                if (Array.isArray(params)) {
                    for(var i = 0; i < params.length; i++) {
                        var param = params[i].trim();
                        if (param.toLowerCase() != 'frostybot') {  // In case user included the "frostybot" in the webhook command
                            if (param.indexOf('=') < 0)
                            param = param.indexOf(':') >= 0 ? 'command=' + param : param;
                            var [key, val] = param.split('=');
                            paramObj[key] = val;
                        } 
                    }
                    commands.push(paramObj);
                }    
            }
        }
        return (commands.length == 1 ? commands[0] : commands);
    },



    // Parse Command Parameter Object

    parse_obj(params) {
        params = this.utils.clean_props(params);      
        var command = this.utils.extract_props(params, 'command');
        if (command == undefined) 
            return this.output.error('required_param', ['command']);
        if (command.indexOf(':') < 0) 
            return this.output.error('malformed_param', ['command']);
        var parts = command.split(':');
        if (this.utils.is_array(parts) && parts.length > 1) {
            var mod = parts[0];
            var cmd = parts.slice(1).join(':');
            if (cmd.indexOf(':') > 0) {                 // Check if stub is included in the command
                var [stub, cmd] = cmd.split(':');
                params['stub'] = stub;
            }
        } else {
            return this.output.error('malformed_param', ['command']);
        }
        delete params.command;
        return [mod, cmd, params];
    },


    // Check if module exists and initialize it

    load_module(module) {
        if (api_methods.hasOwnProperty(module) && this.hasOwnProperty(module)) {
            this[module].initialize();
            return true;
        } else {
            return false;
        }
    },


    // Check if a given method exists in a given module

    method_exists(module, method) {
        if (api_methods[module].includes(method) && this[module].hasOwnProperty(method) && typeof this[module][method] === 'function') {
            return true;
        }
        return false;
    },
    

    // Execute Frostybot Command(s)

    async execute(request) {
        this.output.reset();
        var params = this.parse_request(request);
        if (this.utils.is_array(params)) {                          
            var results = await this.execute_multiple(params);  // Multiple commands submitted
        } else {        
            var results = await this.execute_single(params);     // Single command submitted
        }
        return results;
    },


    // Execute Multiple Commands

    async execute_multiple(multi_params) {
        var results = [];
        for (var i = 0; i < multi_params.length; i++) {
            var params = multi_params[i];
            var result = await this.execute_single(params);
            results.push(result);
        }
        return this.output.combine(results);
    },


    // Execute a Single Command
    
    async execute_single(params) {
        var parsed = this.parse_obj(params);
        if (parsed.length == 3) {
            var [module, method, params] = parsed;
            this.output.section('executing_command', [module, method]);
            this.output.notice('executing_command', [module, method]);
            this.output.notice('command_params', this.utils.serialize(params));
            if (this.load_module(module)) {
                this.output.notice('loaded_module', module)    
                var method = this.utils.is_array(method.split(':')) ? method.split(':')[0] : method;
                if (this.method_exists(module, method)) {
                    var start = (new Date).getTime();
                    global.frostybot['command'] = {
                        module: module,
                        method: method
                    };
                    // If no symbol is supplied, use the default symbol
                    if (module != 'symbolmap' && !params.hasOwnProperty('symbol') && params.hasOwnProperty('stub')) {
                        var exchangeid = this.accounts.get_exchange_from_stub(params.stub);
                        if (exchangeid !== false) {
                            var mapping = await this.symbolmap.map(exchangeid, 'DEFAULT');
                            if (mapping !== false) {
                                this.output.notice('symbol_mapping', [exchangeid, 'default', mapping])
                                params.symbol = mapping;
                            } 
                        }
                    }
                    // Check for symbol mapping and use it
                    if (module != 'symbolmap' && params.hasOwnProperty('symbol') && params.hasOwnProperty('stub')) {
                        var exchangeid = this.accounts.get_exchange_from_stub(params.stub);
                        if (exchangeid !== false) {
                            var mapping = await this.symbolmap.map(exchangeid, params.symbol);
                            if (mapping !== false) {
                                this.output.notice('symbol_mapping', [exchangeid, params.symbol, mapping])
                                params.symbol = mapping;
                            } 
                        }
                    }
                    // If stub is supplied, and not adding a new stub, make sure the account exists
                    if (params.hasOwnProperty('stub') && !(module == 'accounts' && method == 'add')) {
                        var stub = params.stub.toLowerCase()
                        if (this.accounts.getaccount(stub) === false) {
                            return this.output.parse(this.output.error('unknown_stub', stub))
                        } 
                        params.stub = stub
                    }
                    let result = await this[module][method](params);
                    var end = (new Date).getTime();
                    var duration = (end - start) / 1000;            
                    this.output.notice('command_completed', duration);
                    return this.output.parse(result);
                } else {
                    return this.output.parse(this.output.error('unknown_method', method));  
                }
            } else {
                return this.output.parse(this.output.error('unknown_module', module));  
            }
        }
        return this.output.parse(this.output.error('malformed_param', parsed));
    }, 



}