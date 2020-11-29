// FTX Websocket Normalizer

const frostybot_websocket = require ('./websocket.base');

class frostybot_websocket_client_ftx extends frostybot_websocket.client {
  constructor (conf = {}) {
    conf.url = 'wss://ftx.com/ws/';
    super (conf);
  }

  // Authenticate websocket client

  async authenticate () {
    if (!this.connected) {
      await this.connect ();
    }

    const date = +new Date ();
    const crypto = require ('crypto');
    const signature = crypto
      .createHmac ('sha256', this.secret)
      .update (date + 'websocket_login')
      .digest ('hex');

    const message = {
      op: 'login',
      args: {
        key: this.apikey,
        sign: signature,
        time: date,
        subaccount: this.subaccount,
      },
    };
    this.sendMessage (message);

    this.authenticated = true;
  }

  // Subscribe to channel

  _subscribe (sub) {
    sub.done = new Promise (r => (sub.doneHook = r));

    const message = {
      op: 'subscribe',
      //market: (sub.market != null ? sub.market : undefined),
      channel: sub.channel,
    };

    if (sub.market != null) {
      message.market = sub.market
    }

    this.sendMessage (message);
  }

  // Unsubscribe from channel

  _unsubscribe (sub) {
    sub.done = new Promise (r => (sub.doneHook = r));

    const message = {
      op: 'unsubscribe',
      //market: (sub.market != null ? sub.market : undefined),
      channel: sub.channel,
    };

    if (sub.market != null) {
      message.market = sub.market
    }

    this.sendMessage (message);
  }


}

module.exports = class frostybot_websocket_ftx extends frostybot_websocket.base {

  constructor (stub, account) {
    super (stub, account);
    this.ticker = {};
    this.ws = new frostybot_websocket_client_ftx ({
      exchange: 'ftx',
      stub: stub,
      apikey: this.apikey,
      secret: this.secret,
      subaccount: this.subaccount != null ? this.subaccount : undefined,
    });
  }

  parse_channel_trades (message) {
    var results = [];
    if (message.type == 'update') {
      for (var i = 0; i < message.data.length; i++) {
        var trade = message.data[i];
        const exchange = message.frostybot.exchange;
        const stub = message.frostybot.stub;
        const timestamp = new Date (trade.time).valueOf ();
        const symbol = message.market;
        const side = trade.side;
        const base = trade.size;
        const quote = trade.size * trade.price;
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
    if (message.type == 'update') {
      var ticker = message.data;
      const exchange = message.frostybot.exchange;
      const stub = message.frostybot.stub;
      const timestamp = Math.floor(ticker.time * 1000);
      const symbol = message.market;
      const bid = ticker.bid;
      const ask = ticker.ask;
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
    if (message.type == 'update') {
      var order = message.data;
      const exchange = message.frostybot.exchange;
      const stub = message.frostybot.stub;
      const symbol = order.market;
      const id = order.id;
      const timestamp = + new Date()
      const type = order.type;
      const direction = order.side;
      const price = order.price;
      const trigger = null;
      const size_base = order.size;
      const size_quote = order.size * order.price;
      const filled_base = order.filledSize;
      const filled_quote = order.filledSize * order.avgFillPrice;
      const status = order.status;
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
    switch (message.channel) {
      case     'trades' : var results = this.parse_channel_trades (message); break;
      case     'ticker' : var results = this.parse_channel_ticker (message); break;
      case     'orders' : var results = this.parse_channel_orders (message); break;
      default           : var results = [];
      //default           : var results = [JSON.stringify (message)];
    }
    return results;
  }
};
