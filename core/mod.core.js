// Frostybot core module

const fs = require('fs');
var context = require('express-http-context');

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

    config: [
        'get',
        'set',
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
        'leverage',
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

    multiuser: [
        'enable',
        'disable',
        'add',
        'delete',
    ],

    websocket: [
        'subscribe',
        'unsubscribe',
    ],

}

const frostybot_module = require('./mod.base')

module.exports = class frostybot_core_module extends frostybot_module {


    // Constructor

    constructor() {
        super()
    }

    // Initalize

    initialize() {
    }

    // Verify whitelist

    async verify_whitelist(ip) {
        return await this.whitelist.verify(ip);
    }

    // Parse request

    parse_request(request) {
        // Single pre-parsed command parameter
        if (request.body.hasOwnProperty('command')) return request.body;
        // Multiple pre-parsed command parameters
        if (this.utils.is_array(request.body) && request.body[0].hasOwnProperty('command')) return request.body;
        // Raw request body
        return this.parse_raw(request.rawBody);
    }
    

    // Parse raw text into parameter object

    parse_raw(text) {
        var lines = (text.trim() + '\n').split('\n');
        var commands = [];
        for (var l = 0; l < lines.length; l++) {
            var line = lines[l];
            if (line.trim() != '') {
                var params = line.split(' ').filter(part => part.toLowerCase() != 'frostybot');
                var paramObj = {};
                if (Array.isArray(params)) {
                    var command = false;
                    for(var i = 0; i < params.length; i++) {
                        var param = params[i].trim();
                        if (param.toLowerCase() != 'frostybot') {  // In case user included the "frostybot" in the webhook command
                            if ((param.indexOf('=') < 0) && param.indexOf(':') >= 0 && (command == false)) {
                                command = true;
                                param = 'command='+param;
                            }
                            var [key, val] = param.split('=');
                            paramObj[key] = val;
                        } 
                    }
                    commands.push(paramObj);
                }    
            }
        }
        return (commands.length == 1 ? commands[0] : commands);
    }



    // Parse Command Parameter Object

    parse_obj(params) {
        params = this.utils.clean_object(params);      
        var command = this.utils.extract_props(params, 'command');
        if (command == undefined) 
            return this.output.error('required_param', ['command']);
        if (command.indexOf(':') < 0) 
            return this.output.error('malformed_param', ['command']);
        var parts = command.split(':');
        var numparts = parts.length;
        if (this.utils.is_array(parts) && parts.length > 1) {
            var mod = parts[0];
            var cmd = parts.slice(1).join(':');
            if (cmd.indexOf(':') > 0) {                 // Check if stub is included in the command
                var [stub, cmd] = cmd.split(':');
                params['stub'] = stub;
            }
            if ((numparts == 2) && (api_methods.trade.includes(cmd)) && (parts[0] !== 'trade')) {
                // "trade:" was excluded from the command, add it
                var stub = mod;
                var mod = "trade";
                params['stub'] = stub;
                this.output.debug('trade_cmd_shortcut', [stub.toLowerCase(), cmd.toLowerCase()]);
            }
        } else {
            return this.output.error('malformed_param', ['command']);
        }
        delete params.command;
        params = this.utils.uppercase_values(params, ['symbol', 'mapping']);
        params = this.utils.lowercase_values(params, ['stub']);
        return [mod, cmd, params];
    }


    // Check if module exists and initialize it

    load_module(module) {
        if (api_methods.hasOwnProperty(module) && this.hasOwnProperty(module)) {
            var mod = require('./mod.'+module)
            this[module] = new mod();
            return true;
        } else {
            return false;
        }
    }


    // Check if a given method exists in a given module

    method_exists(module, method) {
        const loader = require('./core.loader');
        loader.map_all();
        if (api_methods[module].includes(method)) {
            return true;
        }
        return false;
    }
    

    // Execute Frostybot Command(s)

    async execute(request) {
        this.output.reset();
        var params = this.parse_request(request);
        if (this.utils.is_object(params) && params.hasOwnProperty('0') && params['0'].hasOwnProperty('command')) {
            params = Object.values(params);
        }
        if (this.utils.is_array(params)) {                          
            var results = await this.execute_multiple(params);  // Multiple commands submitted
        } else {        
            var results = await this.execute_single(params);     // Single command submitted
        }
        return results;
    }


    // Execute Multiple Commands

    async execute_multiple(multi_params) {
        var results = [];
        if (this.utils.is_object(multi_params)) {
            multi_params = Object.values(multi_params)
        }
        for (var i = 0; i < multi_params.length; i++) {
            var params = multi_params[i];
            if (this.utils.is_object(params)) {
                var result = await this.execute_single(params);
                results.push(result);    
            }
        }
        return await this.output.combine(results);
    }

    // Execute a Single Command
    
    async execute_single(params) {
        var parsed = this.parse_obj(params);
        if (parsed.length == 3) {
            var [module, method, params] = parsed;
            this.output.section('executing_command', [module, method]);
            this.output.notice('executing_command', [module, method]);
            this.output.notice('command_params', [{ ...{ command: module + ":" + method}, ...params }]);
            if (this.load_module(module)) {
                //this.output.debug('loaded_module', module)    
                var method = this.utils.is_array(method.split(':')) ? method.split(':')[0] : method;
                
                if (this.method_exists(module, method)) {
                    var start = (new Date).getTime();
                    global.frostybot['command'] = {
                        module: module,
                        method: method
                    };

                    // If multitenancy is enabled, require a tenant parameter if not accessing from localhost
                    if (this.multiuser.is_enabled()) {
                        if (context.get('srcIp') !== '127.0.0.1') {
                            if (params.hasOwnProperty('uuid')) {
                                var uuid = params.uuid;
                                delete params.uuid;
                            } else {
                                return await this.output.parse(this.output.error('required_param', ['uuid']));
                            }
                        } else {
                            var uuid = await this.encryption.core_uuid();
                        }
                    } else {
                        var uuid = await this.encryption.core_uuid();
                    }
                    context.set('uuid', uuid);
                    //this.output.debug('context_uuid', [uuid]);

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

                    // If stub is supplied, and not adding a new stub, make sure the account exists
                    if (params.hasOwnProperty('stub') && !(module == 'accounts' && method == 'add')) {
                        var stub = params.stub.toLowerCase()
                        if (this.accounts.getaccount(stub) === false) {
                            return await this.output.parse(this.output.error('unknown_stub', stub))
                        } 
                        params.stub = stub
                        context.set('stub', stub);
                    }

                    // Check for symbol mapping and use it if required, verify that market exists
                    if (module != 'symbolmap' && params.hasOwnProperty('symbol') && params.hasOwnProperty('stub')) {
                        var exchangeid = await this.accounts.get_exchange_from_stub(params.stub);
                        if (exchangeid !== false) {
                            // Check for symbolmap and use it if configured
                            var mapping = await this.symbolmap.map(exchangeid, params.symbol);
                            if (mapping !== false) {
                                this.output.notice('symbol_mapping', [exchangeid, params.symbol, mapping])
                                params.symbol = mapping.toUpperCase();
                            }
                            params.symbol = params.symbol.toUpperCase();
                            // Check that market symbol is valid
                            var exchange = new this.classes.exchange(stub);
                            if (exchange != undefined) {
                                let result = await exchange.market({symbol: params.symbol});
                                if (this.utils.is_empty(result)) {
                                    return await this.output.parse(this.output.error('unknown_market', params.symbol));
                                }
                            }
                        }
                    }

                    let result = await global.frostybot._modules_[module][method](params);
                    var end = (new Date).getTime();
                    var duration = (end - start) / 1000;            
                    this.output.notice('command_completed', duration);
                    return await this.output.parse(result);

                } else {
                    return await this.output.parse(this.output.error('unknown_method', method));  
                }
            } else {
                return await this.output.parse(this.output.error('unknown_module', module));  
            }
        }
        return await this.output.parse(this.output.error('malformed_param', parsed));
    } 



}