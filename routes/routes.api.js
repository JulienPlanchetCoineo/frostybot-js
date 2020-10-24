var express = require('express');
var router = express.Router();

const core = require('../core/core.frostybot');
const api = require('../core/core.api');

// Create routes

Object.keys(api).forEach(baseapi => {

    var routes = api[baseapi];

    for (var [routeinfo, command] of Object.entries(routes)) {

        var [method, route] = routeinfo.split('|')

        route = baseapi + route
        
        router[method](route, async function(req, res, next) {
            
            const routeparts = req.route.path.split('/')
            const baseapi = '/' + routeparts[1]
            const route = '/' + routeparts.slice(2).join('/')

            const api = require('../core/core.api');
            const routes = api.hasOwnProperty(baseapi) ? api[baseapi] : null

            const routeinfo = [req.method.toLowerCase(), route].join('|')
            if (routes.hasOwnProperty(routeinfo)) {
                var command = {command: routes[routeinfo]}
            }

            var params = {
                body: {...command, ...req.params, ...req.query, ...req.body}
            }
            
            core.initialize();
            
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
