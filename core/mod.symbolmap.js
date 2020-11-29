// Symbol Mapping Module

const frostybot_module = require('./mod.base')

module.exports = class frostybot_symbolmap_module extends frostybot_module {

    // Constructor

    constructor() {
        super()
    }
    

    // Get mappings

    get(params) {

        var schema = {
            exchange: {
                required: 'string',
                format: 'lowercase',
                oneof: ['ftx', 'deribit', 'binance','bitmex'],
            },
            symbol: {
                optional: 'string',
                format: 'uppercase',
            }
        }

        if (!(params = this.utils.validator(params, schema))) return false; 

        var [exchange, symbol] = this.utils.extract_props(params, ['exchange', 'symbol']);
        var exchange = exchange.toLowerCase();
        var symbol = symbol != undefined ? symbol.toUpperCase() : null;
        var result = (symbol == null ? this.settings.get('symbolmap:' + exchange) : this.settings.get('symbolmap:' + exchange, symbol, false));
        if ((typeof result == 'string') && (symbol != null)) {
            var mapping = result;
            result = {};
            result[symbol] = mapping;
            this.output.debug('symbolmap_get', [exchange, symbol, mapping]);
            return result;
        } else {
            if (result !== false) {
                result = this.utils.remove_values(result, [null, undefined, false]);
                for (var symbol in result) {
                    var mapping = result[symbol];
                    this.output.debug('symbolmap_get', [exchange, symbol, mapping]);
                }
                return result;
            }
            return this.output.error('symbolmap_get', [exchange, symbol]);
        }
    }


    // Add symbol mapping

    add(params) {

        var schema = {
            exchange: {
                required: 'string',
                format: 'lowercase',
                oneof: ['ftx', 'deribit', 'binance','bitmex'],
            },
            symbol: {
                required: 'string',
                format: 'uppercase',
            },
            mapping: {
                required: 'string',
                format: 'uppercase',
            }
        }

        if (!(params = this.utils.validator(params, schema))) return false; 

        var [exchange, symbol, mapping] = this.utils.extract_props(params, ['exchange', 'symbol', 'mapping']);
        var exchange = exchange.toLowerCase();
        var symbol = symbol.toUpperCase();
        var mapping = mapping.toUpperCase();
        var data = {
            value: mapping,
        }
        if (this.settings.set('symbolmap:' + exchange, symbol, mapping)) {
            this.output.success('symbolmap_add', [exchange, symbol, mapping]);
            return this.get({exchange: exchange, symbol: symbol});
        }
        return this.output.error('symbolmap_add', [exchange, symbol, mapping]);
    }


    // Delete symbol mapping

    delete(params) {

        var schema = {
            exchange: {
                required: 'string',
                format: 'lowercase',
                oneof: ['ftx', 'deribit', 'binance','bitmex'],
            },
            symbol: {
                required: 'string',
                format: 'uppercase',
            }
        }

        if (!(params = this.utils.validator(params, schema))) return false; 

        var [exchange, symbol] = this.utils.extract_props(params, ['exchange', 'symbol']);
        var exchange = exchange.toLowerCase();
        var symbol = symbol.toUpperCase();
        if (this.settings.delete('symbolmap:' + exchange.toLowerCase(), symbol.toUpperCase())) {
            this.output.success('symbolmap_delete', [exchange, symbol]);
            return true;
        }
        this.output.error('symbolmap_delete', [exchange, symbol]);
        return false;
    }


    // Map symbol

    async map(exchange, symbol) {
        var result = await this.settings.get('symbolmap:' + exchange, symbol.toUpperCase())
        return (result === null ? false : result)
    }

};