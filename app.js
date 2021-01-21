var express     = require('express');
var bodyParser  = require('body-parser');
const fs        = require('fs'); 
const { v4: uuidv4 } = require('uuid');
var context     = require('express-http-context');

// Set App Title

process.title = "frostybot-js";

// Load Modules

const loader      = require('./core/core.loader');
loader.load_all()

// API Router

var apiRouter = require('./routes/routes.api');  

// Load Express

var app = express();

// Get Listen Port

const portfile = __dirname + '/.port';
var port = 80
try {
  var port = fs.readFileSync(portfile, {encoding:'utf8', flag:'r'}) 
} catch {
  var port = (process.env.FROSTYBOT_PORT || 80);
}
app.set('port', port);
fs.writeFileSync(portfile, port)

// Trust reverse proxy if used
// Only use this if you are configuring Frostybot behind a reverse proxy
// Currently disabled to prevent source address spoofing using X-Forward-For headers
// app.set('trust proxy', true); 

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

// Unique Request ID (HTTP Context)

app.use(context.middleware);
app.use(function(req, res, next) {
    context.set('reqId', uuidv4());
    var reqId = context.get('reqId');
    next();
});

// Map to Main API router

app.use('/', apiRouter);

// Map to UI

app.use('/ui', express.static('ui'))

// Export app

module.exports = app;
