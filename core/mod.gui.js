const frostybot_module = require('./mod.base')
const google = require('googleapis').google;
const jwt = require('jsonwebtoken');
const OAuth2 = google.auth.OAuth2;
var context = require('express-http-context');

module.exports = class frostybot_gui_module extends frostybot_module {

    // Constructor

    constructor() {
        super()
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
        var uuid = await this.get_uuid(req);
        if (uuid == false) {
            return res.redirect('/ui/login');
        } else {
            return this.render_page(res, "pages/main", { pageTitle: 'Configuration', uuid: uuid });
        } 
    }

    // Load Login Page

    async login(params) {
        var [res, req] = this.extract_request(params);
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
    }

    // Get Content

    async content(params) {
        var [res, req] = this.extract_request(params);
        var params = {...req.params, ...req.query};
        var uuid = params.hasOwnProperty('uuid') ? params.uuid : false;
        if (uuid == false) {
            return res.send({'error' : 'invalid_uuid'});
        } else {
            context.set('uuid', uuid);
            if (params.hasOwnProperty('key')) {
                var key = params.key;
                var data = { uuid : uuid };
                switch (key) {
                    case 'table_apikeys'    :   var accounts = await global.frostybot._modules_['accounts'].get();
                                                data[key] = accounts;
                                                break;
                }
                var template = key.split('_').join('.');
                return this.render_page(res, "partials/" + template + ".ejs", data);   
            } else {
                return res.send({'error' : 'invalid_key'});
            }
        }
    }

    // Authentication Callback
    async auth_callback(params) {
        var [res, req] = this.extract_request(params);
        var auth = await this.get_auth_config();
        if (auth !== false) {
            const oauth2Client = new OAuth2(auth.clientid, auth.secret, auth.url + '/ui/auth_callback');    
            if (req.query.error) {
                return this.render_error(res, 'User did not grant required permissions');
            } else {
                oauth2Client.getToken(req.query.code, function(err, token) {
                    if (err)
                        return this.render_error(res, JSON.stringify(err));
                    else {
                        res.cookie('frostybot', jwt.sign(token, auth.jwt_secret));
                        return res.redirect('/ui');
                    }
                });
                return res;
            }    
        } else return this.render_error(res, 'Authentication is not configured');
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

    // Get authentication configuration from database

    async get_auth_config() {
        const core = await this.settings.get('core');
        var auth = {};
        ['url', 'clientid', 'secret'].forEach(setting => {
            auth[setting] = core.hasOwnProperty('auth:' + setting) ? core['auth:' + setting] : null;
        })
        if ((auth.clientid != null) && (auth.secret != null) && (auth.url != null)) {
            auth['jwt_secret'] = '72J8_W,LDB9H[HLNMvn,}PZ';
            return auth;
        }
        return false;
    }

    // Create new user if email address does not exist

    async create_user(email) {
        var uuid = await this.multiuser.uuid_by_email(email);
        if (uuid == false) {
            var uuid = await this.multiuser.add({ email: email});        
        }
        return uuid;
    }

    // Get UUID

    async get_uuid(req) {
        var token = null;
        if ((typeof(req) == 'string') && (req.length == 36)) {
            var uuid = req;
            token = await this.multiuser.get_token(uuid, true);
            if (token == false) return false;
        } else {
            if (!req.cookies && !req.cookies.frostybot) 
                return false;
        }
        if (req.cookies.frostybot == null)
            return false;
        var auth = await this.get_auth_config();
        if (auth !== false) {
            const oauth2Client = new OAuth2(auth.clientid, auth.secret, auth.url + '/ui/auth_callback');   
            var token = token == null ? jwt.verify(req.cookies.frostybot, auth.jwt_secret) : token;
            var ts = (new Date()).getTime();
            oauth2Client.setCredentials(token);
            var oauth2 = google.oauth2({
                auth: oauth2Client,
                version: 'v2'
            });
            var response = await oauth2.userinfo.v2.me.get();
            if (response.hasOwnProperty('data')) {
                var data = response.data;
                if (data.hasOwnProperty('email')) {
                    var email = data.email;
                    var uuid = await this.create_user(email);
                    await this.database.update('users', {token : JSON.stringify(token), expiry: token.expiry_date}, {uuid: uuid});
                    return uuid;
                }
            }
            return render_error(res, 'Cannot retrieve user info from Google');
        } else return false;
    }


}