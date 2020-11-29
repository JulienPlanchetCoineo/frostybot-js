// Deribit Websocket Normalizer

const frostybot_websocket = require ('./websocket.base');

class frostybot_websocket_client_deribit extends frostybot_websocket.client {
  constructor (conf = {}) {
    super (conf);
  }

  // Authenticate websocket client

  async authenticate () {
    if (!this.connected) {
      await this.connect ();
    }

    const resp = await this.sendMessage ({
      jsonrpc: '2.0',
      method: 'public/auth',
      id: this.nextId (),
      params: {
        grant_type: 'client_credentials',
        client_id: this.apikey,
        client_secret: this.secret,
      },
    });

    //setTimeout(await this.refreshTokenFn, 1000)
    //if(resp.error) {
    //  throw new Error(resp.error.message);
    //}

    /*
    this.token = resp.result.access_token;
    this.refreshToken = resp.result.refresh_token;
    this.authenticated = true;

    if(!resp.result.expires_in) {
      throw new Error('Deribit did not provide expiry details');
    }

    setTimeout(this.refreshTokenFn, resp.result.expires_in - 10 * 60 * 1000);
    */
  }

  // Refresh auth token

  async refreshTokenFn () {
    await this.sendMessage ({
      jsonrpc: '2.0',
      method: 'public/auth',
      id: +new Date (),
      params: {
        grant_type: 'refresh_token',
        refresh_token: this.refreshToken,
      },
    });

    //this.token = resp.result.access_token;
    //this.refreshToken = resp.result.refresh_token;

    //if(!resp.result.expires_in) {
    //  throw new Error('Deribit did not provide expiry details');
    //}

    //setTimeout(this.refreshTokenFn, resp.result.expires_in - 10 * 60 * 1000);
  }

  // Subscribe to channel

  _subscribe (sub) {
    sub.done = new Promise (r => (sub.doneHook = r));

    switch (sub.channel) {
      case 'trades' : var channelname = sub.channel + '.' + sub.market + '.raw'; break;
      case 'ticker' : var channelname = sub.channel + '.' + sub.market + '.raw'; break;
      case 'orders' : var channelname = 'user.orders.future.any.raw'; break;
    }

    const message = {
      jsonrpc: '2.0',
      method: `${sub.type}/subscribe`,
      params: {
        channels: [channelname],
      },
      id: this.nextId (),
    };

    return this.sendMessage (message);
  }

  // Unsubscribe to channel

  _unsubscribe (sub) {
    sub.done = new Promise (r => (sub.doneHook = r));

    switch (sub.channel) {
      case 'trades' : var channelname = sub.channel + '.' + sub.market + '.raw'; break;
      case 'ticker' : var channelname = sub.channel + '.' + sub.market + '.raw'; break;
      case 'orders' : var channelname = 'user.orders.future.any.raw'; break;
    }

    const message = {
      jsonrpc: '2.0',
      method: `${sub.type}/unsubscribe`,
      params: {
        channels: [channelname],
      },
      id: this.nextId (),
    };

    return this.sendMessage (message);
  }

}

module.exports = class frostybot_websocket_deribit  extends frostybot_websocket.base {

  constructor (stub, account) {
    super (stub, account);
    this.ticker = {};
    this.ws = new frostybot_websocket_client_deribit ({
      exchange: 'deribit',
      stub: stub,
      apikey: this.apikey,
      secret: this.secret,
      url: 'wss://' + this.url.replace ('https://', '') + '/ws/api/v2',
    });
  }

  parse_refresh_token (message) {
    this.ws.token = message.result.access_token;
    this.ws.refreshToken = message.result.refresh_token;
    this.authenticated = true;
    if (!message.result.expires_in) {
      throw new Error ('Deribit did not provide expiry details');
    }
    //setTimeout(this.ws.refreshTokenFn, 1000);
    return [];
    //setTimeout(this.ws.refreshTokenFn, message.result.expires_in - 10 * 60 * 1000);
  }

  parse_channel_trades (message) {
    var results = [];
    if (message.params.channel.indexOf ('trades.') == 0) {
      for (var i = 0; i < message.params.data.length; i++) {
        var trade = message.params.data[i];
        const exchange = message.frostybot.exchange;
        const stub = message.frostybot.stub;
        const timestamp = trade.timestamp;
        const symbol = trade.instrument_name;
        const side = trade.direction;
        const base = trade.amount / trade.price;
        const quote = trade.amount;
        const price = trade.price;
        results.push (
          new this.classes.websocket_trade (
            exchange,
            stub,
            timestamp,
            symbol,
            side,
            base,
            quote,
            price
          )
        );
      }
    }
    return results;
  }

  parse_channel_ticker (message) {
    var results = [];
    if (message.params.channel.indexOf ('ticker.') == 0) {
      var ticker = message.params.data;
      const exchange = message.frostybot.exchange;
      const stub = message.frostybot.stub;
      const timestamp = ticker.timestamp;
      const symbol = ticker.instrument_name;
      const bid = ticker.best_bid_price;
      const ask = ticker.best_ask_price;
      if (!this.ticker.hasOwnProperty(symbol)) {
        this.ticker[symbol] = { bid: null, ask: null}
      }
      if ((bid != this.ticker[symbol].bid) || (ask != this.ticker[symbol].ask)) {
        var tickerObj = new this.classes.websocket_ticker (
            exchange,
            stub,
            timestamp,
            symbol,
            bid,
            ask,
        );
        results.push(tickerObj)
        this.ticker[symbol] = tickerObj;
      }
    }
    return results;
  }

  parse_channel_orders (message) {
    var results = [];
    if (message.params.channel.indexOf ('user.orders.future.any.raw') == 0) {
      var order = message.params.data;
      const exchange = message.frostybot.exchange;
      const stub = message.frostybot.stub;
      const symbol = order.instrument_name;
      const id = order.order_id;
      const timestamp = order.last_update_timestamp;
      const type = order.order_type;
      const direction = order.direction;
      order.price = order.price == 'market_price'
        ? order.stop_price
        : order.price;
      const price = order.price;
      const trigger = order.stop_price != undefined ? order.stop_price : null;
      const size_base = order.amount / order.price;
      const size_quote = order.amount;
      const filled_base = order.filled_amount == 0
        ? 0
        : order.filled_amount / order.average_price;
      const filled_quote = order.filled_amount;
      const status = order.order_state;
      results.push (
        new this.classes.websocket_order (
          exchange,
          stub,
          symbol,
          id,
          timestamp,
          type,
          direction,
          price,
          trigger,
          size_base,
          size_quote,
          filled_base,
          filled_quote,
          status,
          order
        )
      );
    }
    return results;
  }

  parse (message) {
    if (message.result != undefined && message.result.token_type != undefined) {
      var results = this.parse_refresh_token (message);
    }
    if (message.method === 'subscription') {
      if (message.params.channel.indexOf ('trades.') == 0)
        var results = this.parse_channel_trades (message);
      if (message.params.channel.indexOf ('ticker.') == 0)
        var results = this.parse_channel_ticker (message);
      if (message.params.channel.indexOf ('user.orders.future.any.raw') == 0)
        var results = this.parse_channel_orders (message);
    } else {
      var results = [JSON.stringify (message)];
      var results = [];
    }
    if (!Array.isArray(results)) {
      results = [results];
    }
    return results;
    results.forEach (result => {
      global.frostybot.wss.emit('proxy', result)
    });
  }
};


