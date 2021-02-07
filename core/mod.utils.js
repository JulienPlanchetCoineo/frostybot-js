// Commonly used utility and helper functions

const frostybot_module = require('./mod.base')

module.exports = class frostybot_utils_module extends frostybot_module {

    // Constructor

    constructor() {
        super()
    }


    // Check if value is JSON

    is_json(str) {
        try {
            JSON.parse(str);
        } catch (e) {
            return false;
        }
        return true;
    }

    // Check if value is a string

    is_string(val) {
        return (typeof val === 'string');
    }

    // Check if value is boolean

    is_bool(val) {
        return this.is_true(val) || this.is_false(val);
    }


    // Check if value is numeric

    is_numeric(val) {
        return !isNaN(parseFloat(val)) && isFinite(val);
    }


    // Check if value is true

    is_true(val) {
        return ['true', 'yes', '1', 1, true].includes(val);
    }

    
    // Check if value is false

    is_false(val) {
        return ['false', 'no', '0', 0, false].includes(val);
    }


    // Check if value is an object

    is_object(val) {
        return (typeof val === 'object') && (!this.is_array(val));
    }


    // Check if value is an array

    is_array(val) {
        return Array.isArray(val);
    }


    // Check if a value is empty

    is_empty(value) {
        return (
            (value == undefined) ||
            (value == null) ||
            (value.hasOwnProperty('length') && value.length === 0) ||
            (value.constructor === Object && Object.keys(value).length === 0)
        )
    }


    // Check if a value is an IP address

    is_ip(value) {
        const net = require('net')
        return (net.isIPv4(value) || net.isIPv6(value));
    }


    // Check if a value is a function

    is_function(value) {
        return typeof(value) === 'function';
    }


    // Convert timestamp milliseconds to datetime str
    
    ts_to_datetime(ts) {
        let dateobj = new Date(ts);
        let day = ("0" + dateobj.getDate()).slice(-2);
        let month = ("0" + (dateobj.getMonth() + 1)).slice(-2);
        let year = dateobj.getFullYear();
        let hour = ("0" + dateobj.getHours()).slice(-2);
        let minute = ("0" + dateobj.getMinutes()).slice(-2);
        let second = ("0" + dateobj.getSeconds()).slice(-2);
        return year + "-" + month + "-" + day + " " + hour + ":" + minute + ":" + second;
    }


    // Force a value to be an array if it not already an array

    force_array(val) {
        return this.is_array(val) ? val : [val];
    }


    // Check if the object is missing any of the supplied properties

    missing_props(obj, props = []) {
        if (!this.is_object(obj)) return false;
        if (!this.is_array(props)) props = [props];
        var obj = this.lower_props(obj);
        var result = [];
        for (var i = 0; i < props.length; i++) {
            var prop = props[i].toLowerCase();
            if (!obj.hasOwnProperty(prop)) {
                result.push(props);
            }
        }
        return result;
    }


    // Change all of an objects keys to lowercase

    lower_props(obj) {
        if (obj.hasOwnProperty('_raw_')) delete obj['_raw_'];
        if (this.is_object(obj)) {
            for (var key in obj) {
                if (!obj.hasOwnProperty(key))
                    continue;
                if (typeof obj[key] === 'object' && obj[key] !== null) {
                    var val = this.lower_props(obj[key]);
                    delete obj[key];
                    obj[key.toLowerCase()] = val;
                } else {
                    if (key != key.toLowerCase()) {
                        var val = obj[key];
                        if (typeof(val) === 'string') {
                            delete obj[key];
                            obj[key.toLowerCase()] = val;
                        }
                    }
                }
            }
            return obj;
        }
        return false;
    }


    // Walk over object and encrypt properties matching the names provided in the filter array
    // If no filter is supplied, then all properties will be encrypted
    // If no UUID is supplied, the core UUID will be used

    async encrypt_values(obj, filter = null, uuid = null) {
        return await this.walk_values_async(obj, filter, async function(val) {
            return await global.frostybot._modules_['encryption'].encrypt(val, uuid);
        }); 
    }


    // Walk over object and decrypt properties matching the names provided in the filter array
    // If no filter is supplied, then all encrypted values will be decrypted
    // If no UUID is supplied, the core UUID will be used

    async decrypt_values(obj, filter = null, uuid = null) {
        return await this.walk_values_async(obj, filter, async function(val) {
            return await global.frostybot._modules_['encryption'].decrypt(val, uuid);
        }); 
    }


    // Trim whitespace from object values recursively

    trim_values(obj, filter = null) {
        return this.walk_values(obj, filter, function(val) {
            return typeof(val) === "string" ? val.replace(/^\s+|\s+$/g, '') : val;
        }); 
    }    


    // Walk over object and remove properties with the names provided in the props array element

    remove_props(obj, props = []) {
        if (!this.is_object(obj)) return false;
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
    }


    // Walk over object and remove properties that have the values provided in the vals array element

    remove_values(obj, vals = []) {
        if (!this.is_object(obj)) return false;
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
    }
    
    // Walk over object properties recursively and execute a callback function for each of the given properties (if supplied), or all of the properties is no filter is supplied

    walk_values() {
        if (arguments.length < 2) return false;
        if (!this.is_object(arguments[0])) return arguments[0];
        var obj = arguments[0];
        var filter = null;
        var callfunc = null;
        if (arguments.length == 2) 
            callfunc = arguments[1];
        if (arguments.length == 3) {
            filter = arguments[1];
            callfunc = arguments[2];
        }
        if ((filter != null) && (!this.is_array(filter))) 
            throw 'Invalid filter supplied to utils.walk_values()';
        if (!this.is_function(callfunc)) 
            throw 'Invalid callback function supplied to utils.walk_values()';
        for (var key in obj) {
            if (!obj.hasOwnProperty(key))
                continue;
            var val = obj[key];
            if (this.is_object(val) && !this.is_empty(val) && !this.encryption.is_encrypted(val))
                obj[key] = this.walk_values(val, filter, callfunc);
            else 
                if ((filter == null) || (filter.includes(key))) 
                    obj[key] = callfunc(val); 
        }
        return obj;
    }

    // Asyncronously Walk over object properties recursively and execute a callback function for each of the given properties (if supplied), or all of the properties is no filter is supplied

    async walk_values_async() {
        if (arguments.length < 2) return false;
        if (!this.is_object(arguments[0])) return arguments[0];
        var obj = arguments[0];
        var filter = null;
        var callfunc = null;
        if (arguments.length == 2) 
            callfunc = arguments[1];
        if (arguments.length == 3) {
            filter = arguments[1];
            callfunc = arguments[2];
        }
        if ((filter != null) && (!this.is_array(filter))) 
            throw 'Invalid filter supplied to utils.walk_values()';
        if (!this.is_function(callfunc)) 
            throw 'Invalid callback function supplied to utils.walk_values()';
        for (var key in obj) {
            if (!obj.hasOwnProperty(key))
                continue;
            var val = obj[key];
            if (this.is_object(val) && !this.is_empty(val) && !this.encryption.is_encrypted(val))
                obj[key] = await this.walk_values_async(val, filter, callfunc);
            else 
                if ((filter == null) || (filter.includes(key))) 
                    obj[key] = await callfunc(val); 
        }
        return obj;        
    }

    // Walk over object and uppercase the values of the given property name filter, or for all propterties if the filter is ommited

    uppercase_values(obj, filter = null) {
        return this.walk_values(obj, filter, function(val) {
            return typeof(val) === "string" ? val.toUpperCase() : val;
        }); 
    }    

    // Walk over object and uppercase the values of the given property name filter, or for all propterties if the filter is ommited

    lowercase_values(obj, filter = null) {
        return this.walk_values(obj, filter, function(val) {
            return typeof(val) === "string" ? val.toLowerCase() : val;
        }); 
    }    

    // Recursively trim object values and change the property names to lowercase

    clean_object(val) {
        if (!this.is_object(val)) return val;
        return this.lower_props(this.trim_values(val));
    }


    // Walk over object and censor properties that match provided array elements

    censor_props(obj, props = ['apikey', 'secret']) {
        if (!this.is_object(obj)) return false;
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
    }


    // Filter array of objects by field values

    filter_objects(objarr, filters={}) {
        if (!this.is_array(objarr)) return false;
        var results = [];
        filters = this.lower_props(filters);
        for (var i=0; i < objarr.length; i++) {
            var obj = objarr[i];
            var fields = Object.getOwnPropertyNames(obj);
            fields.forEach(field => {
                var fieldname = field.toLowerCase();
                if (filters[fieldname] != undefined) {
                    var filterval = filters[fieldname];
                    if (String(obj[field]).toLowerCase() == String(filterval).toLowerCase()) {
                        results.push(obj);
                    }
                }
            })
        }
        return results;
    }    


    // Extract given object properties into an array

    extract_props(obj, keys = []) {
        if (!this.is_object(obj)) return false;
        var result = [];
        if (typeof(keys) === 'string') {
            keys = [keys];
        }
        keys.forEach(key => {
            var key = key.toLowerCase();
            if (obj.hasOwnProperty(key)) {
                result.push(obj[key]);
            } else {
                result.push(undefined);
            }
        });
        if (result.length == 1) {
            return result[0];
        }
        return result;
    }    


    // Get base directory

    base_dir() {
        return __dirname.substr(0, __dirname.lastIndexOf('/'))
    }


    // Count the number of decimals in a number
    
    num_decimals(num) {
        if (!this.is_numeric(num)) return false;
        let text = num.toString()
        if (text.indexOf('e-') > -1) {
          let [base, trail] = text.split('e-')
          let elen = parseInt(trail, 10)
          let idx = base.indexOf(".")
          return idx == -1 ? 0 + elen : (base.length - idx - 1) + elen
        }
        let index = text.indexOf(".")
        return index == -1 ? 0 : (text.length - index - 1)
    }


    // Serialize object (and strip out any api keys or secrets)

    serialize_object(obj) {
        if (!this.is_object(obj)) return false;
        var props = [];
        if (![null, undefined].includes(obj)) {
            for (const [prop, val] of Object.entries(obj)) {
                if (['apikey','secret','password'].includes(prop.toLowerCase())) {
                    var newval = '********';
                } else {
                    var newval = this.serialize(val);
                }
                props.push(prop + ': ' + newval);
            }
            return '{' + props.join(', ') + '}';
        }
        return 'null';
    }


    // Serialize array

    serialize_array(arr) {
        if (!this.is_array(arr)) return false;
        return JSON.stringify(arr).replace(/"/g,'').replace(/,/g,', ');
    }


    // Serialize a value for output to the log

    serialize(val) {
        if (typeof val === 'string') return val;
        if (this.is_numeric(val)) return String(val);
        if (this.is_numeric(val)) return String(val);
        if (this.is_object(val)) return this.serialize_object(val);
        if (this.is_array(val)) return this.serialize_array(val);
        return false;
    }


    // Capitilize first letter in a stirng

    uc_first(str) {
        if (typeof str !== 'string') return false;
        return str.charAt(0).toUpperCase() + str.slice(1);
    }


    // Capitilize first letter of every word in a sentence

    uc_words(str) {
        if (typeof str !== 'string') return false;
        var words = str.split(' ');
        if (!this.is_array(words)) return this.uc_first(str);
        words.forEach((word, idx) => {
            words[idx] = this.uc_first(word);
        });
        return words.join(' ');
    }

    // Get currently running module and method
    
    get_current_command() {
        return global.frostybot.command.module + ':' + global.frostybot.command.method;
    }

    // Method parameter validator

    validator(params, schema) {
        params = this.lower_props(params);
        if (params.hasOwnProperty('_raw_')) delete params['_raw_'];
        //schema = this.lower_props(schema);

        for (var prop in schema) {
            if (!schema.hasOwnProperty(prop)) continue;
            var settings = schema[prop];
            var required = settings.hasOwnProperty('required') ? true : false;
            var expected_type = settings[(required ? 'required' : 'optional')];
            var oneof = settings.hasOwnProperty('oneof') ? settings['oneof'] : null;
            var requiredifnotpresent = settings.hasOwnProperty('requiredifnotpresent') ? settings['requiredifnotpresent'] : null;
            var format = settings.hasOwnProperty('format') ? settings['format'].toLowerCase() : null;
            var present = params.hasOwnProperty(prop) ? true : false;

            // Check that one of the specified required params is present

            if (requiredifnotpresent != null) {
                var found = false;
                var requiredoneof = this.force_array(requiredifnotpresent);
                requiredoneof.push(prop)
                Object.getOwnPropertyNames(params).forEach(propname => {
                    if (requiredoneof.includes(propname)) {
                        found = true
                    }
                });
                if (!found) {
                    this.output.error('required_oneof', this.serialize_array(requiredoneof));
                    return false;    
                }
            }

            // Param is required but not present

            if (required && !present) {
                this.output.error('required_param', prop + ' (' + expected_type + ') in ' + this.get_current_command());
                return false;
            }
            if (present) {
                var val = params[prop];

                // Check param type

                switch(expected_type) {
                    case    'boolean'   :   var actual_type = this.is_bool(val) ? 'boolean' : typeof val; break;
                    case    'ip'        :   var actual_type = this.is_ip(val)   ? 'ip'      : typeof val; break;
                    default             :   var actual_type = typeof val;
                }

                // Param is the incorrect type

                if ( (expected_type != undefined) && (actual_type !== expected_type) ) {
                    this.output.error('incorrect_type', [prop, expected_type, actual_type]);
                    return false;    
                }

                // Param is the incorrect format

                if (format != null) {
                    switch(format) {
                        case 'uppercase' : val = val.toUpperCase(); break;
                        case 'lowercase' : val = val.toLowerCase(); break;
                    }
                }

                // Param is not in the list of allowed values

                if ( (oneof != null) && (this.is_array(oneof)) ) {
                    if (!oneof.includes(val)) {
                        this.output.error('param_val_oneof', [prop, this.serialize_array(oneof)]);
                        return false;
                    }
                }
                params[prop] = val;
            }
        }
        return params;
    }



}