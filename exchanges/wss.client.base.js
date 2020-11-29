

const WebSocket = require ('ws');
const EventEmitter = require ('events');

module.exports = class frostybot_wss_client_base extends EventEmitter {

    // Constructor

    constructor( params = {} ) {
        super()
        this.uid = params.uid
        this.apikey = params.apikey
        this.secret = params.secret
        this.url = params.url
        
        this.connected = false
        this.authenticated = false
        this.reconnecting = false
        this.subscriptions = {}

        this.connect()
    }

    // On Message Handler

    onmessage_handler(message) {
        let payload;
        try {
          payload = JSON.parse (e.data);
        } catch (e) {
          console.error ('Websocket sent bad json', e.data);
        }
        payload.frostybot = {
          uid: this.uid
        };
        global.frostybot._modules_.websocket.message (payload);
    }

    // Connect Websocket Connection

    async connect () {

        if (this.connected) {
            return;
        }
        return new Promise ((resolve, reject) => {
            this.ws = new WebSocket (`${this.url}`);
            this.ws.uid = this.uid;
            this.ws.onmessage = this.onmessage_handler;
      
            this.ws.onopen = (e) => {
                this.connected = true;
                resolve ();
            };
      
            this.ws.onclose = async(e) => {
                this.authenticated = false;
                this.connected = false;
                //clearInterval(this.heartbeat);
                this.reconnect ();
            };
      
            //this.heartbeat = setInterval(this.ping, 5 * 1000);
         });

    }

    // Reconnect a dropped connection

    async reconnect () {
        this.reconnecting = true;
        await this.connect();
    
        //Object.values(this.subscriptions).forEach (sub => {
        //  this._subscribe (sub);
        //});
    }
    
    // Disconnect Websocket Connection

    disconnect () {
        this.ws.terminate ();
        this.authenticated = false;
        this.connected = false;
    }

    // Send Command

    send(command, params = {}) {
        if (this.connected) {
            var payload = this.format_command(command, params);
            this.ws.send(JSON.stringify(payload));
        }
    }

    async subscribe (type, channel, market = undefined) {
        const id =  type + '|' + channel + (!market ? '' : '|' + market)
    
        if (!this.connected) {
            await this.connect();
        }
    
        const sub = {
            id,
            type,
            channel,
            market,
        };
    
        var subscribe_command = this.channels.subscribe.replace('{type}', type);
        var subscribe_params = this.channels['channel'].replace('{market}', market);

        await this.send(this.format_command(subscribe_command, subscribe_params));
        this.subscriptions[id] = sub;
    
        return sub.done;
    }
    
    async unsubscribe (type, channel, market = undefined) {
        const id =  type + '|' + channel + (!market ? '' : '|' + market)

        if (!this.connected) {
            await this.connect();
        }
    
        const sub = {
            id,
            type,
            channel,
            market,
        };
    
        if (this.subscriptions.hasOwnProperty(id)) {
            var unsubscribe_command = this.channels.unsubscribe.replace('{type}', type);
            var unsubscribe_params = this.channels['channel'].replace('{market}', market);
            await this.send(this.format_command(unsubscribe_command, unsubscribe_params));
            delete this.subscriptions[id];
        }
    
        return sub.done;
    }
        

}