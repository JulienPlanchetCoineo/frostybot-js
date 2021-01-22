// Accounts Handling Module

const frostybot_module = require('./mod.base')

module.exports = class frostybot_accounts_module extends frostybot_module {

    // Constructor

    constructor() {
        super()
    }


    // Get account silently (no log output, used internally)

    async getaccount(stub) {
        var account = await this.settings.get('accounts', stub);
        if (account !== null) {
            return await this.utils.decrypt_values( this.utils.lower_props(account), ['apikey', 'secret'])
        }
        return false;
    }


    // Get account(s)

    async get(params) {
        if (params == undefined) {
            params = []
        }
        var stub = this.utils.extract_props(params, 'stub');
        if ([undefined, false].includes(stub)) {
            var results = await this.settings.get('accounts');
            if (results) {
                var accounts = {};
                if (this.utils.is_object(results)) {
                    if (results.hasOwnProperty('stub')) {
                        var stub = results.stub;
                        accounts[stub] = results;
                    } else {
                        accounts = results;
                    }
                }
                //if (!this.utils.is_array(results))
                //results = results.hasOwnProperty('stub') ? [results] : results;

                //var accounts = {};
                //for(var i = 0; i < results.length; i++) 
                //    accounts[results[i].stub] = this.utils.lower_props(results[i]);
                
                this.output.success('account_retrieve', [ Object.values(accounts).length + ' accounts' ]);
                return await this.censored(accounts);
            } else return this.output.error('account_retrieve', ['No accounts configured']);
        }  else {
            var account = await this.settings.get('accounts', stub);
            if (account) {
                var accounts = {};
                accounts[stub] = this.utils.lower_props(account)
                this.output.success('account_retrieve', stub);
                return this.censored(accounts);
            }
            return this.output.error('account_retrieve', stub);
        }
    }


    // Censor account output

    async censored(accounts) {
        var result = {};
        if (accounts != false) {
            for (var [stub, account] of Object.entries(accounts)) {
                if (account != false) {
                    account = await this.utils.decrypt_values(account, ['apikey', 'secret'])
                    account = await this.utils.censor_props(account, ['secret'])
                }
                result[stub] = account;
            }
            return result;
        }
    }


    // Check if account stub exists

    async exists(stub) {
        var account = await this.settings.get('accounts', stub, false);
        if (account) {
            return true;
        }
        return false;
    }


    // Extract CCXT Test Parameters 

    create_params(params) {
        const stub = params.stub.toLowerCase();
        const description = params.hasOwnProperty('description') ? params.description : params.exchange;
        const exchange = params.exchange.toLowerCase();
        const type = params.hasOwnProperty('type') ? params.type : undefined;
        delete params.stub;
        delete params.description;
        delete params.exchange;
        delete params.type;
        var data = {
            description: description,
            exchange: exchange,
            type: type,
            parameters: params,
        }
        return [stub, data];
    }


    // Create new account

    async create(params) {

        var schema = {
            stub: {        required: 'string', format: 'lowercase' },
            exchange: {    required: 'string', format: 'lowercase', oneof: ['ftx', 'deribit', 'binance', 'binanceus', 'bitmex'] },
            description: { optional: 'string'  },
            apikey: {      required: 'string'  },
            secret: {      required: 'string'  },
            testnet: {     optional: 'boolean' },
            subaccount: {  optional: 'string'  },
            type: {        optional: 'string', format: 'lowercase', oneof: ['spot', 'futures'] },
        }

        if (!(params = this.utils.validator(params, schema))) return false; 

        if ((params.exchange == 'binance') && (!params.hasOwnProperty('type'))) {
            return this.output.error('binance_req_type')
        }

        var [stub, data] = this.create_params(params);
        let testresult = await this.test(data);
        if (testresult) {
            data['stub'] = stub;
            data = await this.utils.remove_props(data, ['tenant']);
            data = await this.utils.encrypt_values(data, ['apikey', 'secret']);
            if (await this.settings.set('accounts', stub, data)) {
                this.output.success('account_create', stub);
                return true;
            }
            this.output.error('account_create', stub);
        }
        return false;
    }


    // Alias for create

    async add(params) {
        return await this.create(params);
    }


    // Update account

    async update(params) {
        var [stub, data] = this.create_params(params);
        let testresult = await this.test(data);
        if (testresult) {
            data['stub'] = stub;
            this.output.success('account_test', stub);
            data = await this.utils.remove_props(data, ['tenant'])
            data = await this.utils.encrypt_values(data, ['apikey', 'secret'])
            if (await this.settings.set('accounts', stub, data)) {
                this.output.success('account_update', stub);
            }
            this.output.error('account_update', stub);
        }
        this.output.error('account_test', stub);
        return false;
    }


    // Delete account

    async delete(params) {

        var schema = {
            stub: { required: 'string', format: 'lowercase' }
        }

        if (!(params = this.utils.validator(params, schema))) return false; 


        var stub = (params.hasOwnProperty('stub') ? params.stub : null);
        if (stub != null) {
            if (await this.settings.delete('accounts', stub)) {
                this.output.success('account_delete', stub);
                return true;
            }
        }
        this.output.error('account_delete', stub);
        return false;
    }


    // Alias for delete

    async remove(params) {
        return await this.delete(params);
    }


    // Get account connection info

    async ccxtparams(account) {

        if (account.hasOwnProperty('uuid')) delete account.uuid;
        const ccxtlib = require ('ccxt');
        if (!account.hasOwnProperty('parameters')) {
            var stubs = Object.getOwnPropertyNames(account);
            if (stubs.length == 1) {
                account = account[stubs[0]];
            }
        }

        var testnet = account.parameters.hasOwnProperty('testnet') ? String(account.parameters.testnet) == "true" : false;
        var subaccount = account.parameters.hasOwnProperty('subaccount') ? account.parameters.subaccount : null;

        var result = {
            exchange: account.hasOwnProperty('exchange') ? account.exchange : null,
            description: account.hasOwnProperty('description') ? account.description : null,
            parameters: {
                apiKey:     account.parameters.hasOwnProperty('apikey') ? await  this.encryption.decrypt(account.parameters.apikey) : null,
                secret:     account.parameters.hasOwnProperty('secret') ? await this.encryption.decrypt(account.parameters.secret) : null,
                urls:       {},
            },   
        }
        if ((result.exchange == 'ftx') && (subaccount != null)) {
            result.parameters.headers = {
                'FTX-SUBACCOUNT': subaccount
            };
        }
        if (result.exchange == 'binance') {
            var type = (account.hasOwnProperty('type') ? account.type.replace('futures','future') : 'future');
            if (!['spot', 'future'].includes(type)) {
                return this.output.error('param_val_oneof', ['type', this.serialize_array(['spot', 'futures'])])
            } else {
                result.parameters['options'] = {
                    defaultType : type,
                };
            }
        }
        const exchangeId = account.exchange;
        const exchangeClass = ccxtlib[exchangeId];
        const ccxtobj = new exchangeClass ();
        const ccxturls = ccxtobj.urls;
        result.parameters.urls = ccxturls;
        if (testnet) {
            if (ccxturls.hasOwnProperty('test')) {
                const url = ccxturls.test;
                result.parameters.urls.api = url
            } else {
                this.output.translate('warning', 'testnet_not_avail', this.utils.uc_first(result.exchange));
            }
        }
        return result;
    }


    // Test account

    async test(params) {
        if (params.hasOwnProperty('stub')) {
            var account = await this.getaccount(params.stub);
        } else {
            var account = params;
        }
        const ccxtlib = require ('ccxt');
        var ccxtparams = await this.ccxtparams(account);
        const accountParams = ccxtparams.parameters;
        const exchangeId = account.exchange;
        const exchangeClass = ccxtlib[exchangeId];
        const ccxtobj = new exchangeClass (accountParams);
        try {
            let result = await ccxtobj.fetchBalance();
        } catch (e) {
            if (e.name == 'AuthenticationError') {
                this.output.error('account_test');
                return false;
            }
        } 
        this.output.success('account_test');
        return true;
    }


    // Get exchange ID from stub

    async get_exchange_from_stub(stub) {
        var account = await this.getaccount(stub);
        if (account !== false) {
            var ccxtparams = await this.ccxtparams(account);
            return ccxtparams.exchange;
        }
        return false;
    }


}