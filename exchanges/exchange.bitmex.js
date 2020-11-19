frostybot_exchange_base = require('./exchange.base');

module.exports = class frostybot_exchange_bitmex extends frostybot_exchange_base {

    // Class constructor

    constructor(stub) {
        super(stub);
        this.stablecoins = ['USD', 'USDT'];   // Stablecoins supported on this exchange
        this.order_sizing = 'quote';          // Exchange requires base size for orders
        this.collateral_assets = ['XBT'];     // Assets that are used for collateral
        this.balances_market_map = '{currency}/USD'  // Which market to use to convert non-USD balances to USD
        this.param_map = {                   // Order parameter mappings
            limit             : 'Limit',
            market            : 'Market',
            stoploss_limit    : 'StopLimit',
            stoploss_market   : 'Stop',
            takeprofit_limit  : 'Limit', 
            takeprofit_market : 'Limit',
        };
        this.trigger_map = {
            'mark'  : 'MarkPrice',
            'last'  : 'LastPrice',
            'index' : 'IndexPrice'
        }
    }

    // Get order parameters

    custom_params(type, order_params, custom_params) {
        if (!order_params.hasOwnProperty('params')) {
            order_params.params = {};
        }
        switch (type) {
            case 'stoploss'         :   order_params.params.stopPx = custom_params.trigger
                                        order_params.params.execInst = custom_params.reduce ? "ReduceOnly" : "Close"
                                        order_params.params.execInst += "," + this.trigger_map[custom_params.triggertype]
                                        break
            case 'takeprofit'       :   order_params.price = order_params.price == null ? custom_params.trigger : null
                                        //order_params.params.execInst = custom_params.reduce ? "Close" : ""
                                        break
            default                 :   order_params.params.execInst = custom_params.post ? "ParticipateDoNotInitiate" : ""
        }
        return order_params
    }

    // Get available equity in USD for placing an order on a specific symbol using size as a factor of equity (size=1x)

    async available_equity_usd(symbol) {
        return await this.free_balance_usd();
    }

    // Get list of current positions

    async positions() { 
        let results = await this.ccxt('private_get_position');
        var raw_positions = results;
        await this.markets();
        var positions = []; 
        if (raw_positions != undefined) {
            await raw_positions
                .filter(raw_position => raw_position.homeNotional != 0)
                .forEach(async raw_position => {
                    const symbol = raw_position.symbol;
                    const market = await this.get_market_by_id(symbol);
                    const direction = (raw_position.homeNotional == 0 ? 'flat' : (raw_position.homeNotional > 0 ? 'long' : 'short'));
                    const base_size = Math.abs(raw_position.homeNotional);
                    const entry_price = raw_position.avgEntryPrice;
                    const liquidation_price = raw_position.liquidationPrice;
                    const raw = raw_position;
                    const position = new this.classes.position_futures(market, direction, base_size, null, entry_price, liquidation_price, raw);
                    positions.push(position)
                })
        }
        this.positions = positions;
        return this.positions;
    }

    // Get list of markets from exchange

    async markets() {
        if (this.data.markets != null) {
            return this.data.markets;
        }
        let results = await this.ccxt('fetch_markets');
        var raw_markets = results;
        this.data.markets = [];
        raw_markets
            .filter(raw_market => raw_market.active == true)
            //.filter(raw_market => raw_market.info.typ == 'FFWCSX')
            .forEach(raw_market => {
                const id = raw_market.id;
                const symbol = raw_market.symbol;
                const tvsymbol = 'BITMEX:' + raw_market.id;
                const type = raw_market.info.type;
                const base = raw_market.base;
                const quote = raw_market.quote;
                const bid = raw_market.info.bidPrice;
                const ask = raw_market.info.askPrice;
                const expiration = (raw_market.info.expiry != null ? raw_market.info.expiry : null);
                const contract_size = (raw_market.info.contractSize != null ? raw_market.info.contractSize : 1);
                const precision = raw_market.precision;
                const raw = raw_market.info;
                const market = new this.classes.market(id, symbol, type, base, quote, bid, ask, expiration, contract_size, precision, tvsymbol, raw)
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
        const trigger = order.info.stopPx;
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
