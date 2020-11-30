// Websocket Server

frostybot_websocket_ftx = require('../exchanges/websocket.ftx')
frostybot_websocket_deribit = require('../exchanges/websocket.deribit')

const frostybot_module = require('./mod.base')

module.exports = class frostybot_websocket_module extends frostybot_module {

  // Constructor

  constructor() {
      super()
  }


  // Initialize Module

  initialize() {
      this.connect_all();
  }


  // Load all account stubs and connect to the relevant websocket APIs

  async connect_all() {
      var accounts = await this.accounts.get()
      var stubs = Object.keys(accounts);
      if (!this.hasOwnProperty('ws')) {
        this.ws = {}
      }
      for (var i = 0; i < stubs.length; i++) {
        var stub = stubs[i];
        await this.connect_stub(stub)
      }
      //var account = this.accounts.getaccount('deribit');
      var account = false
      if (account != false) {
        var params = this.accounts.ccxtparams(account);
        var conf = {
          exchange: 'deribit',
          stub: 'deribit',
          apikey: params.parameters.apiKey,
          secret: params.parameters.secret,
          url: 'wss://' + params.parameters.urls.api.replace ('https://', '') + '/ws/api/v2',
        }
        const frostybot_wss_client_deribit = require('../exchanges/wss.client.deribit')
        this.ws['test'] = new frostybot_wss_client_deribit(conf)
        await this.ws['test'].connect()
        //this.ws['test'].subscribe('trades','BTC-PERPETUAL')
      }
  }


  // Load Websocket API for a specific stub

  async connect_stub(stub) {
      var account = this.accounts.getaccount(stub);
      var base_dir = this.utils.base_dir()
      if (['ftx'].includes(account.exchange)) {
        var frostybot_websocket = require(base_dir + '/exchanges/websocket.' + account.exchange)
        this.ws[stub] = new frostybot_websocket(stub, account)
      } 
  }

  // Websocket message receiver

  async message(params) {
    if (params.hasOwnProperty('frostybot')) {
      const stub = params.frostybot.stub;
      if (this.hasOwnProperty('ws')) {
        if (this.ws.hasOwnProperty(stub)) {
          var results = this.ws[stub].parse(params);
          results.forEach (result => {
            global.frostybot.wss.emit('proxy', result)
          });
        }
      }
    }
    
  }

  // Subscribe to channel

  async subscribe(params) {
    var [stub, channel, symbol] = this.utils.extract_props(params, ['stub', 'channel', 'symbol']);
    if (this.ws.hasOwnProperty(stub)) {
      return await this.ws[stub].subscribe(channel, symbol);
    }
    return false;
  }


  // Unsubscribe 

  async unsubscribe(params) {
    var [stub, channel, symbol] = this.utils.extract_props(params, ['stub', 'channel', 'symbol']);
    if (this.ws.hasOwnProperty(stub)) {
      return await this.ws[stub].unsubscribe(channel, symbol);
    }
    return false;
  }


}