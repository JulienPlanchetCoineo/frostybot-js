const frostybot_module = require('./mod.base');
var context = require('express-http-context');
var axios = require('axios');

module.exports = class frostybot_gui_module extends frostybot_module {

    // Constructor

    constructor() {
        super()
    }

    // Enable GUI

    async enable(params) {
        var ip = context.get('srcIp');
        if (['127.0.0.1','::1'].includes(ip)) {
            var schema = {
                email: {
                    required: 'string',
                },
                password: {
                    required: 'string'
                },
                recaptchasite: {
                    optional: 'string'
                },
                recaptchasecret: {
                    optional: 'string'
                }
            }
    
            if (!(params = this.utils.validator(params, schema))) return false; 
    
            var [email, password, recaptchasite, recaptchasecret] = this.utils.extract_props(params, ['email', 'password', 'recaptchasite', 'recaptchasecret']);

            await this.settings.set('core','gui:recaptchasite', (recaptchasite != undefined ? recaptchasite : false));
            await this.settings.set('core','gui:recaptchasecret', (recaptchasecret != undefined ? recaptchasecret : false));

            if (await this.user.core(email, password)) {
                if (await this.settings.set('core','gui:enabled', true)) {
                    return this.output.success('gui_enable');
                }
            }
            return this.output.error('gui_enable');
        }
        return this.output.error('local_only');
    }

    // Disable GUI

    async disable(params = null) {
        var ip = context.get('srcIp');
        if (['127.0.0.1','::1'].includes(ip)) {
            if (await this.settings.set('core','gui:enabled', false)) {
                return this.output.success('gui_disable');
            }
            return this.output.error('gui_disable');
        }
        return this.output.error('local_only');
    }

    // Check if GUI is enabled

    async gui_is_enabled() {
        var enabled = await this.settings.get('core', 'gui:enabled', false);
        if (String(enabled) == "true")
            return true;
        else
            return false;
    }

    // Check if multi-user is enabled

    async multiuser_is_enabled() {
        var enabled = await this.settings.get('core', 'multiuser:enabled', false);
        if (String(enabled) == "true")
            return true;
        else
            return false;
    }

    // Extract request and response parameters

    extract_request(params) {
        if (params.hasOwnProperty('_raw_'))
            var raw = params['_raw_'];
        else
            var raw = { res: null, req: null};
        return [raw.res, raw.req];
    }

    // Load Main GUI Page

    async main(params) {
        var [res, req] = this.extract_request(params);
        if (!(await this.gui_is_enabled()))
            return this.render_error(res, 'GUI is not enabled.');
        return this.render_page(res, "pages/main", { pageTitle: 'Configuration' });
        //} else {
        //    return this.render_page(res, "pages/main", { pageTitle: 'Configuration', uuid: uuid });
        //} 
    }

    // Load Login Page

    async login(params) {
        var [res, req] = this.extract_request(params);
        if (!(await this.gui_is_enabled()))
            return this.render_error(res, 'GUI is not enabled.');
        var regsuccess = params.hasOwnProperty('regsuccess') ? params.regsuccess : false;
        var sessiontimeout = params.hasOwnProperty('sessiontimeout') ? params.sessiontimeout : false;
        /*
        var auth = await this.get_auth_config();
        if (auth !== false) {
            const oauth2Client = new OAuth2(auth.clientid, auth.secret, auth.url + '/ui/auth_callback');    
            const loginLink = oauth2Client.generateAuthUrl({
                access_type: 'offline', 
                scope: [
                    'https://www.googleapis.com/auth/plus.me', 
                    'https://www.googleapis.com/auth/userinfo.email',              
                ]
            });
            return this.render_page(res, "pages/login", { pageTitle: 'Login', loginLink: loginLink });
        }
        return res.send(auth);        
        */
        var multiuser = await this.settings.get('core','multiuser:enabled');
        var recaptchasite = await this.settings.get('core','gui:recaptchasite',false);
        return this.render_page(res, "pages/login", { pageTitle: 'Login', regsuccess: regsuccess, sessiontimeout: sessiontimeout, showregister: (multiuser ? true: false), recaptchasite: recaptchasite });
    }

    // Register User

    async register(params) {
        var [res, req] = this.extract_request(params);
        if (!(await this.multiuser_is_enabled()))
            return this.render_error(res, 'Cannot register more users. Multi-user mode is not enabled.');
        if (!(await this.gui_is_enabled()))
            return this.render_error(res, 'GUI is not enabled.');
        var recaptchasite = await this.settings.get('core','gui:recaptchasite',false);
        return this.render_page(res, "pages/register", { pageTitle: 'Register', recaptchasite: recaptchasite });
    }

    // Get Content

    async content(params) {
        var [res, req] = this.extract_request(params);
        if (!(await this.gui_is_enabled()))
            return this.render_error(res, 'GUI is not enabled.');
        var params = {...req.params, ...req.query};
        var token = params.hasOwnProperty('token') ? params.token : false;
        var uuid = token != false ? token.uuid : false;
        if (uuid == false) {
            return res.send({'error' : 'invalid_uuid'});
        } else {
            context.set('uuid', uuid);
            if (params.hasOwnProperty('key')) {
                var key = params.key;
                var data = { uuid : uuid };
                switch (key) {
                    case 'table_accounts'   :   var accounts = await this.accounts.get();
                                                data[key] = accounts;
                                                break;
                    case 'form_2fa'         :   if (params.hasOwnProperty('enable') && String(params.enable) == 'true') {
                                                    var secret = await this.user.create_2fa_secret();
                                                    var config = {
                                                        enabled: false,
                                                        enable: true,
                                                        secret: secret.secret.base32,
                                                        qrcode: secret.qrcode
                                                    }
                                                } else {
                                                    var user2fa = await this.user.get_2fa(uuid);
                                                    var config = {
                                                        enabled: (user2fa == false ? false : true),
                                                        enable: false,
                                                    };
                                                }
                                                data[key] = config;    
                                                break;
                    case 'form_config'      :   var config = {}
                                                if (params.hasOwnProperty('stub')) {
                                                    var stub = params.stub;
                                                    var shortname = await this.accounts.get_shortname_from_stub(stub);
                                                    var cachekey = 'symbols:' + shortname;
                                                    var cached = this.utils.cache.get(cachekey);
                                                    if (cached == undefined) {
                                                        var classes = require('./mod.classes');
                                                        var exchange = new classes.exchange(stub);
                                                        var markets = await exchange.execute('markets');
                                                        if (this.utils.is_array(markets)) {
                                                            var symbols = [];
                                                            markets.forEach(market => {
                                                                symbols.push(market.symbol);
                                                            });
                                                            symbols = symbols.sort();
                                                        }
                                                        this.utils.cache.set(key, symbols, 3600);
                                                        cached = symbols;
                                                    }
                                                    var allconfig = await this.config.getall();
                                                    const stubconfig = Object.keys(allconfig)
                                                                        .filter(filterkey => filterkey.indexOf(stub) !== -1)
                                                                        .reduce((obj, filterkey) => {
                                                                            obj[filterkey] = allconfig[filterkey];
                                                                            return obj;
                                                                        }, {});

                                                    var griddata = [];
                                                    symbols.forEach(symbol => {
                                                        var lowersymbol = symbol.toLowerCase();
                                                        var gridrow = [
                                                                symbol,
                                                                stubconfig.hasOwnProperty(stub + ':' + lowersymbol + ':ignored') ? Boolean(stubconfig[stub + ':' + lowersymbol + ':ignored']) : false,
                                                                stubconfig.hasOwnProperty(stub + ':' + lowersymbol + ':defsize') ? stubconfig[stub + ':' + lowersymbol + ':defsize'] : '',
                                                                stubconfig.hasOwnProperty(stub + ':' + lowersymbol + ':defstoptrigger') ? stubconfig[stub + ':' + lowersymbol + ':defstoptrigger'] : '',
                                                                stubconfig.hasOwnProperty(stub + ':' + lowersymbol + ':defprofittrigger') ? stubconfig[stub + ':' + lowersymbol + ':defprofittrigger'] : '',
                                                                stubconfig.hasOwnProperty(stub + ':' + lowersymbol + ':defprofitsize') ? stubconfig[stub + ':' + lowersymbol + ':defprofitsize'] : '',
                                                        ];
                                                        griddata.push(gridrow);
                                                    });
                                                    var gridstring = JSON.stringify(griddata);
                                                    let buff = new Buffer.from(gridstring);
                                                    let base64grid = buff.toString('base64');
                                                    config = {
                                                        stub: stub,
                                                        symbols: symbols,
                                                        providers: await this.signals.get_providers_by_stub(stub),
                                                        config: stubconfig,
                                                        griddata: base64grid,
                                                    }
                                                }
                                                data[key] = config;    
                                                break;

                }
                var template = key.split('_').join('.');
                return this.render_page(res, "partials/" + template + ".ejs", data);   
            } else {
                return res.send({'error' : 'invalid_key'});
            }
        }
    }

    // Verify Recaptcha Response

    async verify_recaptcha(params) {
        var response = params.response;
        var recaptchasecret = await this.settings.get('core','gui:recaptchasecret',false);
        if (recaptchasecret != false) {
            var result = await axios.post('https://www.google.com/recaptcha/api/siteverify?secret='+recaptchasecret+'&response='+response,{},{headers: {"Content-Type": "application/x-www-form-urlencoded; charset=utf-8"},});
            var data = result.data;
            if (data.success == true) 
                if (data.score >= 0.5) 
                    return this.output.success('gui_recaptcha', [data.score]);
                else
                    return this.output.error('gui_recaptcha', [data.score]);            
        }
        return this.output.error('gui_recaptcha', [false]);
    }

    // Render Page

    render_page(res, template, vars) {
        if (!vars.hasOwnProperty('uuid'))
            vars['uuid'] = '';
        return res.render(template, vars);
    }


    // Render Error

    render_error(res, message) {
        return res.render("pages/error", { pageTitle: 'Error', errorMsg: message });
    }



}