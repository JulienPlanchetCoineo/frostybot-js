const frostybot_wss_client_base = require ('./wss.client.base');

module.exports = class frostybot_websocket_client_deribit extends frostybot_wss_client_base {

    // Constructor

    constructor (conf = {}) {
        super (conf);
        this.id = +new Date ();
        this.channels = {
            subscribe : '{type}/subscribe',
            unsubscribe : '{type}/unsubscribe',
            trades: '{channels: ["trades.{market}.raw"] }',
            ticker: '{channels: ["ticker.{market}.raw"] }',
            orders: '{channels: ["user.orders.future.any.raw"] }',
        }
    }

    // Get Next Command ID

    next_id () {
        return ++this.id;
    }

    // Format Command

    format_command(command, params) {
        return {
            jsonrpc: '2.0',
            method: command,
            id: this.next_id (),
            params: params
        }
    }

    // Authenticate websocket client

    async authenticate () {
        if (!this.connected) {
            await this.connect ();
        }
        await this.send ('public/auth', {grant_type: 'client_credentials', client_id: this.apikey, client_secret: this.secret} );
    }


  
}