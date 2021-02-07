frostybot_exchange_binance_base = require('./exchange.binance.base');

module.exports = class frostybot_exchange_binance_futures extends frostybot_exchange_binance_base {

    // Class constructor

    constructor(stub) {
        super(stub);
        this.stablecoins = ['USDT','BUSD'];          // Stablecoins supported on this exchange
        this.order_sizing = 'base';                  // Exchange requires base size for orders
        this.collateral_assets = ['USDT','BUSD'];    // Assets that are used for collateral
        this.balances_market_map = '{currency}USDT'  // Which market to use to convert non-USD balances to USD
        this.param_map = {                           // Order parameter mappings
            limit             : 'LIMIT',
            market            : 'MARKET',
            stoploss_limit    : 'STOP',
            stoploss_market   : 'STOP_MARKET',
            takeprofit_limit  : 'TAKE_PROFIT', 
            takeprofit_market : 'TAKE_PROFIT_MARKET',
            trailing_stop     : 'TRAILING_STOP_MARKET', 
            post              : null,                // TODO
            reduce            : 'reduceOnly',
            ioc               : null,                // TODO
            tag               : null,                // TODO
            trigger           : 'stopPrice',
        };
    }

    // Custom params

    async custom_params(type, order_params, custom_params) {
        /*
        if (!order_params.hasOwnProperty('params')) {
            order_params.params = {};
        }
        var position_mode = await this.ccxtobj.fapiPrivateGetPositionSideDual();
        var dual = position_mode.hasOwnProperty('dualSidePosition') ? position_mode.dualSidePosition : false;
        */
        return order_params;
    }    

    // Set leverage for symbol

    async leverage(params) {
        var [symbol, type, leverage] = this.utils.extract_props(params, ['symbol', 'type', 'leverage']);
        await this.markets();
        var market = await this.get_market_by_id_or_symbol(symbol);
        symbol = market.id;
        var type = (type == 'cross' ? 'CROSSED' : (type == 'isolated' ? 'ISOLATED' : null));
        var leverage = leverage.toLowerCase().replace('x', '');
        await this.ccxt('fapiPrivate_post_margintype', { symbol: symbol, marginType: type});
        var leverageResult = await this.ccxt('fapiPrivate_post_leverage', { symbol: symbol, leverage: leverage});
        if ((leverageResult.hasOwnProperty('leverage')) && (leverageResult.leverage == leverage)) {
            return true;
        } else {
            return false;
        }
    }

    // Get available equity in USD for placing an order on a specific symbol using size as a factor of equity (size=1x)

    async available_equity_usd(symbol) {
        return await this.free_balance_usd();
    }

    // Get list of current positions

    async positions() { 
        this.set_cache_time('fapiPrivate_get_positionrisk', 5);
        let raw_positions = await this.execute('fapiPrivate_get_positionrisk');
        await this.markets();
        // Get futures positions
        var positions = []; 
        await raw_positions
            .filter(raw_position => raw_position.positionAmt != 0)
            .forEach(async raw_position => {
                const symbol = raw_position.symbol;
                const market = await this.get_market_by_id(symbol);
                const direction = (raw_position.positionAmt > 0 ? 'long' : (raw_position.positionAmt <  0 ? 'short' : 'flat'));
                const base_size = (raw_position.positionAmt * 1);
                const entry_price = (raw_position.entryPrice * 1);
                const liquidation_price = this.utils.is_numeric(raw_position.liquidationPrice) ? (raw_position.liquidationPrice * 1) : null;
                const raw = raw_position;
                const position = new this.classes.position_futures(market, direction, base_size, null, entry_price, liquidation_price, raw);
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
        await this.fetch_tickers();
        let results = await this.ccxt('fetch_markets')
        var raw_markets = results;
        this.data.markets = [];
        raw_markets
            .filter(raw_market => raw_market.active == true && raw_market.info.contractType.toLowerCase() == 'perpetual')
            .forEach(raw_market => {
                const id = raw_market.id;
                const symbol = raw_market.symbol;
                const tvsymbol = 'BINANCE:' + raw_market.symbol.replace('-','').replace('/','');
                const type = 'futures';
                const base = raw_market.base;
                const quote = raw_market.quote;
                var ticker = this.data.tickers.hasOwnProperty(id) ? this.data.tickers[id] : null;
                const bid = ticker != null ? ticker.bid : null;
                const ask = ticker != null ? ticker.ask : null;
                const expiration = (raw_market.expiration != null ? raw_market.expiration : null);
                const contract_size = (raw_market.info.contractSize != null ? raw_market.info.contractSize : 1);
                const price_filter  = this.utils.filter_objects(raw_market.info.filters, {filterType: 'PRICE_FILTER'} );
                const amount_filter = this.utils.filter_objects(raw_market.info.filters, {filterType: 'LOT_SIZE'} );
                const precision = {
                    price: (price_filter[0].tickSize * 1),
                    amount: (amount_filter[0].stepSize * 1)
                }
                const raw = raw_market.info;
                const market = new this.classes.market(id, symbol, type, base, quote, bid, ask, expiration, contract_size, precision, tvsymbol, raw)
                this.data.markets.push(market);
            });
        await this.index_markets();
        await this.update_markets_usd_price();
        return this.data.markets;
    }


    // Fetch tickers

    async fetch_tickers() {
        var results = {};
        this.data.tickers = {};
        this.set_cache_time('fapiPublic_get_ticker_bookticker', 10);
        var tickersRaw = await this.ccxt('fapiPublic_get_ticker_bookticker')
        for (var i = 0; i < tickersRaw.length; i++) {
            var tickerRaw = tickersRaw[i];
            var symbol = tickerRaw.symbol;
            results[symbol] = {
                bid: this.utils.is_numeric(tickerRaw.bidPrice) ? tickerRaw.bidPrice * 1 : null,
                ask: this.utils.is_numeric(tickerRaw.askPrice) ? tickerRaw.askPrice * 1 : null,
            }
        }
        this.data.tickers = results;
        return results;
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
        const timestamp = order.info.updateTime;
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
