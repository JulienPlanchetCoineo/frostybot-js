// Order processing queue

const frostybot_module = require('./mod.base')
var context = require('express-http-context');

module.exports = class frostybot_queue_module extends frostybot_module {

    // Constructor

    constructor() {
        super()
    }

    // Initialize a queue
    
    create(stub, symbol) {
        var uuid = context.get('reqId')
        if (!this.hasOwnProperty('queue'))
            this.queue = {}
        if (!this.queue.hasOwnProperty(uuid))
            this.queue[uuid] = {}
        if (!this.queue[uuid].hasOwnProperty(stub))
            this.queue[uuid][stub] = {}
        if (!this.queue[uuid][stub].hasOwnProperty(symbol))
            this.queue[uuid][stub][symbol] = []
        if (!this.hasOwnProperty('results'))
            this.results = {}
        if (!this.results.hasOwnProperty(uuid))
            this.results[uuid] = {}
        if (!this.results[uuid].hasOwnProperty(stub))
            this.results[uuid][stub] = {}
        if (!this.results[uuid][stub].hasOwnProperty(symbol))
            this.results[uuid][stub][symbol] = []            
    }


    // Clear order queue
    
    clear(stub, symbol) {
        var uuid = context.get('reqId')
        this.create(stub, symbol)
        this.queue[uuid][stub][symbol] = []
        this.results[uuid][stub][symbol] = []
    }


    // Add order to queue
    
    add(stub, symbol, params) {
        var uuid = context.get('reqId')
        this.create(stub, symbol)
        if (!this.utils.is_array(params)) {
            params = [params]
        }
        params.forEach(order => {
            this.output.notice('order_queued', order)
            this.queue[uuid][stub][symbol].push(order)
        });
    }


    // Process order queue (submit orders to the exchange)

    async process(stub, symbol) {
        var uuid = context.get('reqId')
        this.create(stub, symbol)
        if (await this.config.get('debug:noexecute')) {
            this.output.debug('debug_noexecute');
            var result = this.queue[uuid][stub][symbol];
            this.clear(stub, symbol);
            return result;
        }
        this.results[uuid][stub][symbol] = []
        var total = this.queue[uuid][stub][symbol].length;
        var success = 0;
        this.output.subsection('processing_queue', total);
        this.output.notice('processing_queue', total); 
        var exchange = new this.classes.exchange(stub);
        for (const order of this.queue[uuid][stub][symbol]) {
            let result = await exchange.create_order(order);
            if (result.result == 'success') {
                success++;
                this.output.success('order_submit', { ...{stub: stub}, ...order}); 
            } else {
                //output.set_exitcode(-1);
                var message = result.error.type + ': ' + (this.utils.is_object(result.error.message) ? this.utils.serialize_object(result.error.message) : result.error.message);
                var params = this.utils.serialize(result.params);
                var info = message + ': ' + params;
                this.output.error('order_submit', { ...{error: result.error}, ...{stub: stub}, ...order} ); 
            }
            this.results[uuid][stub][symbol].push(result);
        };
        var results = this.results[uuid][stub][symbol];
        this.output.notice('processed_queue', [success, total]);   
        this.clear(stub, symbol);
        if (success == 0) {
            return false;
        }
        return results;
    }


}