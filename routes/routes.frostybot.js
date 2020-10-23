var express = require('express');
var router = express.Router();

const core = require('../core/core.frostybot');

// Frostybot API
router.post('/', async function(req, res, next) {

    core.initialize();

    var ip = (req.headers['x-forwarded-for'] || req.connection.remoteAddress).replace('::ffff:','').replace('::1, ','');

    if (core.verify_whitelist(ip)) {
        let result = await core.execute(req);
        res.send(result);
    } else {
        res.sendStatus(401);       // HTTP 401: Unauthorized;
    }

});

module.exports = router;
