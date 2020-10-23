// Module to handle output to the console, the client and the log file

const clc = require('cli-color');   // Make CLI colors fancy
const md5 = require('md5');         // Used to ensure that the same message is not displayed multiple times
const fs  = require('fs');          // Filesystem 
const eol = require('os').EOL;      // Operating system end of line character(s)

module.exports = {

    // Initialize Module

    initialize() {
        if (this.initialized !== true) {
            this.reset();
            this.modules();
            this.load_language();
            this.logfile = this.utils.base_dir() + '/log/frostybot.log'
        }
        this.initialized = true;
    },


    // Create module shortcuts

    modules() {
        for (const [method, module] of Object.entries(global.frostybot.modules)) {
            if (method != 'output') this[method] = module;
        }
    },


    // Load language if required

    load_language() {
        if (this.language == undefined) {
            const language = this.settings.get('core', 'language', 'en');
            this.language = require('./core.lang.' + language);
            this.translate('notice', 'using_language', language);
        }
    },


    // Check if message has been outputted

    checkonce(message) {
        if (this.once == undefined) {
            this.once = [];
        }
        var key = md5(message);
        if (!this.once.includes(key)) {
            this.once.push(key);
            return false;
        }
        return true;
    },

    // Translate message and add to output

    translate(type, id, params = []) {
        this.initialize();
        params = this.utils.force_array(params);
        if ((this.language.hasOwnProperty(type)) && (this.language[type].hasOwnProperty(id))) {
            var str = this.language[type][id];
            params.forEach((param, idx) => {
                var data = this.utils.is_array(param) || this.utils.is_object(param) ? this.utils.serialize(param) : param;
                var placeholder = '{' + idx + '}';
                str = str.replace(placeholder, data).trim();
                str = str.slice(-1) == ':' ? str.substr(0, str.length - 1) : str;
            });
            if (!this.checkonce(str))
                this.add_message(type, str);
            return (type == 'error' ? false : true);
        }
        return this.add_message('error', 'Translation not found: ' + type + '.' + id);
    },

    // Some helper functions

    debug(id, params = []) {
        return this.translate('debug', id, params)
    },

    notice(id, params = []) {
        return this.translate('notice', id, params)
    },

    warning(id, params = []) {
        return this.translate('warning', id, params)
    },

    error(id, params = []) {
        return this.translate('error', id, params)
    },

    success(id, params = []) {
        return this.translate('success', id, params)
    },

    // Start a new section

    section(id, params = []) {
        this.add_blank();
        this.translate('section', id, params);
        this.add_blank();
    },


    // Start a New Subsection

    subsection(id, params = []) {
        this.add_blank();
        this.translate('subsection', id, params);
        this.add_blank();
    },


    // Reset output object

    reset: function() {
        this.output_obj = {
            result: 'success',
            type: null,
            data: null,
            cache: null,
            messages: []
        }
        this.once = [];
    },    


    // Get class of an object

    get_object_class(obj){
        var objtype = typeof(obj);
        if (objtype == 'boolean') {
            return 'boolean';
        } else {
            if (objtype == 'object') {
                return obj.constructor.name;
            }
            if (objtype != 'undefined') {
                return objtype;
            } else {
                if (obj && obj.constructor && obj.constructor.toString) {
                    var arr = obj.constructor.toString().match(
                        /function\s*(\w+)/);
                    if (arr && arr.length == 2) {
                        return arr[1];
                    }
                }
            }
        }
        return undefined;
    },


    // Add data to the output

    add_data(data = {}) {
        var type = this.get_object_class(data);
        if ((type.toLowerCase() == 'array') && (data.length > 0)) { // If data type is array, find out the type of the array elements
            var subtype = this.get_object_class(data[0]);
            type = subtype + '[]';
        }
        this.output_obj.type = type;
        this.output_obj.data = data;
    },


    // Create a blank line in the output log

    add_blank() {
        this.add_message('blank','')
    },


    // Add a message to the output

    add_message(type, message) {
        message = message.replace(/\s+/g,' ');  // Trim message
        var maxwidth = process.stdout.columns - 35;
        var d = new Date();
        var ts = d.getTime();
        if (!['section','subsection','blank'].includes(type)) {          
            this.output_obj.messages.push({
                'timestamp': ts,
                'type': type.toUpperCase(),
                'message': message.replace(/\s+/g,' ').trim()
            })    
        }
        let dateobj = new Date(ts);
        let day = ("0" + dateobj.getDate()).slice(-2);
        let month = ("0" + (dateobj.getMonth() + 1)).slice(-2);
        let year = dateobj.getFullYear();
        let hour = ("0" + dateobj.getHours()).slice(-2);
        let minute = ("0" + dateobj.getMinutes()).slice(-2);
        let second = ("0" + dateobj.getSeconds()).slice(-2);
        var type_color_map = {
            section     : clc.whiteBright,
            subsection  : clc.white,
            blank       : clc.white,
            default     : clc.white,
            debug       : clc.cyan,
            notice      : clc.white,
            warning     : clc.yellow,
            error       : clc.redBright,
            success     : clc.green,
        }
        var splitter1 = type == 'section' ? clc.whiteBright('═╪═') : clc.white(' │ ');
        var splitter2 = type == 'section' ? clc.whiteBright('═╪═') : (type == 'subsection' ? (message.trim().length == 0 ? ' │ ' : ' ├─') : clc.white(' │ '));
        let datetime = (['section', 'subsection','blank'].includes(type) ? ''.padEnd(19,(type == 'section' ? '═' : ' ')) : year + "-" + month + "-" + day + " " + hour + ":" + minute + ":" + second);
        
        if (typeof type_color_map[type] !== 'function') {
            console.log(type);
        }

        if (!['section', 'subsection','blank'].includes(type)) {
            var logmessage = datetime + ' | ' + type.toUpperCase().padEnd(7) + ' | ' + message + eol
            fs.appendFileSync(this.logfile, logmessage);
        }

        switch(type) {
            case 'section'      : var message_type = '═══════'; 
                                  var strwidth = message.length;
                                  var padwidth = Math.round((maxwidth - (strwidth + 2)) / 2);
                                  var message = ''.padStart(padwidth, '═') + (' ' + message + ' ') + ''.padEnd(padwidth, '═');                                    
                                  break;
            case 'subsection'   : var message_type = ''; 
                                  var strwidth = message.length;
                                  var padwidth = Math.round((maxwidth - (strwidth + 2)) / 2);
                                  var message = ''.padStart(padwidth, '─') + (' ' + message + ' ') + ''.padEnd(padwidth, '─');                                    
                                  break;
            case 'blank'        : var message_type = ''; break;
            default             : var message_type = type.toUpperCase(); 
        }
        var output = datetime /*+ splitter + code*/ + splitter1 + message_type.padEnd(7) + splitter2 + (message.padEnd(maxwidth,' ').slice(0,maxwidth));
        console.log(type_color_map[type](output));
        if (type.toLowerCase() == 'error') {
            this.output_obj.result = 'error'
        }
    },    


    // Parse raw output into a frostybot_output object

    parse(result) {
        this.add_data(result);
        var output = new this.classes.output(...this.utils.extract_props(this.output_obj, ['command', 'params', 'result', 'type', 'data', 'messages']));
        this.reset();
        return output;
    },


    // Combine multiple command outputs into a single command output

    combine(results) {
        var result = '';
        var data = results;
        var type = 'frostybot_output[]';
        var messages = [];
        for (var i = 0; i < results.length; i++) {
            var output_result = results[i];
            if (output_result != undefined) {
                result = (output_result.result == 'error' ? 'error' : (result == 'error' ? 'error' : 'success'));
            }
        }
        return new this.classes.output('<multiple>', null, result, type, data, messages);
    }

}