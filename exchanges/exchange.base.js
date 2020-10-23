// Exchange Base Class

const ccxtlib = require ('ccxt')


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
        this.account = this.accounts.getaccount(stub);
        if (this.account) {
            const accountParams = this.accounts.ccxtparams(this.account);
            const exchangeId = this.account.exchange
            const exchangeClass = ccxtlib[exchangeId]
            this.ccxtobj = new exchangeClass (accountParams.parameters)
            this.ccxtobj.loadMarkets();
        }
    }

    // Create module shortcuts

    load_modules() {
        for (const [method, module] of Object.entries(global.frostybot.modules)) {
            this[method] = module;
        }
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
            let result = await this.ccxtobj[method](...params);
            return { result: 'success', data: result }
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
            } else {
                market.usd = market.avg;
            }
            this.data.markets[index] = market;
            this.data.markets_by_id[id] = market;
            this.data.markets_by_symbol[symbol] = market;
        })
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

    // Get position for specific filter
    
    async position(filter) {
        let positions = await this.execute('positions');
        let result = this.utils.filter_objects(positions, filter);
        if (this.utils.is_array(result) && result.length == 1) {
            return result[0];
        }
        return result;
    }


}
