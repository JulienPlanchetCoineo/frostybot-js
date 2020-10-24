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

        stub_valid:         'The stub {0} refers to a valid account',
        whitelist_verify:   'Address is whitelisted: {0}. Allowing access to the API.',
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
        order_sizing_cur:   'Current position {0} size is: {1} {2}',
        order_sizing_tar:   'Target position {0} size is:  {1} {2}',
        order_sizing_ord:   'Order required to reach target: {0} {1} {2}',

    },

    notice: {

        using_language:     'Using Language: {0}',
        executing_command:  'Executing Command: {0}:{1}', 
        command_params:     'Command Parameters: {0}', 
        command_completed:  'Command Completed: Execution Time: {0} seconds',
        loaded_module:      'Loaded module: {0}',
        processing_queue:   'Processing order queue: {0} order(s) queued',
        processed_queue:    'Processed order queue:  {0}/{1} order(s) submitted successfully.',
        order_queued:       'Order queued: {0}',
        symbol_mapping:     'Using symbol mapping: {0}: {1} => {2}',
        whitelist_disabled: 'Whitelist verification is disabled',
        whitelist_enabled:  'Whitelist verification is enabled',
        whitelist_verify:   'IP Address {0} is whitelisted. Allowing access to the API',


    },

    warning: {

        testnet_not_avail:  'The exchange {0} does not have a testnet, using mainnet instead.',
        order_over_maxsize: 'The order size of {0} would exceed maxsize. Adjusting order size to {1}.',
        order_rel_close:    'The relative decrease requested is greater than your current position, closing position.',
        close_exceeds_pos:  'The closing order size of {0} exceeds your current position, adjusting order size to {1}.',
        order_will_flip:    'The provided order sizing results in a position flip from {0} to {1}',
        order_flip_price:   'The {0} parameter was changed from {1} to {2}',

    },

    error: {

        required_param:     'Parameter Required: {0}',  
        incorrect_type:     'Incorrect Type: {0}, Expected: {1}, Actual: {2}',  
        malformed_param:    'Malformed Parameter: {0}', 
        unknown_module:     'Unknown Module: {0}',
        unknown_method:     'Unknown Command: {0}',
        unknown_stub:       'Unknown account stub: {0}. Please use accounts:add to add the account.',      

        account_retrieve:   'Failed to retrieve account(s): {0}',
        account_create:     'Failed to create account: {0}',
        account_update:     'Failed to update account: {0}',
        account_delete:     'Failed to delete account: {0}',
        account_test:       'Cannot connect using these account settings',

        cache_flush:        'Failed to flush cache',

        whitelist_get:      'Failed to get IP address(es) from the whitelist: {0}',
        whitelist_add:      'Failed to add IP address to the whitelist: {0}',
        whitelist_delete:   'Cannot delete IP address from the whitelist: {0}',
        whitelist_verify:   'Address is not whitelisted: {0}. Blocking access to the API.',

        symbolmap_get:      'Failed to retrieve symbol mapping: {0}: {1}',
        symbolmap_add:      'Failed to add symbol mapping: {0}: {1} => {2}',
        symbolmap_delete:   'Failed to delete symbol mapping: {0}: {1}',
    
        convert_size_usd:   'Size provided in USD, but cannot find a pair to use for conversion',
        order_submit:       'Order submittion failed: {0}, Order Parameters: {1}',
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

        position_retrieve:  'You do not have a position on {0}',
        positions_retrieve: 'There was an error retrieving positions',
        position_none:      'You do not currently have a position on {0}',

        balancess_retrieve: 'There was an error retrieving balances',

        market_retrieve:     'Could not retrieve market info for {0}',
        markets_retrieve:    'There was an error retrieving markets',

    },

    success: {

        account_retrieve:   'Account(s) retrieved successfully: {0}',
        account_create:     'Account created successfully: {0}',
        account_update:     'Account updated successfully: {0}',
        account_delete:     'Account deleted successfully: {0}',
        account_test:       'Successfully tested account settings',

        cache_flush:        'Successfully flushed cache: {0} items deleted',

        whitelist_add:      'Added IP address to the whitelist: {0}',
        whitelist_delete:   'Deleted IP address from the whitelist: {0}',

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

    }
    
}