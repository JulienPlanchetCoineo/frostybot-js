// Commonly used utility and helper functions

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
            if (method != 'utils') this[method] = module;
        }
    },


    // Module linker
    
    methods() {
        return Object.getOwnPropertyNames(this).filter(item => typeof this[item] === 'function')
    },


    // Method executor

    execute(method, params) {
        if (typeof this[method] === 'function') {
            return this[method(...params)];
        }
    },


    // Get currently running module and method
    
    get_current_command() {
        return global.frostybot.command.module + ':' + global.frostybot.command.method;
    },

    // Method parameter validator

    validator(params, schema) {
        this.initialize();
        params = this.lower_props(params);
        schema = this.lower_props(schema);
        for (var prop in schema) {
            if (!schema.hasOwnProperty(prop)) continue;
            var settings = schema[prop];
            var required = settings.hasOwnProperty('required') ? true : false;
            var expected_type = settings[(required ? 'required' : 'optional')];
            var format = settings.hasOwnProperty('format') ? settings['format'].toLowerCase() : null;
            var present = params.hasOwnProperty(prop) ? true : false;
            if (required && !present) {
                this.output.error('required_param', prop + ' (' + expected_type + ') in ' + this.get_current_command());
                return false;
            }
            if (present) {
                var val = params[prop];
                var actual_type = this.is_bool(val) && expected_type == 'boolean' ? 'boolean' : typeof val;
                if (actual_type !== expected_type) {
                    this.output.error('incorrect_type', [prop, expected_type, actual_type]);
                    return false;    
                }
                if (format != null) {
                    switch(format) {
                        case 'uppercase' : val = val.toUpperCase(); break;
                        case 'lowercase' : val = val.toLowerCase(); break;
                    }
                }
                params[prop] = val;
            }
        }
        return params;
    },


    // Check if value is JSON

    is_json(str) {
        try {
            JSON.parse(str);
        } catch (e) {
            return false;
        }
        return true;
    },


    // Check if value is boolean

    is_bool(val) {
        return this.is_true(val) || this.is_false(val);
    },


    // Check if value is true

    is_true(val) {
        return ['true', 'yes', '1', 1, true].includes(val);
    },

    
    // Check if value is false

    is_false(val) {
        return ['false', 'no', '0', 0, false].includes(val);
    },


    // Check if value is an object

    is_object(val) {
        return (typeof val === 'object');
    },


    // Check if value is an object

    is_array(val) {
        return Array.isArray(val);
    },


    // Check if a value is empty

    is_empty(value) {
        return (
            (value == null) ||
            (value.hasOwnProperty('length') && value.length === 0) ||
            (value.constructor === Object && Object.keys(value).length === 0)
        )
    },


    // Force a value to be an array if it not already an array

    force_array(val) {
        return this.is_array(val) ? val : [val];
    },


    // Check if the object is missing anty of the supplied properties

    missing_props(obj, props = []) {
        if (!this.is_array(props)) props = [props];
        var obj = this.lower_props(obj);
        var result = [];
        for (var i = 0; i < props.length; i++) {
            var prop = props[i].toLowerCase();
            if (!obj.hasOwnProperty(prop)) {
                result.push(props);
            }
        }
        if (result.length > 0)
            return result;
        else
            return false;
    },


    // Change all of an objects properties to lowercase

    lower_props(obj) {
        if (this.is_object(obj)) {
            for (var key in obj) {
                if (!obj.hasOwnProperty(key))
                    continue;
                if (typeof obj[key] === 'object' && obj[key] !== null)
                    obj[key] = this.lower_props(obj[key]);
                else
                    if (key != key.toLowerCase()) {
                        var val = obj[key];
                        if (typeof(val) === 'string') {
                            val = val.replace(/^\s+|\s+$/g, '');
                        }
                        delete obj[key];
                        obj[key.toLowerCase()] = val;
                    }
            }
            return obj;
        }
    },


    // Walk over object and encrypt properties with the names provided in the props array element

    encrypt_props(obj, props = []) {
        for (var key in obj) {
            if (!obj.hasOwnProperty(key))
                continue;
            if (typeof obj[key] === 'object' && obj[key] !== null)
                obj[key] = this.encrypt_props(obj[key], props);
            else
                if (props.includes(key)) {
                    var val = this.encryption.encrypt(obj[key])
                    obj[key] = val
                } 
    }
        return obj;
    },


    // Walk over object and decrypt properties with the names provided in the props array element

    decrypt_props(obj, props = []) {
        for (var key in obj) {
            if (!obj.hasOwnProperty(key))
                continue;
            if (typeof obj[key] === 'object' && obj[key] !== null)
                obj[key] = this.encrypt_props(obj[key], props);
            else
                if (props.includes(key)) {
                    var val = this.encryption.decrypt(obj[key])
                    obj[key] = val
                } 
        }
        return obj;
    },


    // Trim whitespace from object properties recursively

    trim_props(obj) {
        for (var key in obj) {
            if (!obj.hasOwnProperty(key))
                continue;
            if (typeof obj[key] === 'object' && obj[key] !== null)
                obj[key] = this.trim_props(obj[key]);
            else {
                var val = obj[key];
                if (typeof(val) == 'string') {
                    val = val.replace(/^\s+|\s+$/g, '');
                    obj[key] = val;
                }
            }
        }
        return obj;
    },


    // Walk over object and remove properties with the names provided in the props array element

    remove_props(obj, props = []) {
        for (var key in obj) {
            if (!obj.hasOwnProperty(key))
                continue;
            if (typeof obj[key] === 'object' && obj[key] !== null)
                obj[key] = this.remove_props(obj[key], props);
            else
                if (props.includes(key)) 
                    delete obj[key];
        }
        return obj;
    },


    // Walk over object and remove properties that have the values provided in the vals array element

    remove_values(obj, vals = []) {
        for (var key in obj) {
            if (!obj.hasOwnProperty(key))
                continue;
            if (typeof obj[key] === 'object' && obj[key] !== null)
                obj[key] = this.remove_values(obj[key], vals);
            else
                if (vals.includes(obj[key])) 
                    delete obj[key];
        }
        return obj;
    },    


    // Recursively trim object properties and change the property names to lowercase

    clean_props(obj) {
        return this.lower_props(this.trim_props(obj));
    },


    // Walk over object and censor properties that match provided array elements

    censor_props(obj, props = ['apikey', 'secret']) {
        for (var key in obj) {
            if (!obj.hasOwnProperty(key))
                continue;
            if (props.includes(key)) 
                obj[key] = '**********'
            else 
                if (typeof obj[key] === 'object' && obj[key] !== null)
                    obj[key] = this.censor_props(obj[key], props);
        }
        return obj;
    },


    // Filter array of objects by field values

    filter_objects(objarr, filters={}) {
        var results = [];
        filters = this.lower_props(filters);
        for (var i=0; i < objarr.length; i++) {
            var obj = objarr[i];
            var fields = Object.getOwnPropertyNames(obj);
            fields.forEach(field => {
                var fieldname = field.toLowerCase();
                if (filters[field] != undefined) {
                    var filterval = filters[field];
                    if (obj[field].toLowerCase() == filterval.toLowerCase()) {
                        results.push(obj);
                    }
                }
            })
        }
        return results;
    },    


    // Extract given object properties into an array

    extract_props(params, keys = []) {
        var result = [];
        if (typeof(keys) === 'string') {
            keys = [keys];
        }
        keys.forEach(key => {
            var key = key.toLowerCase();
            if (params.hasOwnProperty(key)) {
                result.push(params[key]);
            } else {
                result.push(undefined);
            }
        });
        if (result.length == 1) {
            return result[0];
        }
        return result;
    },    


    // Get base directory

    base_dir() {
        return __dirname.substr(0, __dirname.lastIndexOf('/'))
    },


    // Count the number of decimals in a number
    
    num_decimals(num) {
        let text = num.toString()
        if (text.indexOf('e-') > -1) {
          let [base, trail] = text.split('e-')
          let elen = parseInt(trail, 10)
          let idx = base.indexOf(".")
          return idx == -1 ? 0 + elen : (base.length - idx - 1) + elen
        }
        let index = text.indexOf(".")
        return index == -1 ? 0 : (text.length - index - 1)
    },


    // Serialize object (and strip out any api keys or secrets)

    serialize_object(obj) {
        var props = [];
        for (const [prop, val] of Object.entries(obj)) {
            if (['apikey','secret'].includes(prop.toLowerCase())) {
                var newval = '********';
            } else {
                var newval = this.serialize(val);
            }
            props.push(prop + ': ' + newval);
        }
        return '{' + props.join(', ') + '}';
    },


    // Serialize array

    serialize_array(arr) {
        return JSON.stringify(arr).replace(/"/g,'').replace(/,/g,', ');
    },


    // Serialize a value for output to the log

    serialize(val) {
        if ( ![ 'object', 'array' ].includes(typeof val)) return val;
        if (typeof val === 'string') return val;
        if ((val !== null) && (this.is_object(val) || this.is_array(val))) {
            switch (typeof val) {
                case 'object'   :   return this.serialize_object(val);
                case 'array'    :   return this.serialize_array(val);
            }
        } else return 'Unable to serialize object';
    },


    // Capitilize first letter in a word

    uc_first(str) {
        if (typeof str !== 'string') return '';
        return str.charAt(0).toUpperCase() + str.slice(1);
    },


    // Capitilize first letter of every word in a sentence

    uc_words(str) {
        var words = str.split(' ');
        if (!this.is_array(words)) return this.uc_first(str);
        words.forEach((word, idx) => {
            words[idx] = this.uc_first(word);
        });
        return words.join(' ');
    },

}