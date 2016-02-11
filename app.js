"use-strict";

var fs         = require('fs');
var express    = require('express'),
	app        = express(),
	router     = express.Router(),
	bodyParser = require('body-parser'),
	https      = require('https');

var config         = require('./lib/config');
var CitadelsSocket = require('./lib/socket');

app.disable('x-powered-by');
app.use(bodyParser.json({ limit: config.jsonLimit }));
app.use(config.contextPath, router);

var options = {
    // key: fs.readFileSync("keys/server.key"),
    // cert: fs.readFileSync("keys/server.crt")
};
var httpsServer = https.createServer(options, app).listen(config.httpsPort, function() {
    console.log("listening with https on *:" + config.httpsPort);
    console.log('using Cloudant at ' + config.cloudantUrl + ', database ' + config.cloudantDB);
});

var io = require('socket.io')(httpsServer);

var _socket = new CitadelsSocket(io);
io.on('connection', _socket.onConnect);
