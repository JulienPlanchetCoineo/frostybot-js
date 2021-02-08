// API Routes

module.exports = {

    // Simple Webhook API

    '/frostybot' : {

        'post|/'                            :   'this:execute',     // Catch-all router for /frostybot Webhook
        'post|/:uuid'                       :   'this:execute',     // Catch-all router for /frostybot/:uuid Webhook (Multi User)
        'get|/status'                       :   'output:status',    // Health Status (Used for Load Balancers)

    },

    // Full REST API

    '/rest'      : {

        // Account Handling

        'get|/accounts'                     :   'accounts:get',     // Get all accounts
        'get|/accounts/:stub'               :   'accounts:get',     // Get specific account
        'post|/accounts'                    :   'accounts:add',     // Create new account
        'post|/accounts/:stub/test'         :   'accounts:test',    // Test account api keys
        'put|/accounts'                     :   'accounts:add',     // Update account
        'delete|/accounts/:stub'            :   'accounts:delete',  // Delete account

        // Cache Handling

        'delete|/cache/flush'               :   'cache:flush',      // Flush the cache
        'get|/cache/stats'                  :   'cache:stats',      // Retrieve cache statistics

        // Configuration

        'get|/config/:key'                  :   'config:get',       // Get configuration setting
        'post|/config/:key'                 :   'config:set',       // Set configuration setting

        // Symbol Map Handling

        'get|/symbolmap/:exchange'          :   'symbolmap:get',    // Retrieve all symbol mapping for an exchange
        'get|/symbolmap/:exchange/:symbol'  :   'symbolmap:get',    // Retrieve specific symbol mapping for an exchange and symbol
        'post|/symbolmap/:exchange'         :   'symbolmap:add',    // Create new symbol mapping for an exchange
        'put|/symbolmap/:exchange'          :   'symbolmap:add',    // Update symbol mapping for an exchange
        'delete|/symbolmap/:exchange/:symbol' : 'symbolmap:delete', // Delete specific symbol mapping for an exchange and symbol

        // Whitelist Handling

        'get|/whitelist'                    :   'whitelist:get',    // Get all whitelist entries
        'get|/whitelist/:ip'                :   'whitelist:get',    // Get whitelist entry for specific IP address
        'get|/whitelist/verify/:ip'         :   'whitelist:verify', // Verify that an IP is whitelisted
        'post|/whitelist/enable'            :   'whitelist:enable', // Globally enable whitelsit verification
        'post|/whitelist/disable'           :   'whitelist:disable',// Globally disable whitelsit verification
        'post|/whitelist'                   :   'whitelist:add',    // Add a whitelist entry
        'post|/whitelist'                   :   'whitelist:add',    // Add a whitelist entry
        'put|/whitelist'                    :   'whitelist:add',    // Update a whitelist entry
        'delete|/whitelist/:ip'             :   'whitelist:delete', // Delete whitelist entry for specific IP address

        // User Handling

        //'post|/user/multiuser_enable'       :   'user:multiuser_enable',   // Enable Multi-User Mode (MySQL Required)
        //'post|/user/multiuser_disable'      :   'user:multiuser_disable',  // Disable Multi-User Mode (MySQL Required)

        // Trading

        'get|/trade/:stub/balances'         :   'trade:balances',   // Get balances
        'get|/trade/:stub/positions'        :   'trade:positions',  // Get positions
        'get|/trade/:stub/orders'           :   'trade:orders',     // Get order
        'get|/trade/:stub/markets'          :   'trade:markets',    // Get markets
        'get|/trade/:stub/position'         :   'trade:position',   // Get position for specific filter (symbol=BTC-PERP)
        'get|/trade/:stub/order'            :   'trade:order',      // Get orders for specific filter (status=open)
        'get|/trade/:stub/market'           :   'trade:market',     // Get market for specific filter (symbol=ETH-PERP)
        'post|/trade/:stub/long'            :   'trade:long',       // Create long order
        'post|/trade/:stub/short'           :   'trade:short',      // Create short order
        'post|/trade/:stub/buy'             :   'trade:buy',        // Create buy order
        'post|/trade/:stub/sell'            :   'trade:sell',       // Create sell order
        'post|/trade/:stub/close'           :   'trade:close',      // Create close order
        'post|/trade/:stub/stoploss'        :   'trade:stoploss',   // Create stoploss order
        'post|/trade/:stub/takeprofit'      :   'trade:takeprofit', // Create takeprofit order
        'post|/trade/:stub/trailstop'       :   'trade:trailstop',  // Create trailstop order
        'post|/trade/:stub/leverage'        :   'trade:leverage',   // Configure leverage settings for symbol (Binance Futures only)
        'delete|/trade/:stub/order/:id'     :   'trade:cancel',     // Cancel specific order ID
        'delete|/trade/:stub/orders'        :   'trade:cancelall',  // Cancel all orders

        // Signal Provider Signals

        'post|/signal/send'                 :   'signals:send',     // Send signal provider signal
        'post|/signals/send'                :   'signals:send',     // Send signal provider signal

        // Websocket Management

        'post|/websocket/:stub/subscribe/:channel'  :   'websocket:subscribe',  // Subscrive to websocket channel

    },

}

