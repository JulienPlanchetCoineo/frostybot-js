frostybot_exchange_base = require('./exchange.base');

module.exports = class frostybot_exchange_ftx extends frostybot_exchange_base {

    // Class constructor

    constructor(stub) {
        super(stub);
        this.stablecoins = ['USD', 'USDT'];  // Stablecoins supported on this exchange
        this.order_sizing = 'base';          // Exchange requires base size for orders
        this.collateral_assets = ['BCH','BNB','BTC','BVOL','CUSDT','ETH','FTT','IBVOL','KNC','LINK','LTC','PAXG','SOL','SRM','TRX','TRYB','USD','USDT','XAUT','XRP'];  // Assets that are used for collateral
        this.param_map = {                   // Order parameter mappings
            limit             : 'limit',
            market            : 'market',
            stoploss_limit    : 'stop',
            stoploss_market   : 'stop',
            takeprofit_limit  : 'takeProfit', 
            takeprofit_market : 'takeProfit',
            trailing_stop     : 'trailingStop', 
            post              : 'postOnly',
            reduce            : 'reduceOnly',
            ioc               : 'ioc',
            tag               : 'clientId',
            trigger           : 'triggerPrice',
        };
    }

    // Get list of current positions

    async positions() { 
        let results = await this.ccxt('privateGetPositions', {showAvgPrice: true});
        if (results.result == 'success') {
            var raw_positions = results.data.result;
        } else {
            var raw_positions = [];
        }
        await this.markets();
        var positions = []; 
        await raw_positions
            .filter(raw_position => raw_position.size != 0)
            .forEach(async raw_position => {
                const symbol = raw_position.future;
                const market = await this.get_market_by_symbol(symbol);
                const direction = (raw_position.side == 'buy' ? 'long' : 'short');
                const base_size = raw_position.size;
                const entry_price = raw_position.recentAverageOpenPrice;
                const quote_size = base_size * entry_price;
                const liquidation_price = raw_position.estimatedLiquidationPrice;
                const pnl = raw_position.realizedPnl;
                const raw = raw_position;
                const position = new this.classes.position(market, direction, base_size, quote_size, entry_price, liquidation_price, pnl, raw);
                positions.push(position)
            })
        this.positions = positions;
        return this.positions;
    }

    // Get list of markets from exchange

    async markets() {
        if (this.data.markets != null) {
            return this.data.markets;
        }
        let result = await this.ccxt('fetch_markets');
        if (result.result == 'success') {
            var raw_markets = result.data;
        } else {
            return false;
        }  
        this.data.markets = [];
        raw_markets
            .filter(raw_market => raw_market.active == true)
            .forEach(raw_market => {
                const id = raw_market.id;
                const symbol = raw_market.symbol;
                const base = raw_market.base;
                const quote = raw_market.quote;
                const bid = raw_market.info.bid;
                const ask = raw_market.info.ask;
                const expiration = (raw_market.expiration != null ? raw_market.expiration : null);
                const contract_size = (raw_market.info.contractSize != null ? raw_market.info.contractSize : 1);
                const precision = raw_market.precision;
                const raw = raw_market.info;
                const market = new this.classes.market(id, symbol, base, quote, bid, ask, expiration, contract_size, precision, raw)
                this.data.markets.push(market);
            });
        await this.index_markets();
        await this.update_markets_usd_price();
        return this.data.markets;
    }

    // Get ticker for a symbol

    async ticker(symbol) {
        let results = await this.ccxt('fetch_ticker', symbol);
        if (results.result == 'success') {
            return results.data;
        }
        return null;
    }

    // Get account balances

    async balances() {
        if (this.data.balances != null) {
            return this.data.balances;
        }
        let results = await this.ccxt('fetch_balance');
        await this.markets();
        if (results.result == 'success') {
            var raw_balances = results.data;
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
                    var price = null;
                    if (this.stablecoins.includes(currency)) {
                        price = 1;
                    } else {
                        var market = this.data.markets_by_symbol[currency + '/USD'];
                        if (market != null) {
                            price = (market.bid + market.ask) / 2;
                        }
                    }
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

    // Get account collateral

    async collateral() {
        let results = await this.ccxt('privateGetAccount');
        if (results.result == 'success') {
            var account = results.data.result;
            var result = {
                total: account.collateral,
                free: account.freeCollateral
            }
            return result;
        }
        return null;
    }

    // Get open orders

    async open_orders(params) {
        var [symbol, since, limit] = this.utils.extract_props(params, ['symbol', 'since', 'limit']);
        let raworders1 = await this.ccxtobj.fetchOpenOrders(symbol, since, limit, {method: 'privateGetOrders'});
        let raworders2 = await this.ccxtobj.fetchOpenOrders(symbol, since, limit, {method: 'privateGetConditionalOrders'});
        var raworders = this.merge_orders(raworders1, raworders2);
        return this.parse_orders(raworders);
    }

    // Get all order history

    async all_orders(params) {
        var [symbol, since, limit] = this.utils.extract_props(params, ['symbol', 'since', 'limit']);
        let raworders1 = await this.ccxtobj.fetchOrders(symbol, since, limit, {method: 'privateGetOrdersHistory'});
        let raworders2 = await this.ccxtobj.fetchOrders(symbol, since, limit, {method: 'privateGetConditionalOrdersHistory'});
        var raworders = this.merge_orders(raworders1, raworders2);
        return this.parse_orders(raworders);
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

    // Cancel orders

    async cancel(params) {
        var [symbol, id] = this.utils.extract_props(params, ['symbol', 'id']);
        var orders = await this.open_orders({symbol: symbol});
        if (id.toLowerCase() == 'all') {
            let result = await this.ccxtobj.privateDeleteOrders({market: symbol});
            if (String(result.success) == "true") {
                orders.forEach((order, idx) => {
                    order.status = 'cancelled';
                    orders[idx] = order;
                })   
            } 
        } else {
            orders = orders.filter(order => ['all',order.id].includes(id));
            await orders.forEach(async (order) => {
                var id = order.id;
                if (['market','limit'].includes(order.type)) {
                    await this.ccxtobj.privateDeleteOrdersOrderId({'order_id': id});
                } else {
                    await this.ccxtobj.privateDeleteConditionalOrdersOrderId({'order_id': id});
                }
            });
            orders.forEach((order, idx) => {
                order.status = 'cancelled';
                orders[idx] = order;
            })    
        }
        return orders;
    }

    // Cancel all orders
    
    async cancel_all(params) {
        params.id = 'all';
        return this.cancel(params);
    }

    // Create new order

    async create_order(params) {
        var [symbol, type, side, amount, price, order_params] = this.utils.extract_props(params, ['symbol', 'type', 'side', 'amount', 'price', 'params']);
        let create_result = await this.ccxt('create_order',[symbol, type, side, amount, price, order_params]);
        if (create_result.result == 'error') {
            var errortype = create_result.data.name;
            var trimerr = create_result.data.message.replace('ftx','')
            if (this.utils.is_json(trimerr)) {
                var errormsg = JSON.parse(trimerr).error;
                var result = {result: 'error', params: params, error: {type: errortype, message: errormsg}};
            } else {
                var errormsg = create_result.data.message;
                var result = {result: 'error', params: params, error: {type: errortype, message: errormsg}};
            }
        } else {
            var result = {result: 'success', params: params, order: this.parse_order(create_result.data)};
        }
        return result;
    }


    // Parse CCXT order format into Frostybot order format

    parse_order(order) {
        if (order instanceof this.classes.order) {
            return order;
        }
        const symbol = order.symbol;
        const market = this.data.markets_by_symbol[symbol];
        const id = order.id;
        const timestamp = order.timestamp;
        const direction = order.side;
        const trigger = (order.info.trailValue != undefined ? order.info.trailValue : (order.info.triggerPrice != undefined ? order.info.triggerPrice : null));
        const market_price = (direction == 'buy' ? market.ask : market.bid);
        const price = (order.info.orderPrice != null ? order.info.orderPrice : (order.price != null ? order.price : (trigger != null ? trigger : (type == 'market' ? market_price : null))));
        const size_base = order.amount;
        const size_quote = order.amount * price;
        const filled_base = order.filled;
        const filled_quote = order.filled * price;
        var type = order.type.toLowerCase();
        switch (type) {
            case 'stop'          :  type = (price != trigger ? 'stop_limit' : 'stop_market');
                                    break;
            case 'take_profit'   :  type = (price != trigger ? 'takeprofit_limit' : 'takeprofit_market');
                                    break;
        }
        const status = order.status.replace('canceled', 'cancelled');   // Fix spelling error
        const raw = order.info;
        return new this.classes.order(market, id, timestamp, type, direction, price, trigger, size_base, size_quote, filled_base, filled_quote, status, raw);
    }


}
