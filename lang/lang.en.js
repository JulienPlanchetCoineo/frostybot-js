// Language module for handling English (en) translations throughout the application

module.exports = {

    section: {

        frostybot_startup:  'Frostybot Startup',
        executing_command:  'Executing Command: {0}:{1}',

    },

    subsection: {

        order_long:         'Long Order',
        order_short:        'Short Order',
        order_buy:          'Buy Order',
        order_sell:         'Sell Order',
        order_stoploss:     'Stop Loss Order',
        order_takeprofit:   'Take Profit Order',
        order_trailstop:    'Trailing Stop Order',
        order_close:        'Close Order',
        processing_queue:   'Processing order queue: {0} order(s) queued',

    },

    debug: {

        custom_object:      '{0}: {1}',
        context_uuid:       'Context: {0}',
        trade_cmd_shortcut: 'Converting command shortcut \'{0}:{1}\' to \'trade:{0}:{1}\'',
        loaded_module:      'Loaded module: {0}',
        whitelist_verify:   'API Access Granted: {0} is whitelisted: {0}',
        whitelist_get:      'Retrieved IP address from the whitelist: {0}: {1}',
        symbolmap_get:      'Retrieved symbol mapping: {0}: {1} => {2}',
        convert_rel_price:  'Converted relative price: {0} => {1}',
        convert_size_usd:   'Size provided in USD on a stablecoin-paired asset. Using USD size as quote size.',
        convert_size_pair:  'Size provided in USD, using the following pairs for conversion: {0}',
        exchange_size_base: 'Exchange uses base sizing. Order size converted to {0}',
        exchange_size_quote:'Exchange uses quote sizing. Order size converted to {0}',
        convert_layered:    'Converted order parameters into {0} layered orders between {1} and {2}',
        order_side_assumed: 'Order side not provided, assuming {0} order.',
        order_size_factor:  'The size of {0} has been converted to {1}',
        order_sizing_type:  'Order size provided in {0} ({1} size)',
        close_exceeds_pos:  'The closing order size of {0} exceeds your current position, adjusting order size to {1}.',
        ws_subscribe:       'Subscribed to websocket channel: {0}',
        ws_unsubscribe:     'Unsubscribed from websocket channel: {0}',
        multiuser_createdb: 'Creating multi-tenant database tables (if required)',
        debug_noexecute:    'Order execution disabled, clearing queue',
        access_api_uuid:    'Access granted on API using uuid',
        access_local_core:  'Access granted on localhost using core uuid',
        access_gui_token:   'Access granted using verified token',
        access_api_core:    'Access granted on API using core uuid',
    },

    notice: {

        output_debug:       'Debug Output: {0}',
        using_language:     'Using Language: {0}',
        executing_command:  'Executing Command: {0}:{1}', 
        command_params:     'Command Parameters: {0}', 
        command_completed:  'Command Completed: Execution Time: {0} seconds',
        processing_queue:   'Processing order queue: {0} order(s) queued',
        processed_queue:    'Processed order queue:  {0}/{1} order(s) submitted successfully.',
        order_sizing_cur:   'Current position {0} size is: {1} {2}',
        order_sizing_tar:   'Target position {0} size is:  {1} {2}',
        order_sizing_ord:   'Order required to reach target: {0} {1} {2}',
        order_queued:       'Order added to queue: {0}',
        symbol_mapping:     'Using symbol mapping: {0}: {1} => {2}',
        whitelist_disabled: 'Whitelist verification is disabled',
        whitelist_enabled:  'Whitelist verification is enabled',
        whitelist_verify:   'API Access Granted: {0} is whitelisted',
        database_type:      'Database Type:  {0}',
        database_name:      'Database Name:  {0}',

    },

    warning: {

        testnet_not_avail:  'The exchange {0} does not have a testnet, using mainnet instead.',
        order_over_maxsize: 'The order size of {0} would exceed maxsize. Adjusting order size to {1}.',
        order_rel_close:    'The relative decrease requested is greater than your current position, closing position.',
        order_will_flip:    'The provided order sizing results in a position flip from {0} to {1}',
        order_flip_price:   'The {0} parameter was changed from {1} to {2}',
        maxsize_disabled:   'Warning ({0}/{1}): You have disabled the maxsize parameter requirement. You do so at your own risk!',
        config_get:          'Setting not configured: {0}',

    },

    error: {

        required_param:     'Parameter Required: {0}',  
        required_oneof:     'At least one of the following parameters is required: {0}',  
        param_val_oneof:    'The {0} parameter should be one of {1}',
        incorrect_type:     'Incorrect Type: {0}, Expected: {1}, Actual: {2}',  
        malformed_param:    'Malformed Parameter: {0}', 
        unknown_module:     'Unknown Module: {0}',
        unknown_method:     'Unknown Command: {0}',
        unknown_stub:       'Unknown Account: {0}. Please use accounts:add to add the account.',      
        unknown_market:     'Unknown Market: {0}. Please ensure that the market symbol is listed in \'trade:<stub>:markets\'.',      
        local_only:         'This command can only be executed from the CLI.',

        account_retrieve:   'Failed to retrieve account(s): {0}',
        account_create:     'Failed to create account: {0}',
        account_update:     'Failed to update account: {0}',
        account_delete:     'Failed to delete account: {0}',
        account_test:       'Cannot connect using these account settings',
        binance_req_type:   'The Binance exchange requires the type parameter (type=spot or type=futures)',

        encryption_failed:  'Failed to encrypt data',
        decryption_failed:  'Failed to decrypt data',

        cache_flush:        'Failed to flush cache',

        whitelist_get:      'Failed to get IP address(es) from the whitelist: {0}',
        whitelist_add:      'Failed to add IP address to the whitelist: {0}',
        whitelist_delete:   'Cannot delete IP address from the whitelist: {0}',
        whitelist_verify:   'API Access Denied: {0} is not whitelisted',
        whitelist_enable:   'Failed to enable whitelist verification',
        whitelist_disable:  'Failed to disabled whitelist verification',

        symbolmap_get:      'Failed to retrieve symbol mapping: {0}: {1}',
        symbolmap_add:      'Failed to add symbol mapping: {0}: {1} => {2}',
        symbolmap_delete:   'Failed to delete symbol mapping: {0}: {1}',
    
        convert_size_usd:   'Size provided in USD, but cannot find a pair to use for conversion',
        order_submit:       'Order submission failed: {0}',
        order_size_nan:     'Could not determine order size: {0}',
        order_size_unknown: 'Could not determine the size of the order',
        order_side_unknown: 'Unable to determine side for order',
        factor_only_size:   '% or X sizing only allowed on the size parameter',
        order_over_maxsize: 'The order size of {0} would exceed maxsize.',

        orders_retrieve:    'There was an error retrieving orders',
        order_cancel:       'Failed to cancel order {0}',
        orders_cancel:      'There was an error cancelling orders',
        order_size_exceeds: 'Already {0} more than requested',
        order_size_rel:     'Relative sizing (+/-) not permitted on {0} orders',
        order_rel_req_max:  'When using relative sizes on {0} orders, the maxsize parameter is required',
        order_scale_nopos:  'You cannot use the scale parameter because do not have a position on {0}',

        position_retrieve:  'You do not have a position on {0}',
        positions_retrieve: 'There was an error retrieving positions',
        position_none:      'You do not currently have a position on {0}',

        balancess_retrieve: 'There was an error retrieving balances',

        market_retrieve:     'Could not retrieve market info for {0}',
        markets_retrieve:    'There was an error retrieving markets',

        leverage_set:        'Unable to set leverage for symbol {0}',
        leverage_unsupported:'Setting leverage on this exchange is not currently supported',

        multiuser_mysql_req: 'Multi-tenant mode requires MySQL/MariaDB database',
        multiuser_enable:    'Failed to enable multi-user support',
        multiuser_disable:   'Failed to disable multi-user support',
        multiuser_add:       'Failed to add user: {0}',
        multiuser_delete:    'Failed to delete user: {0}',
        user_exists:         'The user already exists: {0}',
        user_register:       'Failed to reigster user: {0}',
        user_auth:           'User authentication failed: {0}',
        invalid_token:       'Invalid token provided',

        config_invalid_key:  'Invalid config key: {0}',
        config_invalid_value:'Invalid value for {0} (Must be {1})',
        config_set:          'Failed to configure setting: {0}: {1}',

        gui_enable:          'Failed to enable GUI',
        gui_disable:         'Failed to disable GUI',
        
    },

    success: {

        account_retrieve:   'Account(s) retrieved successfully: {0}',
        account_create:     'Account created successfully: {0}',
        account_update:     'Account updated successfully: {0}',
        account_delete:     'Account deleted successfully: {0}',
        account_test:       'Successfully tested account settings',

        cache_flush:        'Successfully flushed cache: {0} items deleted',
        cache_stats:        'Sucessfully retrieved cache stats: {0}',

        whitelist_add:      'Added IP address to the whitelist: {0}',
        whitelist_delete:   'Deleted IP address from the whitelist: {0}',
        whitelist_enable:   'Successfully enabled whitelist verification',
        whitelist_disable:  'Successfully disabled whitelist verification',

        symbolmap_add:      'Added symbol mapping: {0}: {1} => {2}',
        symbolmap_delete:   'Deleted symbol mapping: {0}: {1}',

        order_submit:       'Order submitted successfully: {0}',
        orders_retrieve:    '{0} Order(s) retrieved',
        order_cancel:       'Successfully cancelled order {0}',
        orders_cancel:      '{0} Order(s) cancelled',

        position_retrieve:  'Successfully retrieved position on {0}',
        positions_retrieve: '{0} Positions(s) retrieved',

        balances_retrieve:  '{0} Balances(s) retrieved',

        market_retrieve:    'Successfully retrieved market info for {0}',
        markets_retrieve:   '{0} Markets(s) retrieved',

        leverage_set:        'Successfully set leverage for symbol {0} to {1}x ({2})',

        config_get:         'Successfully retrieved setting: {0}',
        config_set:         'Successfully configured setting: {0}: {1}',

        multiuser_enable:   'Successfully enabled multi-user support',
        multiuser_disable:  'Successfully disabled multi-user support',
        multiuser_add:      'Added user: {0}',
        multiuser_delete:   'Deleted user: {0}',
        user_register:      'Successfully registered user: {0}',
        user_auth:          'User authenticated successfully: {0}',

        gui_enable:          'Successfully enabled GUI',
        gui_disable:         'Successfully disabled GUI',

    }
    
}