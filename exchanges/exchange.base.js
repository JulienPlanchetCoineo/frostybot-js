// Exchange Base Class

const ccxtlib = require ('ccxt')
md5 = require('md5')

// Normalizer base class

module.exports = class frostybot_exchange_base {

    constructor(stub) {
        this.load_modules();
        this.data = {
            markets: null,
            balances: null,
            markets_by_id: {},
            markets_by_symbol: {},
        }
        this.stub = stub;
        this.account = this.accounts.getaccount(stub);
        if (this.account) {
            const accountParams = this.accounts.ccxtparams(this.account);
            const exchangeId = this.account.exchange
            const exchangeClass = ccxtlib[exchangeId]
            this.ccxtobj = new exchangeClass (accountParams.parameters)
            this.ccxtobj.options.adjustForTimeDifference = true
            this.ccxtobj.loadMarkets();
        }
    }

    // Create module shortcuts

    load_modules() { 
        Object.keys(global.frostybot._modules_).forEach(module => {
            if (!['core'].includes(module)) {
                this[module] = global.frostybot._modules_[module];
            }
        })
    }

    // Execute method

    async execute(method, params) {
        if (this.utils.is_empty(params)) {
            params = [];
        }
        if (!this.utils.is_array(params)) {
            params = [params];
        }
        await this.markets();
        if (typeof(this[method]) == 'function') {
            return await this.normalizer(method, params);
        } else {
            return await this.ccxt(method, params);
        }
    }

    // Normalizer Wrapper

    async normalizer(method, params = []) {
        return await this[method](...params);     
    }

    // CCXT Wrapper

    async ccxt(method, params = []) {
        try {
            if (!this.utils.is_array(params)) {
                params = [params];
            }
            var cache_methods = {
                //'fetch_tickers' : 5,
                'fetch_markets' : 5,
                'private_get_get_positions' : 5,
                'private_get_get_account_summary': 5,
                'private_get_positions' : 5,
                'fetch_orders' : 5,
                'fetch_open_orders' : 5,
                'fetch_closed_orders' : 5,
                'public_get_get_book_summary_by_currency': 5,
                'v3_get_ticker_bookticker': 5,
                'fapiPublic_get_ticker_bookticker': 5,
                'fapiPrivate_get_positionrisk' : 5,
            }
            if (cache_methods.hasOwnProperty(method)) {
                var cachetime = cache_methods[method]
                var key = md5([this.stub, method, this.utils.serialize(params)].join('|'));
                var value = this.cache.get( key );
                if ( value == undefined ) {
                    var result = await this.ccxtobj[method](...params);
                    this.cache.set( key, result, cachetime );
                } else {
                    var result = value;
                }
            } else {
                var result = await this.ccxtobj[method](...params);
            }
            return result;
        }
        catch (error) {
            return { result: 'error', data: error }
        }
    }

    // Get market by ID

    async get_market_by_id(id) {
        if (this.data.markets == null) {
            await this.markets();
        }
        if (this.data.markets_by_id[id] != null) {
            return this.data.markets_by_id[id];
        }
        return null;
    }

    // Get market by Symbol

    async get_market_by_symbol(symbol) {
        if (this.data.markets == null) {
            await this.markets();
        }
        if (this.data.markets_by_symbol[symbol] != null) {
            return this.data.markets_by_symbol[symbol];
        }
        return null;
    }

    // Get market by ID or symbol

    async get_market_by_id_or_symbol(id_or_symbol) {
        let byid = await this.get_market_by_id(id_or_symbol);
        if (byid != null) {
            return byid;
        } else {
            let bysymbol = await this.get_market_by_symbol(id_or_symbol);
            if (bysymbol != null) {
                return bysymbol;
            }
        }
        return null;
    }


    // Index markets by ID and symbol

    async index_markets() {
        if (this.data.markets != null) {
            this.data.markets_by_id = {};
            this.data.markets_by_symbol = {};
            this.data.markets.forEach(market => {
                var id = market.id;
                var symbol = market.symbol;
                this.data.markets_by_id[id] = market;
                this.data.markets_by_symbol[symbol] = market;
            });
        }
    }


    // Update non-stablecoin quoted markets with USD price from a stablecoin-quoted market with same base

    async update_markets_usd_price() {
        this.data.markets.forEach((market, index) => {
            var id = market.id;
            var symbol = market.symbol;
            var base = market.base;
            var quote = market.quote;
            var usdbasepair = null;
            var usdquotepair = null;
            if (!this.stablecoins.includes(quote)) {
                market.usd = {
                    base: null,
                    quote: null,
                    pairs: {
                        base: null,
                        quote: null,
                    }
                };
                this.stablecoins.forEach(stablecoin => {
                    var pair = base + '/' + stablecoin;
                    if (this.data.markets_by_symbol[pair] && !usdbasepair) {
                        market.usd.base = this.data.markets_by_symbol[pair].avg;
                        market.usd.pairs.base = pair;
                    }
                    var pair = quote + '/' + stablecoin;
                    if (this.data.markets_by_symbol[pair] && !usdquotepair) {
                        market.usd.quote = this.data.markets_by_symbol[pair].avg;
                        market.usd.pairs.quote = pair;
                    }
                });
                if ((market.usd.quote != null) && (market.usd.base == null)) {
                    market.usd.base = market.usd.quote * market.avg;
                }
            } else {
                market.usd = market.avg;
            }
            this.data.markets[index] = market;
            this.data.markets_by_id[id] = market;
            this.data.markets_by_symbol[symbol] = market;
        })
    }


    // Get USD price for a currency

    get_usd_price(currency) {
        var price = null;
        if (this.stablecoins.includes(currency)) {
            price = 1;
            return price;
        } else {
            for (var i = 0; i < this.stablecoins.length; i++) {
                var stablecoin = this.stablecoins[i];
                var mapsymbol = this.balances_market_map.replace('{currency}', currency).replace('{stablecoin}', stablecoin);
                if (this.data.markets_by_symbol.hasOwnProperty(mapsymbol)) {
                    var market = this.data.markets_by_symbol[mapsymbol];
                    if (market != null) {
                        price = (market.bid + market.ask) / 2;
                        return price;
                    }        
                }    
            };
        }
        return false;
    }


    // Get account balances

    async balances() {
        if (this.data.balances != null) {
            return this.data.balances;
        }
        let results = await this.execute('fetch_balance');
        await this.markets();
        if (results.result != 'error') {
            var raw_balances = results.hasOwnProperty('data') ? results.data : results;
            delete raw_balances.info;
            delete raw_balances.free;
            delete raw_balances.used;
            delete raw_balances.total;
            var balances = [];
            Object.keys(raw_balances)
                .forEach(currency => {
                    var raw_balance = raw_balances[currency];
                    const used = raw_balance.used;
                    const free = raw_balance.free;
                    const total = raw_balance.total;
                    var price = this.get_usd_price(currency)
                    const balance = new this.classes.balance(currency, price, free, used, total);
                    if (Math.round(balance.usd.total) != 0) {
                        balances.push(balance);
                    }
                });
            this.data.balances = balances;
            return balances;
        }   
        return [];
    }

    // Get total of all equity assets in USD

    async balance_usd() {
        await this.balances();
        var free = 0;
        var used = 0;
        var total = 0;
        this.data.balances.forEach(balance => {
            free += balance.usd.free;
            used += balance.usd.used;
            total += balance.usd.total;
        });
        var usd = {
            free: free,
            used: used,
            total: total,
        }
        return usd;
    }

    // Get free USD balance

    async free_balance_usd() {
        await this.balances()
        var free = 0;
        this.data.balances.forEach(balance => {
            free += balance.usd.free;
        });
        return free;
    }

    // Get total USD balance

    async total_balance_usd() {
        await this.balances()
        var total = 0;
        this.data.balances.forEach(balance => {
            total += balance.usd.total;
        });
        return total;
    }

    // Merge orders

    merge_orders(orders1, orders2) {
        if (!this.utils.is_array(orders1)) orders1 = [];
        if (!this.utils.is_array(orders2)) orders2 = [];
        var merged = [...orders1, ...orders2];
        return merged.sort((a, b) => (a.timestamp < b.timestamp) ? 1 : -1);
    }

    // Parse orders

    parse_orders(raworders) {
        var orders = [];
        raworders.forEach(raworder => {
            orders.push(this.parse_order(raworder));
        });
        return orders;
    }

    // Get order parameter mappings

    get_order_param_map() {
        return this.param_map;
    }

    // Get exchange order sizing (base or quote)

    get_order_sizing() {
        return this.order_sizing;
    }

    // Get market for specific filter

    async market(filter) {
        let markets = await this.markets();
        let result = this.utils.filter_objects(markets, filter);
        if (this.utils.is_array(result) && result.length == 1) {
            return result[0];
        }
        return result;
    }

    // Get ticker for a symbol

    async ticker(symbol) {
        let results = await this.ccxt('fetch_ticker', symbol);
        if (results.result == 'success') {
            return results.data;
        }
        return null;
    }

    // Get position for specific filter
    
    async position(filter) {
        let positions = await this.execute('positions');
        let result = this.utils.filter_objects(positions, filter);
        if (this.utils.is_array(result) && result.length == 1) {
            return result[0];
        }
        return result;
    }

    // Create new order

    async create_order(params) {
        var [symbol, type, side, amount, price, order_params] = this.utils.extract_props(params, ['symbol', 'type', 'side', 'amount', 'price', 'params']);
        var market = await this.get_market_by_id_or_symbol(symbol);
        symbol = market.symbol;
        let create_result = await this.ccxt('create_order',[symbol, type, side, amount, price, order_params]);
        if (create_result.result == 'error') {
            var errortype = create_result.data.name;
            var trimerr = create_result.data.message.replace('ftx','').replace('deribit','')
            if (this.utils.is_json(trimerr)) {
                var errormsg = JSON.parse(trimerr).error;
                var result = {result: 'error', params: params, error: {type: errortype, message: errormsg}};
            } else {
                var errormsg = create_result.data.message;
                var result = {result: 'error', params: params, error: {type: errortype, message: errormsg}};
            }
        } else {
            var result = {result: 'success', params: params, order: this.parse_order(create_result)};
        }
        return result;
    }
    

    // Get orders

    async orders(params) {
        if (params == undefined) {
            params = { id: 'all'};
        }
        var [status, type, dir] = this.utils.extract_props(params, ['status', 'type', 'direction']);
        if (status == 'open') {
            var orders = await this.open_orders(params);    
        } else {
            var orders = await this.all_orders(params);
        }
        return orders
            .filter(order => (status == null || order.status == status))
            .filter(order => (type == null || order.type == type))
            .filter(order => (dir == null || order.direction == dir));
    }


    // Cancel all orders
    
    async cancel_all(params) {
        params.id = 'all';
        return this.cancel(params);
    }
    
    // Default leverage function (if not supported by exchange)

    async leverage(params) {
        return this.output.error('leverage_unsupported')
    }

}
