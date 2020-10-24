// Caching Subsystem

md5 = require('md5');

module.exports = {

    // Initialize Module

    initialize() {
        if (this.initialized !== true)
            this.modules();
        this.initialized = true;
    },


    // Create module shortcuts

    modules() {
        for (const [method, module] of Object.entries(global.frostybot.modules)) {
            if (method != 'cache') this[method] = module;
        }
    },


    // Get cache stats

    stats() {
        this.initialize();
        if (this.cachestats == undefined) {
            this.cachestats = {
                hit: 0,
                miss: 0,
            }
        }
        total = this.cachestats.hit + this.cachestats.miss;
        ratio = (total > 0 ? Math.round((this.cachestats.hit / total) * 100) : 0);
        var result = {
            hit: this.cachestats.hit,
            miss: this.cachestats.miss,
            total: total,
            ratio: ratio
        };
        this.output.success('cache_stats', this.utils.serialize(result))
        return result
    },


    // Get object from cache

    get(key, timeout = 0) {
        this.initialize();
        this.gc();
        var keymd5 = md5(key);
        var data = this.database.select('cache', {key: keymd5});
        if (data.length > 0) {
            var row = data[0];
            var ts = row.timestamp;
            var perm = row.permanent;
            var now = Date.now() / 1000;
            var age = now - ts;
            if ((age <= timeout) || (perm == true)) {
                //console.log('Cache hit:     ' + key + ' (' + keymd5 + ')');
                if (this.cachestats == undefined) {
                    this.cachestats = {
                        hit: 0,
                        miss: 0,
                    }
                }
                this.cachestats.hit++;
                return JSON.parse(row.data);
            } else {
                this.database.delete('cache', {'key': keymd5});
            }              
        }
        //console.log('Cache miss:    ' + key + ' (' + keymd5 + ')');
        if (this.cachestats == undefined) {
            this.cachestats = {
                hit: 0,
                miss: 0,
            }
        }
        this.cachestats.miss++;
        return null;
    },


    // Add object to cache

    set(key, data, permanent = false) {
        this.initialize();
        var keymd5 = md5(key);
        var cachedata = {
            'key': keymd5,
            'permanent': (permanent == true ? '1' : '0'),
            'timestamp': Date.now() / 1000,
            'data': JSON.stringify(data),
        };
        if (this.database.insertOrReplace('cache', cachedata).changes == 1) {
            return true;
        }
        return false;
    },


    // Flush cache

    flush(days, permanent=false) {
        this.initialize();
        var total = 0;
        result = this.database.select('cache');
        result.forEach(function(row)  {
            var key = row.key;
            var ts = row.timestamp;
            var perm = row.permanent == 1 ? true : false;
            var now = Date.now() / 1000;
            var age = now - ts;
            var dayage = age / 86400;
            if ((dayage >= days) && (permanent == perm)) {
                if (global.frostybot.modules.database.delete('cache', {'key': key}).changes > 0) {
                    total++;
                }
            }                            
        }); 
        this.output.success('cache_flush', total)
        return total;
    },

    
    // Cache auto flush (garbage collection)

    gc() {
        cachegcpct = 20;
        cachegcage = 1;
        randomgc = Math.random() * 100;
        if (randomgc >= (100 - cachegcpct)) {
            //output.debug('Garbage collection triggered, flushing cache older than ' + cachegcage + ' day(s)...');
            this.flush(cachegcage);
        }
    }

}