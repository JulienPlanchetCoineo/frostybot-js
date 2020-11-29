// Websocket Normalizer base class

class frostybot_websocket_base {

  constructor (stub, account) {
    this.load_modules ();
    this.stub = stub;
    if (account) {
      this.account = this.accounts.ccxtparams (account);
      this.apikey = this.account.parameters.apiKey;
      this.secret = this.account.parameters.secret;
      this.url = this.account.parameters.urls.api;
      this.testnet = String (this.account.parameters.testnet) == 'true'
        ? true
        : false;
    }
  }

  // Create module shortcuts

  load_modules () {
    Object.keys (global.frostybot._modules_).forEach (module => {
      if (!['core'].includes (module)) {
        this[module] = global.frostybot._modules_[module];
      }
    });
  }

  // Load Event Handler

  load_events () {
    if (!global.frostybot.hasOwnProperty ('wss')) global.frostybot.wss = {};
    global.frostybot.wss.events = new frostybot_wss_events ();
    global.frostybot.wss.events.on ('event', args => {
    });
  }

  // Subscribe to channel 

  async subscribe(channel, symbol) {
    var type = (['orders'].includes(channel)) ? 'private' : 'public';
    await this.ws.connect();
    await this.ws.authenticate();
    this.ws.subscribe(type, channel, symbol);
    var out = {
        'stub': this.stub,
        'channel': channel
    }
    if (symbol != null) out.symbol = symbol;
    this.output.debug('ws_subscribe', this.utils.serialize_object(out))
    return true;
  }

  // Unsubscribe to channel 

  async unsubscribe(channel, symbol) {
    var type = (['orders'].includes(channel)) ? 'private' : 'public';
    await this.ws.connect();
    await this.ws.authenticate();
    this.ws.unsubscribe(type, channel, symbol);
    var out = {
        'stub': this.stub,
        'channel': channel
    }
    if (symbol != null) out.symbol = symbol;
    this.output.debug('ws_unsubscribe', this.utils.serialize_object(out))
    return true;
  }


}

const WebSocket = require ('ws');
const crypto = require ('crypto');
const EventEmitter = require ('events');

class frostybot_websocket_client extends EventEmitter {
  /*
    const WebSocket = require('ws');
    const EventEmitter = require('events');
    const crypto = require('crypto');
    
    const wait = n => new Promise(r => setTimeout(r, n));
    
    const PONG = '{"type": "pong"}';
    
    const STALE_TIMEOUT = 2000;
    
    // this endpoint is used by the sample code on
    // https://github.com/ftexchange/ftx/blob/d387304bcc6f479e0ecae8273ad84eda986f5237/websocket/client.py#L13
    const DEFAULT_ENDPOINT = 'ftx.com/ws/';
    */

  // pass optional params: { key, secret, subaccount, endpoint }
  constructor (conf = {}) {
    super ();

    this.exchange = conf.exchange;
    this.stub = conf.stub;
    this.url = conf.url;
    this.apikey = conf.apikey;
    this.secret = conf.secret;
    this.subaccount = conf.subaccount;

    this.connected = false;
    this.isReadyHook = false;
    this.isReady = new Promise (r => (this.isReadyHook = r));
    this.authenticated = false;
    this.reconnecting = false;
    this.afterReconnect;

    this.subscriptions = {};
    this.inflightQueue = [];

    this.lastMessageAt = 0;
    this.id = +new Date ();
  }

  nextId () {
    return ++this.id;
  }

  wait (n) {
    return new Promise (r => setTimeout (r, n));
  }

  _connect () {
    if (this.connected) {
      return;
    }

    return new Promise ((resolve, reject) => {
      this.ws = new WebSocket (`${this.url}`);
      this.ws.exchange = this.exchange;
      this.ws.stub = this.stub;
      this.ws.onmessage = this.messagehandler;

      this.ws.onopen = () => {
        this.connected = true;
        this.isReadyHook ();
        resolve ();
      };

      this.ws.onclose = async e => {
        this.authenticated = false;
        this.connected = false;
        //clearInterval(this.heartbeat);
        this.reconnect ();
      };

      //this.heartbeat = setInterval(this.ping, 5 * 1000);
    });
  }

