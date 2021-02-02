// Module to handle output to the console, the client and the log file

const clc = require('cli-color');   // Make CLI colors fancy
const md5 = require('md5');         // Used to ensure that the same message is not displayed multiple times
const fs  = require('fs');          // Filesystem 
const eol = require('os').EOL;      // Operating system end of line character(s)

const frostybot_module = require('./mod.base')

module.exports = class frostybot_output_module extends frostybot_module {

    // Constructor

    constructor() {
        super();
    }


    // Initialize

    initialize(mode = 'normal') {
        this.mode = mode;
        const base_dir = __dirname.substr(0, __dirname.lastIndexOf('/'))
        this.logfile = base_dir + '/log/frostybot.log'
        this.reset();
        this.load_language();
    }

    // Load language if required

    async load_language() {
        this.settings = global.frostybot._modules_.settings;
        if (this.language == undefined) {
            var language = await this.settings.get('core', 'language', 'en');
            if (language == undefined) language = 'en';
            this.language = require('../lang/lang.' + language);
            this.section('frostybot_startup');
            this.translate('notice', 'using_language', language);
            this.notice('database_type', this.database.type);
            this.notice('database_name', this.database.name);
            //this.output_debug = await this.settings.get('config', 'debug:output', true);
            //this.notice('output_debug', (this.output_debug ? 'enabled' : 'disabled'));
        }
    }

    // Enable debug output

    /*
    async enable_debug() {
        await this.settings.set('config', 'debug:output', true);
        this.output_debug = true;
        return true;
    }


    // Enable debug output

    async disable_debug() {
        await this.settings.set('config', 'debug:output', false);
        this.output_debug = false;
        return true;
    }
    */


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
    }

    // Expand object in console output

    outobj(type, str, idx, obj) {
        var data = this.utils.is_array(obj) || this.utils.is_object(obj) ? this.utils.serialize(obj) : obj;
        var datalen = this.utils.is_string(data) ? data.length : 0;
        if (datalen > 40) {
            var resmessage = str.replace(idx, data).trim();
            var objmessage = str.replace(idx, "").trim();
            this.add_message(type, resmessage, {toLog: true, toResults: true, toConsole: false})
            this.add_message(type, objmessage, {toLog: false, toResults: false, toConsole: true})
            this.add_message(type, obj, {toLog: false, toResults: false, toConsole: true})
            return (type == 'error' ? false : true);
        }  
        return -1;      
    }

    // Translate message and add to output

    translate(type, id, params = []) {
        
        if (this.utils.is_array(id) && id.length == 2) {
            var params = [id[1]];
            var id = id[0];
        }

        // If object supplied, just output it directly
        if (this.utils.is_object(id)) {
            this.add_message(type, id, true);
            return (type == 'error' ? false : true);       
        }

        // Else perform language translation
        if (this.language == undefined) {
            this.language = require("../lang/lang.en");
        }
        params = this.utils.force_array(params);
        if ((this.language.hasOwnProperty(type)) && (this.language[type].hasOwnProperty(id))) {
            var str = this.language[type][id];

            // If serialized object is too long to fit on console, output it on multiple lines

            if (params.length == 1) {
                var result = this.outobj(type, str, '{0}', params[0])
                if (result !== -1) {
                    return result;
                }
            }

            // Else parse normally

            var expanded = false;
            params.forEach((param, idx) => {
                var placeholder = '{' + idx + '}';
                var expand = '{+' + idx + '}';
                var result = -1;
                if (str.includes(expand)) {
                    expanded  = true;
                    var result = this.outobj(type, str, expand, param);
                    if (result !== -1) {
                        return result;
                    }
                }
                var data = result == -1 ? (this.utils.is_array(param) || this.utils.is_object(param) ? this.utils.serialize(param) : param) : null;
                str = str.split(placeholder).join(data).trim();
                str = str.slice(-1) == ':' ? str.substr(0, str.length - 1) : str;
            });
            if ((!this.checkonce(str)) && (!expanded))
                this.add_message(type, str);
            return (type == 'error' ? false : true);
        }
        return this.add_message('error', 'Translation not found: ' + type + '.' + id);

    }


    // Some helper functions

    debug(id, params = []) {
        return this.translate('debug', id, params)
    }

    notice(id, params = []) {
        return this.translate('notice', id, params)
    }

    warning(id, params = []) {
        return this.translate('warning', id, params)
    }

    error(id, params = []) {
        return this.translate('error', id, params)
    }

    success(id, params = []) {
        return this.translate('success', id, params)
    }


    // Start a new section

    section(id, params = []) {
        this.add_blank();
        this.translate('section', id, params);
        this.add_blank();
    }


    // Start a New Subsection

    subsection(id, params = []) {
        this.add_blank();
        this.translate('subsection', id, params);
        this.add_blank();
    }


    // Reset output object

    reset() {
        this.output_obj = {
            result: 'success',
            type: null,
            data: null,
            cache: null,
            messages: []
        }
        this.once = [];
    }


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
    }


    // Add data to the output

    add_data(data = {}) {
        var type = this.get_object_class(data);
        if ((type.toLowerCase() == 'array') && (data.length > 0)) { // If data type is array, find out the type of the array elements
            var subtype = this.get_object_class(data[0]);
            type = subtype + '[]';
        }
        this.output_obj.type = type;
        this.output_obj.data = data;
    }


    // Create a blank line in the output log

    add_blank() {
        this.add_message('blank','')
    }


    // Add a message to the output

    add_message(type, message, settings = {}) {
        var defaults = {
            toLog:      true,
            toConsole:  true,
            toResults:  true,
            noTrim:     false
        };
        var settings = { ...defaults, ...settings };
        if (this.utils.is_object(message)) {
            var maxproplength = Object.getOwnPropertyNames(message).sort(
                function(a,b) {  
                  if (a.length > b.length) return -1;
                  if (a.length < b.length) return 1;
                  return 0
                }
              )[0].length;
            var objmsgs = [];
            //this.add_message(type, "{".padStart(3, " "), { toLog: false, toResults: false, noTrim: true });
            for (const [prop, val] of Object.entries(message)) {
                if (['apikey','secret','password','oldpassword','newpassword'].includes(prop.toLowerCase())) {
                    var outstr = '********';
                } else {
                    var outstr = this.utils.is_empty(val) ? null : this.utils.serialize(val);
                }
                if (outstr !== null)
                    objmsgs.push((prop + ": ").padEnd(maxproplength + 2, " ") + outstr);
            }     
            for (var i = 0; i < objmsgs.length; i++) {
                var objmsg = objmsgs[i];
                this.add_message(type, " ".padStart(2, " ") + (i == (objmsgs.length - 1) ? "└─ " : "├─ ") + objmsg, { toLog: false, toResults: false, noTrim: true });
            }
            //this.add_message(type, "}".padStart(3, " "), { toLog: false, toResults: false, noTrim: true });
            return true;
        }
        message = settings.noTrim === true ? message : message.replace(/\s+/g,' ');  // Trim message
        var maxwidth = process.stdout.columns - 35;
        var d = new Date();
        var ts = d.getTime();
        if (!['section','subsection','blank'].includes(type)) {  
            if (settings.toResults) {
                this.output_obj.messages.push({
                    'timestamp': ts,
                    'type': type.toUpperCase(),
                    'message': settings.noTrim === true ? message : message.replace(/\s+/g,' ').trim()
                })    
            }
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
        
        if ((this.mode == 'normal') && (typeof type_color_map[type] !== 'function')) {
            console.log(type);
        }

        if (!['section', 'subsection','blank'].includes(type)) {
            var logmessage = datetime + ' | ' + type.toUpperCase().padEnd(7) + ' | ' + message + eol
            if ((this.mode == 'normal') && (settings.toLog !== false)) {
                fs.appendFileSync(this.logfile, logmessage);
            }
            var logentry = {
                message_type : 'log',
                timestamp: ts,
                datetime: dateobj.toJSON(),
                type: type,
                message: message
            }
            if (global.hasOwnProperty('frostybot'))
                if (global.frostybot.hasOwnProperty('wss'))
                    global.frostybot.wss.emit('proxy', logentry)
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
        if ((this.mode == 'normal') && (settings.toConsole !== false)) {
            console.log(type_color_map[type](output));
        }
        if (type.toLowerCase() == 'error') {
            this.output_obj.result = 'error'
        }
    }

    brief_messages(messages = []) {
        var results = [];
        messages.forEach(message => {
            var dateobj = new Date(message.timestamp);
            let day = ("0" + dateobj.getDate()).slice(-2);
            let month = ("0" + (dateobj.getMonth() + 1)).slice(-2);
            let year = dateobj.getFullYear();
            let hour = ("0" + dateobj.getHours()).slice(-2);
            let minute = ("0" + dateobj.getMinutes()).slice(-2);
            let second = ("0" + dateobj.getSeconds()).slice(-2);
            var datestr = year + "-" + month + "-" + day + " " + hour + ":" + minute + ":" + second;
            results.push(datestr + ' | ' + message.type.padEnd(7) + ' | ' + message.message);
        });
        return results;
    }

    async format_output(output) {
        if (this.utils.is_false(await this.config.get('output:debug', false))) 
            output.messages = output.messages.filter(message => message.type.toLowerCase() != 'debug');
        
        switch (await this.config.get('output:messages', 'brief')) {
            case 'none'  : delete output.messages;
                           break;
            case 'brief' : output.messages = this.brief_messages(output.messages);
                           break;
        }   
        return output;         
    }

    // Parse raw output into a frostybot_output object

    async parse(result) {
        this.add_data(result);
        var output = new this.classes.output(...this.utils.extract_props(this.output_obj, ['command', 'params', 'result', 'type', 'data', 'messages']));
        this.reset();
        return await this.format_output(output);
    }


    // Combine multiple command outputs into a single command output

    async combine(results) {
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
        var output = new this.classes.output('<multiple>', null, result, type, data, messages);
        return await this.format_output(output);
    }

}