var express = require('express');
var router = express.Router();
const api = require('../core/core.api');

// Create routes

Object.keys(api).forEach(baseapi => {

    var routes = api[baseapi];

    for (var [routeinfo, command] of Object.entries(routes)) {

        var [method, route] = routeinfo.split('|')

        route = baseapi + route
        
        router[method](route, async function(req, res, next) {            

            const core = global.frostybot._modules_.core

            const routeparts = req.route.path.split('/')
            const baseapi = '/' + routeparts[1]
            const route = '/' + routeparts.slice(2).join('/')

            const api = require('../core/core.api');

            const routes = api.hasOwnProperty(baseapi) ? api[baseapi] : null

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
            
            var ip = (req.headers['x-forwarded-for'] || req.connection.remoteAddress).replace('::ffff:','').replace('::1, ','');

            if (core.verify_whitelist(ip)) {
                let result = await core.execute(params);
                res.send(result);
            } else {
                res.sendStatus(401);       // HTTP 401: Unauthorized;
            }    
        })

    }

})

module.exports = router;
