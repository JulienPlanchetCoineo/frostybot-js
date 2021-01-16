// Bootloader for Unit Tests

const fs = require('fs');

module.exports = class frostybot_core_test {


    constructor() {

        // Outout MOTD

        if (!global.hasOwnProperty('motd')) {
            var motd = fs.readFileSync(__dirname.substr(0, __dirname.lastIndexOf( '/' ) ) + '/scripts/motd', {encoding:'utf8', flag:'r'});
            console.log(motd)
            global['motd'] = true;
        }

        // Load and link modules

        global.frostybot = {
            _modules_  : {},
            settings   : {},
            command    : 'test',
            method     : 'run'
        };

        const dir = __dirname.substr(0, __dirname.lastIndexOf( '/' ) );

        const dbcfgfile = dir + '/.dbcfg';
        var dbcfgjson = fs.readFileSync(dbcfgfile, {encoding:'utf8', flag:'r'}); 
        if (dbcfgjson.length > 0) {
            var dbcfg = JSON.parse(dbcfgjson);
            var dbtype = (dbcfg.hasOwnProperty('type') ? dbcfg.type : 'sqlite').toLowerCase();
            if (!global.hasOwnProperty('frostybot')) global.frostybot = {}
            if (!global.frostybot.hasOwnProperty('_modules_')) global.frostybot._modules_ = {}
            var mod = require(dir + '/core/core.database.' + dbtype)
            var obj = (typeof(mod) == 'function') ? new mod() : mod
            global.frostybot._modules_['database'] = obj

        }

        fs.readdirSync( dir + '/core/' ).forEach( file => {
            if ((file.indexOf('mod.') == 0) && (file.indexOf('mod.base.') < 0)) {
                var module = file.split('.')[1];
                var mod = require('../core/mod.' + module)
                var obj = (typeof(mod) == 'function') ? new mod() : mod
                global.frostybot._modules_[module] = obj    
            }
        });

        var modules = Object.keys(global.frostybot._modules_);

        modules.forEach(module => {
            if (typeof(global.frostybot._modules_[module]['module_maps']) == 'function') {
                global.frostybot._modules_[module].module_maps()
            }
        })

        modules.forEach(module => {
            if (typeof(global.frostybot._modules_[module]['initialize']) == 'function') {
                global.frostybot._modules_[module].initialize('test');
            }
            this[module] = global.frostybot._modules_[module];
        })

    }

    title(name) {
        return ''.padEnd(72, '─') + "\n   " + name + "\n  ".padEnd(75, '─') + "\n"
    }

    function(name) {
        return '• ' + name.replace('()', '') + '()'
    }

}

