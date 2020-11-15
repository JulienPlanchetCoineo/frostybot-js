frostybot_exchange_base = require('./exchange.base');

module.exports = class frostybot_exchange_binance_base extends frostybot_exchange_base {

    // Class constructor

    constructor(stub) {
        super(stub);
        this.stablecoins = ['USDT','BUSD'];          // Stablecoins supported on this exchange
        this.order_sizing = 'base';                  // Exchange requires base size for orders
        this.collateral_assets = ['USDT','BUSD'];    // Assets that are used for collateral
        this.balances_market_map = '{currency}/USDT' // Which market to use to convert non-USD balances to USD
        this.param_map = {                           // Order parameter mappings
            limit             : 'LIMIT',
            market            : 'MARKET',
            stoploss_limit    : 'STOP_LOSS_LIMIT',
            stoploss_market   : 'STOP_LOSS_LIMIT',   // Market stops are not supported by the Binance Spot API, even through their documentation says it is
            takeprofit_limit  : 'TAKE_PROFIT_LIMIT', 
            takeprofit_market : 'TAKE_PROFIT',
            trailing_stop     : null, 
            post              : null,                // TODO
            reduce            : 'reduceOnly',
            ioc               : null,                // TODO
            tag               : null,                // TODO
            trigger           : 'stopPrice',
        };
    }

    
    // Get available equity in USD for placing an order on a specific symbol using size as a factor of equity (size=1x)

    async available_equity_usd(symbol) {
        return await this.free_balance_usd();
    }


    // Get list of markets from exchange

    async markets() {
        if (this.data.markets != null) {
            return this.data.markets;
        }
        await this.fetch_tickers();
        let results = await this.ccxt('fetch_markets')
        var raw_markets = results;
        this.data.markets = [];
        raw_markets
            .filter(raw_market => raw_market.active == true)
            .forEach(raw_market => {
                const id = raw_market.id;
                const symbol = raw_market.symbol;
                const type = 'spot';
                const base = raw_market.base;
                const quote = raw_market.quote;
                var ticker = this.data.tickers.hasOwnProperty(id) ? this.data.tickers[id] : null;
                const bid = ticker != null ? ticker.bid : null;
                const ask = ticker != null ? ticker.ask : null;
                const expiration = (raw_market.expiration != null ? raw_market.expiration : null);
                const contract_size = (raw_market.info.contractSize != null ? raw_market.info.contractSize : 1);
                const precision = raw_market.precision;
                const raw = raw_market.info;
                const market = new this.classes.market(id, symbol, type, base, quote, bid, ask, expiration, contract_size, precision, raw)
                this.data.markets.push(market);
            });
        await this.index_markets();
        await this.update_markets_usd_price();
        return this.data.markets;
    }

    
    // Get open orders

    async open_orders(params) {
        var [symbol, since, limit] = this.utils.extract_props(params, ['symbol', 'since', 'limit']);
        let raworders = await this.ccxt('fetch_open_orders',[symbol, since, limit]);
        return this.parse_orders(raworders);
    }

    // Get all order history

    async all_orders(params) {
        var [symbol, since, limit] = this.utils.extract_props(params, ['symbol', 'since', 'limit']);
        let raworders = await this.ccxt('fetch_orders',[symbol, since, limit]);
        return this.parse_orders(raworders);
    }

    // Cancel orders

    async cancel(params) {
        var [symbol, id] = this.utils.extract_props(params, ['symbol', 'id']);
        var orders = await this.open_orders({symbol: symbol});
        if (id.toLowerCase() == 'all') {
            let cancel = await this.ccxt('cancel_all_orders',[symbol]);
            orders.forEach((order, idx) => {
                order.status = 'cancelled';
                orders[idx] = order;
            })   
        } else {
            orders = orders.filter(order => ['all',order.id].includes(id));
            await orders.forEach(async (order) => {
                var id = order.id;
                let orders = await this.ccxt('cancel_order',[{market: symbol, id: id}]);
            });
            orders.forEach((order, idx) => {
                order.status = 'cancelled';
                orders[idx] = order;
            })    
        }
        return orders;
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
        const status = order.status.replace('CANCELED', 'cancelled');   // Fix spelling error
        const raw = order.info;
        return new this.classes.order(market, id, timestamp, type, direction, price, trigger, size_base, size_quote, filled_base, filled_quote, status, raw);
    }


}
