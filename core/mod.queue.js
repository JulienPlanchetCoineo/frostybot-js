// Order processing queue

const frostybot_module = require('./mod.base')

module.exports = class frostybot_queue_module extends frostybot_module {

    // Constructor

    constructor() {
        super()
    }

    // Initialize a queue
    
    create(stub, symbol) {
        if (!this.hasOwnProperty('queue'))
            this.queue = {}
        if (!this.queue.hasOwnProperty(stub))
            this.queue[stub] = {}
        if (!this.queue[stub].hasOwnProperty(symbol))
            this.queue[stub][symbol] = []
        if (!this.hasOwnProperty('results'))
            this.results = {}
        if (!this.results.hasOwnProperty(stub))
            this.results[stub] = {}
        if (!this.results[stub].hasOwnProperty(symbol))
            this.results[stub][symbol] = []            
    }


    // Clear order queue
    
    clear(stub, symbol) {
        this.create(stub, symbol)
        this.queue[stub][symbol] = []
        this.results[stub][symbol] = []
    }


    // Add order to queue
    
    add(stub, symbol, params) {
        this.create(stub, symbol)
        if (!this.utils.is_array(params)) {
            params = [params]
        }
        params.forEach(order => {
            this.output.notice('order_queued', this.utils.serialize(order))
            this.queue[stub][symbol].push(order)
        });
    }


    // Process order queue (submit orders to the exchange)

    async process(stub, symbol) {
        this.create(stub, symbol)
        this.results[stub][symbol] = []
        var total = this.queue[stub][symbol].length;
        var success = 0;
        this.output.subsection('processing_queue', total);
        this.output.notice('processing_queue', total); 
        var exchange = new this.classes.exchange(stub);
        for (const order of this.queue[stub][symbol]) {
            let result = await exchange.create_order(order);
            if (result.result == 'success') {
                success++;
                this.output.success('order_submit', [stub, this.utils.serialize(order)]); 
            } else {
                //output.set_exitcode(-1);
                var message = result.error.type + ': ' + (this.utils.is_object(result.error.message) ? this.utils.serialize_object(result.error.message) : result.error.message);
                var params = this.utils.serialize(result.params);
                var info = message + ': ' + params;
                this.output.error('order_submit', [stub, info, this.utils.serialize(order)]); 
            }
            this.results[stub][symbol].push(result);
        };
        var results = this.results[stub][symbol];
        this.output.notice('processed_queue', [success, total]);   
        this.clear(stub, symbol);
        if (success == 0) {
            return false;
        }
        return results;
    }


}