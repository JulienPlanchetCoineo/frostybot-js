// Caching Subsystem

md5 = require('md5');
const NodeCache = require( "node-cache" )
const cache = new NodeCache( { stdTTL: 30, checkperiod: 120 } )

module.exports = {

    // Initialize Module

    initialize() {
        if (this.initialized !== true) {
            this.modules();
        }
        this.initialized = true;
    },


    // Create module shortcuts

    modules() {
        for (const [method, module] of Object.entries(global.frostybot.modules)) {
            if (method != 'cache') this[method] = module;
        }
    },

    // Set an item in cache

    set( key, result, time ) {
        return cache.set(key, result, time);
    },

    // Get an item from cache

    get( key ) {
        return cache.get(key);
    },

    // Get cache stats

    stats() {
        this.initialize();
        var stats = cache.getStats()
        total = stats.hits + stats.misses;
        ratio = (total > 0 ? Math.round((stats.hits / total) * 100) : 0);
        var result = {
            hit: stats.hits,
            miss: stats.misses,
            total: total,
            ratio: ratio
        };
        this.output.success('cache_stats', this.utils.serialize(result))
        return result
    },

    
    // Flush cache

    flush() {
        this.initialize();
        var stats = cache.getStats()
        total = stats.hits + stats.misses;
        cache.flushAll();
        this.output.success('cache_flush', total)
        return total;
    },

    
    // Cache auto flush (garbage collection)

    gc() {
        cachegcpct = 20;
        randomgc = Math.random() * 100;
        if (randomgc >= (100 - cachegcpct)) {
            this.flush();
        }
    }

}