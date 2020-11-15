// Frostybot Custom Classes


md5 = require('md5')


// The base class (All Frostybot classes are derived from this)
class frostybot_base {

    constructor() {

    }

}

// Account Balance Object

class frostybot_balance extends frostybot_base {

    constructor(currency, price, free, used, total) {
        super();
        this.currency = currency;
        this.price = price;
        this.base = {
            free: free,
            used: used,
            total: total,
        } 
        this.usd = {
            free: free * price,
            used: used * price,
            total: total * price,
        }
    }

}

// Market Object

class frostybot_market extends frostybot_base {

    constructor(id, symbol, type, base, quote, bid, ask, expiration, contract_size, precision, raw) {
        super();
        this.id = id;
        this.symbol = symbol;
        this.type = type;
        this.base = base;
        this.quote = quote;
        this.bid = bid;
        this.ask = ask;
        this.usd = null;
        this.avg = (bid != null && ask != null ? (bid + ask) / 2 : null);
        this.expiration = expiration;
        this.contract_size = contract_size;
        this.precision = precision;
        //this.raw = raw;
    }

}

// Position Base Object

class frostybot_position extends frostybot_base {

    constructor(market, direction, base_size, quote_size, price, raw) {
        super();

        var usdbase = market.usd.hasOwnProperty('base') ? market.usd.base : market.usd;
        var usdquote = market.usd.hasOwnProperty('quote') ? market.usd.quote : market.usd;
        //this.raw = raw;
        
        this.symbol = market.symbol;
        this.type = market.type;
        this.direction = direction;

        var sizing = base_size == null ? 'quote' : (quote_size == null ? 'base' : 'unknown')
        switch (sizing) {
            case    'base'  :   this.base_size = base_size;
                                this.quote_size = this.base_size * price;
                                this.usd_size = this.base_size * usdbase;
                                break;
            case    'quote' :   this.base_size = quote_size / price;
                                this.quote_size = quote_size;
                                this.usd_size = this.base_size * usdquote;
                                break;
        }

    }

}

// Futures Position Object

class frostybot_position_futures extends frostybot_position {
    
    constructor(market, direction, base_size, quote_size, entry_price, liquidation_price, raw = null) {
        super(market, direction, base_size, quote_size, entry_price, raw);
        this.entry_price = entry_price;
        this.entry_value = this.base_size * this.entry_price;
        this.current_price = (market.avg != null ? market.avg : (market.bid + market.ask) / 2)
        this.current_value = base_size * this.current_price;
        this.liquidation_price = liquidation_price;
        this.pnl = (this.current_value - this.entry_value); // Calculate PNL is not supplied by exchange
    }

}

// Spot Position Object

class frostybot_position_spot extends frostybot_position {

    constructor(market, direction, base_size, quote_size, raw = null) {
        super(market, direction, base_size, quote_size, market.avg, raw);
    }

}

// Order Object

class frostybot_order extends frostybot_base {

    constructor(market, id, timestamp, type, direction, price, trigger, size_base, size_quote, filled_base, filled_quote, status, raw = null)  {
        super();
        this.symbol = market.symbol;
        this.id = id;
        if (timestamp.length < 13) {       // Convert epoch timestamp to millisecond timestamp
            timestamp = timestamp * 100;
        }
        let dateobj = new Date(timestamp);
        /*
            let day = ("0" + dateobj.getDate()).slice(-2);
            let month = ("0" + (dateobj.getMonth() + 1)).slice(-2);
            let year = dateobj.getFullYear();
            let hour = dateobj.getHours();
            let minute = dateobj.getMinutes();
            let second = dateobj.getSeconds();
            this.datetime = year + "-" + month + "-" + day + " " + hour + ":" + minute + ":" + second;
        */
        this.timestamp = timestamp;
        this.datetime = dateobj;
        this.type = type;
        this.direction = direction;
        this.price = price;
        this.trigger = trigger;
        this.size_base = size_base;
        this.size_quote = size_quote;
        this.filled_base = filled_base;
        this.filled_quote = filled_quote;
        this.status = status;
        //this.raw = raw;        
    }

}

// Output Object

class frostybot_output extends frostybot_base {

    constructor(command, params, result, type, data, messages) {
        super();
        this.command = command;
        this.params = params != null ? helper.censorProps(params, ['apikey', 'secret']) : undefined;
        this.result = result;
        this.type = type;
        this.data = data;
        this.messages = messages;
    }

}


// Frostybot Exchange Handler

class frostybot_exchange extends frostybot_base {

    // Constructor

    constructor(stub) {
        super()
        this.exchanges = {}

        // Which normalizer methods should be exposed to the exchange class
        this.exposed_methods = [
            'positions',
            'position',
            'markets',
            'market',
            'ticker',
            'total_balance_usd',
            'free_balance_usd',
            'available_equity_usd',
            'balances',
            'orders',
            'cancel',
            'cancel_all',
            'get_market_by_id',
            'get_market_by_symbol',
            'get_market_by_id_or_symbol',
            'create_order',
            'custom_params',
        ]

        // Methods to cache and how many seconds they should be cached for

        this.cached_methods = {
            //positions: 2,
            //position: 2,
            available_equity_usd: 2,
            markets: 10,
            market: 10,
            ticker: 10,
            balances: 2,
            orders: 2,
            get_market_by_id: 10,
            get_market_by_symbol: 10,
            get_market_by_id_or_symbol: 10,
        }

        this.load_modules()
        this.load_handler(stub)
        this.load_methods()
    }


    // Create module shortcuts

    load_modules() {
        for (const [method, module] of Object.entries(global.frostybot.modules)) {
            this[method] = module
        }
    }


    // Load exchange handler for stub

    load_handler(stub) {
        this.handler = null;
        var account = this.accounts.getaccount(stub)
        if (account) {
            account = this.utils.lower_props(account)
            if (account && account.hasOwnProperty(stub)) {
                account = account[stub];
            }    
            const exchange_id = account.exchange;
            this.exchange_id = exchange_id;
            var type = account.hasOwnProperty('type') ? account.type : null;
            this.exchanges[exchange_id] = require('../exchanges/exchange.' + exchange_id + (type != null ? '.' + type : ''));
            const exchange_class = this.exchanges[exchange_id];
            this.handler = new exchange_class (stub);
        }
    }


    // Load methods

    load_methods() {
        this.exposed_methods.forEach(method => {
            this[method] = async(params) => { return await this.cache_method(method, params); }
        });
    }


    // Cache method

    async cache_method(method, params) {
        
        if (this.handler == undefined)
            this.load_handler(params.stub)

        if (this.cached_methods.hasOwnProperty(method)) {
            var cachetime = this.cached_methods[method];
            var key = md5([this.stub, method, this.utils.serialize(params)].join('|'));
            var value = this.cache.get( key );
            if ( value == undefined ) {
                var result = await this.handler.execute(method, params);
                this.cache.set( key, result, cachetime );
            } else {
                var result = value;
            }
        } else {
            var result = await this.handler.execute(method, params);
        }
        return result;
        
    }


    // Normalizer and CCXT Execution Handler

    async execute(method, params = []) {
        if (this.handler != undefined) {
            return await this.handler.execute(method, params);
        } 
        return false;
    }


    // Get Exchange property

    get(property) {
        return this.handler[property];
    }

}


module.exports = {

    balance:            frostybot_balance,
    position_futures:   frostybot_position_futures,
    position_spot:      frostybot_position_spot,
    market:             frostybot_market,
    order:              frostybot_order,
    output:             frostybot_output,
    exchange:           frostybot_exchange,

}