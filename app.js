var express     = require('express');
var bodyParser  = require('body-parser');

// Set App Title
process.title = "frostybot-js";

//var frostybot   = require('./lib/lib.frostybot');
var frostybot   = require('./core/core.frostybot');

// Initialize 

frostybot.initialize();
global.frostybot.modules.output.initialize();
global.frostybot.modules.output.section('frostybot_startup');

// Routers

var frostybotRouter = require('./routes/routes.frostybot');


var app = express();

// Trust reverse proxy if used
app.set('trust proxy', true);

// Save raw buffer for command parsing
function rawBufferSaver (req, res, buf, encoding) {
    if (buf && buf.length) {
      req.rawBody = buf.toString(encoding || 'utf8')
    }
}

// Body parsers
app.use(bodyParser.raw({ type: 'text/plain', verify: rawBufferSaver }));
app.use(bodyParser.json({ type: 'application/json' }));
app.use(bodyParser.urlencoded({ extended: true }));

// Route to router mappings
app.use('/frostybot', frostybotRouter);


module.exports = app;
