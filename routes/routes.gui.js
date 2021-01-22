var express = require('express');
var router = express.Router();
const google = require('googleapis').google;
const jwt = require('jsonwebtoken');
const OAuth2 = google.auth.OAuth2;
var context = require('express-http-context');

// Render Page

function render_page(res, template, vars) {
    if (!vars.hasOwnProperty('uuid'))
        vars['uuid'] = '';
    return res.render(template, vars);
}


// Render Error
function render_error(res, message) {
    return res.render("pages/error", { pageTitle: 'Error', errorMsg: message });
}


// Get authentication configuration from database

async function get_auth_config() {
    const core = await global.frostybot._modules_['settings'].get('core');
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

async function create_user(email) {
    var uuid = await global.frostybot._modules_['multiuser'].uuid_by_email(email);
    if (uuid == false) {
        var uuid = await global.frostybot._modules_['multiuser'].add({ email: email});        
    }
    return uuid;
}

// Route for /ui/login

router.get('/login', async function (req, res) {
    var auth = await get_auth_config();
    if (auth !== false) {
        const oauth2Client = new OAuth2(auth.clientid, auth.secret, auth.url + '/ui/auth_callback');    
        const loginLink = oauth2Client.generateAuthUrl({
            access_type: 'offline', 
            scope: [
                'https://www.googleapis.com/auth/plus.me', 
                'https://www.googleapis.com/auth/userinfo.email',              
              ]
        });
        return render_page(res, "pages/login", { pageTitle: 'Login', loginLink: loginLink });
    }
    res.send(auth);
});


// Authentication Callback

router.get('/auth_callback', async function (req, res) {
    var auth = await get_auth_config();
    if (auth !== false) {
        const oauth2Client = new OAuth2(auth.clientid, auth.secret, auth.url + '/ui/auth_callback');    
        if (req.query.error) {
            return render_error(res, 'User did not grant required permissions');
        } else {
            oauth2Client.getToken(req.query.code, function(err, token) {
                if (err)
                    return render_error(res, JSON.stringify(err));
                else {
                    res.cookie('frostybot', jwt.sign(token, auth.jwt_secret));
                    return res.redirect('/ui');
                }
            });
        }    
    } else return render_error(res, 'Authentication is not configured');
});


// User Dashboard

router.get('/', async function (req, res) {
    var uuid = await get_uuid(req);
    if (uuid == false) {
        return res.redirect('/ui/login');
    } else {
        return render_page(res, "pages/main", { pageTitle: 'Configuration', uuid: uuid });
    } 
});


// Partial Output Router

router.get('/partial/:uuid/:key', async function (req, res) {
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
            return render_page(res, "partials/" + template + ".ejs", data);   
        } else {
            return res.send({'error' : 'invalid_key'});
        }
    }
});

// Get UUID

async function get_uuid(req) {
    var token = null;
    if ((typeof(req) == 'string') && (req.length == 36)) {
        var uuid = req;
        token = await this.multiuser.get_token(uuid, true);
        if (token == false) return false;
    } else {
        if (!req.cookies.frostybot) 
            return false;
    }
    var auth = await get_auth_config();
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
                var uuid = await create_user(email);
                await global.frostybot._modules_['database'].update('users', {token : JSON.stringify(token), expiry: token.expiry_date}, {uuid: uuid});
                return uuid;
            }
        }
        return render_error(res, 'Cannot retrieve user info from Google');
    } else return false;
}


module.exports = router;