  findRequest (id) {
    for (let i = 0; i < this.inflightQueue.length; i++) {
      const req = this.inflightQueue[i];
      if (id === req.id) {
        this.inflightQueue.splice (i, 1);
        return req;
      }
    }
  }

  async terminate () {
    this.ws.terminate ();
    this.authenticated = false;
    this.connected = false;
  }

  async reconnect () {
    this.reconnecting = true;
    this.pingAt = false;
    this.pongAt = false;

    let hook;
    this.afterReconnect = new Promise (r => (hook = r));
    this.isReady = new Promise (r => (this.isReadyHook = r));
    await this.wait (500);
    await this.connect ();
    hook ();
    this.isReadyHook ();

    Object.values(this.subscriptions).forEach (sub => {
      this._subscribe (sub);
    });
  }

  async connect () {
    await this._connect ();
    if (this.apikey) {
      this.authenticate ();
    }
  }

  // not a proper op, but forces a response so
  // we know the connection isn't stale

  /*
      ping() {
        if(this.pingAt && this.pongAt > this.pingAt && this.pongAt - this.pingAt > STALE_TIMEOUT) {
          console.error(new Date, '[FTX] did NOT receive pong in time, reconnecting', {
            pingAt: this.pingAt,
            pongAt: this.pongAt
          });
          return this.terminate();
        }
    
        this.pingAt = +new Date;
    //    this.sendMessage({op: 'ping'});
      }
    
      // note: when this method returns
      // we do not know what auth status is
      // since FTX doesn't ACK
      */

  messagehandler (e) {
    this.lastMessageAt = +new Date ();
    let payload;

    try {
      payload = JSON.parse (e.data);
    } catch (e) {
      console.error ('Websocket sent bad json', e.data);
    }

    //payload.stub = 'STUB' + this.stub;
    payload.frostybot = {
      exchange: this.exchange,
      stub: this.stub,
    };

    /*
        if (payload.id != undefined) {
            const request = this.findRequest(payload.id);

            if(!request) {
            return console.error('received response to request not send:', payload);
            }
        }
        */

    global.frostybot._modules_.websocket.message (payload);
  }

  toId (type, channel, market) {
    return type + '|' + channel + (!market ? '' : '|' + market);
  }

  async sendMessage (payload) {
    if (!this.connected) {
      if (!this.reconnecting) {
        throw new Error ('Not connected.');
      }

      await this.afterReconnect;
    }
    this.ws.send (JSON.stringify (payload));
  }

  async subscribe (type, channel, market = undefined) {
    const id = this.toId (type, channel, market);
    if (!this.connected) {
      if (!this.reconnecting) {
        throw new Error ('Not connected.');
      }

      await this.afterReconnect;
    }

    /*
    if (this.subscriptions.hasOwnProperty(id)) {
        return console.error (
        new Date (),
        'refusing to channel subscribe twice',
        market,
        channel
      );
    }
    */  

    const sub = {
      id,
      type,
      channel,
      market,
      doneHook: false,
      done: false,
    };

    this.subscriptions[id] = sub;
    this._subscribe (sub);

    return sub.done;
  }

  async unsubscribe (type, channel, market = undefined) {
    const id = this.toId (type, channel, market);

    if (!this.connected) {
      if (!this.reconnecting) {
        throw new Error ('Not connected.');
      }

      await this.afterReconnect;
    }

    const sub = {
      id,
      type,
      channel,
      market,
      doneHook: false,
      done: false,
    };

    if (this.subscriptions.hasOwnProperty(id)) {
        this._unsubscribe (sub);
        delete this.subscriptions[id];
    }

    return sub.done;
  }

}


module.exports = {
  base: frostybot_websocket_base,
  client: frostybot_websocket_client,
};
