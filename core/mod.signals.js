// Signal provider management

const frostybot_module = require('./mod.base')
var context = require('express-http-context');

module.exports = class frostybot_signals_module extends frostybot_module {

    // Get signal provider by UUID

    async get_provider(uuid) {
        return await this.settings.get('signalprovider', uuid, false);
    }

    // Set signal provider data by UUID

    async set_provider(uuid, data) {
        return await this.settings.set('signalprovider', uuid, data);
    }

    // Get user config by UUID

    async get_user_config(uuid) {

        var config = await this.database.select('settings', {uuid: uuid, mainkey: 'config'});
        if (config.length == 0) 
            return false;
        var result = {}
        config.forEach(item => {
            result[item.subkey] = JSON.parse(item.value);
        })
        return result;

    }

    // Get user accounts by UUID

    async get_user_accounts(uuid) {

        var accounts = await this.database.select('settings', {uuid: uuid, mainkey: 'accounts'});
        if (accounts.length == 0) 
            return [];
        var result = [];
        accounts.forEach(item => {
            result.push(JSON.parse(item.value));
        })
        return result;
        
    }

    // Get list of signal provider

    async get_providers(params) {

        var providers = await this.settings.get('signalprovider');
        var result = {};
        if (this.utils.is_array(providers)) {
            providers.forEach(provider => {
                result[provider.uuid] = provider;
            })
        } 
        if (this.utils.is_object(providers)) {
            result[providers.uuid] = providers;
        }
        return result;

    }

    // Add new signal provider

    async add_provider(params) {

        var schema = {
            name: { required: 'string', format: 'lowercase' }
        }

        if (!(params = this.utils.validator(params, schema))) return false; 

        var name = params.name;

        var provider_uuid = this.encryption.new_uuid();

        var data = {
            uuid:   provider_uuid,
            name:   name,
            whitelist: [],
            exchanges:  []
        }

        var result = await this.settings.set('signalprovider', provider_uuid, data);
        if (result) {
            this.output.success('add_provider', [name]);
            return provider_uuid;
        }
        return this.output.error('add_provider', [name]);

    }

    // Add exchange for signal provider

    async add_exchange(params) {

        var schema = {
            provider: { required: 'string', format: 'lowercase' },
            exchange: { required: 'string', format: 'lowercase', oneof: ['ftx', 'deribit', 'binance_futures', 'binance_spot', 'binanceus', 'bitmex'] },
        }

        if (!(params = this.utils.validator(params, schema))) return false; 

        var [provider, exchange] = this.utils.extract_props(params, ['provider', 'exchange'])

        var data = await this.get_provider(provider);

        if (!data.exchanges.includes(exchange))
            data.exchanges.push(exchange);

        if (await this.set_provider(provider, data)) {
            return this.output.success('add_provider_exch', [provider, exchange]);
        } else {
            return this.output.error('add_provider_exch', [provider, exchange]);
        }

    }

    // Remove exchange for signal provider

    async remove_exchange(params) {

        var schema = {
            provider: { required: 'string', format: 'lowercase' },
            exchange: { required: 'string', format: 'lowercase', oneof: ['ftx', 'deribit', 'binance_futures', 'binance_spot', 'binanceus', 'bitmex'] },
        }

        if (!(params = this.utils.validator(params, schema))) return false; 

        var [provider, exchange] = this.utils.extract_props(params, ['provider', 'exchange'])

        var data = await this.get_provider(provider);

        if (data.exchanges.includes(exchange))
            data.exchanges = data.exchanges.filter(exch => exch != exchange);

        if (await this.set_provider(provider, data)) {
            return this.output.success('del_provider_exch', [provider, exchange]);
        } else {
            return this.output.error('del_provider_exch', [provider, exchange]);
        }

    }

    // Add whitelisted IP for signal provider

    async add_ip(params) {

        var schema = {
            provider: { required: 'string', format: 'lowercase' },
            ip: { required: 'ip', format: 'lowercase' },
        }

        if (!(params = this.utils.validator(params, schema))) return false; 

        var [provider, ip] = this.utils.extract_props(params, ['provider', 'ip'])

        var data = await this.get_provider(provider);

        if (!data.whitelist.includes(ip))
            data.whitelist.push(ip);

        if (await this.set_provider(provider, data)) {
            return this.output.success('add_provider_ip', [provider, ip]);
        } else {
            return this.output.error('add_provider_ip', [provider, ip]);
        }

    }

    // Remove whitelisted IP from signal provider

    async remove_ip(params) {

        var schema = {
            provider: { required: 'string', format: 'lowercase' },
            ip: { required: 'ip', format: 'lowercase' },
        }

        if (!(params = this.utils.validator(params, schema))) return false; 

        var [provider, ip] = this.utils.extract_props(params, ['provider', 'ip'])

        var data = await this.get_provider(provider);

        if (data.whitelist.includes(ip))
            data.whitelist = data.whitelist.filter(address => address != ip);

        if (await this.set_provider(provider, data)) {
            return this.output.success('del_provider_ip', [provider, ip]);
        } else {
            return this.output.error('del_provider_ip', [provider, ip]);
        }

    }

    // Send provider signal

    async send(params) {

        var schema = {
            provider: { required: 'string', format: 'lowercase' },
            user: { required: 'string', format: 'lowercase' },
            exchange: { required: 'string', format: 'lowercase', oneof: ['ftx', 'deribit', 'binance_futures', 'binance_spot', 'binanceus', 'bitmex'] },
            signal: { required: 'string', format: 'lowercase', oneof: ['long', 'short', 'buy', 'sell', 'close'] },
            symbol: { required: 'string', format: 'lowercase' },
        }

        if (!(params = this.utils.validator(params, schema))) return false; 

        var [provider_uuid, user_uuid, exchange, signal, symbol] = this.utils.extract_props(params, ['provider', 'user', 'exchange', 'signal', 'symbol']);

        var provider = await this.get_provider(provider_uuid);
        var config = await this.get_user_config(user_uuid);
        if (!provider)
            return this.output.error('invalid_provider', [provider_uuid]);
        
        if (!provider.exchanges.includes(exchange))
            return this.output.error('exch_not_supported', [exchange]);

        var accounts = await this.get_user_accounts(user_uuid);        
        if (this.utils.is_array(accounts))
            accounts = accounts
                .filter(account => (account.exchange + (account.hasOwnProperty('type') ? '_' + account.type : '')) == exchange)
                .filter(account => (Object.keys(config).includes(account.stub+':provider') && config[account.stub+':provider'] == provider_uuid))
                .filter(account => (Object.keys(config).includes(account.stub+':defsize')));

        if (accounts.length == 0)
            return this.output.error('no_accounts', [provider_uuid, exchange]);

        var commands = [];
        accounts.forEach(async account => {

            var cmd = {
                uuid: user_uuid,
                command : 'trade:' + account.stub + ':' + signal,
                symbol: symbol,
            }

            if (['long', 'short', 'buy', 'sell'].includes(signal)) {
                cmd['size'] = config[account.stub+':defsize'];
            }

            commands.push(cmd);

        });

        var core = global.frostybot._modules_['core'];
        core.execute_multiple(commands, true);

        //if (!user)
        //    return this.output.error('invalid_user', [user_uuid]);

        return this.output.success('signal_queued', [provider_uuid, user_uuid]);

    }

}