var express = require('express');
var router = express.Router();
const api = require('../core/core.api');

// Create routes

Object.keys(api).forEach(baseapi => {

    var routes = api[baseapi];

    for (var [routeinfo, command] of Object.entries(routes)) {

        var [method, route] = routeinfo.split('|')

        //route = baseapi + route
        
        router[method](route, async function(req, res, next) {            

            const core = global.frostybot._modules_.core

            const routeparts = req.route.path.split('/')
            const baseapi = '/' + routeparts[1]
            const route = '/' + routeparts.slice(1).join('/')

            const api = require('../core/core.api');
            var baseapis = Object.keys(route);
            for (var i =0; i < baseapis.count; i++) {
                const routes = api.hasOwnProperty(baseapi) ? api[baseapi] : null
                if (routes != null) break;
            }
            const routeinfo = [req.method.toLowerCase(), route].join('|')

            if (routes.hasOwnProperty(routeinfo)) {
                var command = {command: routes[routeinfo]}
            }

            if (req.rawBody !== undefined) {
                var body = core.parse_raw(req.rawBody)
            } else {
                var body = req.body
            }

            var params = {
                body: {...command, ...req.params, ...req.query, ...body}
            }
            
            // Uncomment the second line below if using Frostybot behind a reverse proxy
            // Current commented out to prevent source address spoofing using x-forwarded-for headers
            var ip = (req.socket.remoteAddress).replace('::ffff:','').replace('::1, ','');
            var uuid = params.hasOwnProperty('uuid') ? params.uuid : (params.hasOwnProperty('body') && params.body.hasOwnProperty('uuid') ? params.body.uuid : null);
            var token = params.hasOwnProperty('token') ? params.token : (params.hasOwnProperty('body') && params.body.hasOwnProperty('token') ? params.body.token : null);
            //var ip = (req.headers['x-forwarded-for'] || req.connection.remoteAddress).replace('::ffff:','').replace('::1, ','');
            if (await core.verify_access(ip, uuid, token, params)) {
                let result = await core.execute(params);
                res.send(result);
            } else {
                res.sendStatus(401);       // HTTP 401: Unauthorized;
            }        
        })

    }

})

module.exports = router;
