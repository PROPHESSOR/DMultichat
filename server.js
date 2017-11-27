var http = require('http');
var express = require('express');
var socketio = require('socket.io');
var async = require('async');
var fs = require('fs');
var path = require('path');
var mkdirp = require('mkdirp');
// var winston = require('winston');
var ipfilter = require('express-ipfilter');

var config;
try {
    config = require('./config.json');
} catch (e) {
    winston.error('Error loading config file: ' + e);
    throw `Ошибка чтения файла конфигурации! ${e}`;
}

if (!config.host || !config.port) {
    winston.error('Error loading config file: host or port is missing!');
    throw `В конфиге должны быть хост и порт! ${e}`;
}
/*

winston.addColors({
    debug: 'green',
    info: 'cyan',
    silly: 'magenta',
    warn: 'yellow',
    error: 'red'
});

var logger = new winston.Logger({
    emitErrs: true,
    transports: [
        new winston.transports.Console({
            level: 'debug',
            name: 'console',
            handleExceptions: true,
            // prettyPrint: true,
            silent: false,
            timestamp: true,
            colorize: true,
            json: false
        }),
        new winston.transports.File({
            name: 'info',
            filename: './logs/info.log',
            level: 'info',
            colorize: true
        }),
        new winston.transports.File({
            name: 'error',
            filename: './logs/error.log',
            level: 'error',
            colorize: true
        })
    ],
    exitOnError: false
});

logger = logger.log("debug");

// winston.log = logger.transports.info.;
*/
/* 
winston.add(winston.transports.File, {
    name: 'info',
    filename: './logs/info.log',
    level: 'info',
    colorize: true
});

winston.add(winston.transports.File, {
    name: 'error',
    filename: './logs/error.log',
    level: 'error',
    colorize: true
});
 */
// winston.lo


// test.on('logged', function(){
//     console.log(`[asjkdhflkashflksdf] ${arguments}`);
// })

// debugger;
//FIXME: Костыль
var logcb = () => {};

function _logger(data) {
    if (typeof data === 'object')
        try {
            data = JSON.parse(data);
        } catch (e) {}
    console.log(`[${Date.now()}]`, data);
    logcb(data);
}
logger = {
    log: _logger,
    warn: _logger,
    error: _logger,
    info: _logger,
    debug: _logger
}


var youtubeApi = require('./api/youtube-api');
var twitchApi = require('./api/twitch-api');
var hitboxApi = require('./api/hitbox-api');
var beamApi = require('./api/beam-api');
var dailymotionApi = require('./api/dailymotion-api');

var chatMessageId = 0;
var chatMessages = [];
var systemMessages = [];
var maxMessagesStored = 100;

var server, io;

function run(callbacks) {
    if (callbacks && callbacks.log) {
        // logger.on('logged', callbacks.log);
        logcb = callbacks.log;
    }

    logger.log("lol");

    // Initialize all APIs
    if (config.live_data.youtube.enabled)
        youtubeApi.initialize(config);

    if (config.live_data.twitch.enabled)
        twitchApi.initialize(config);

    if (config.live_data.hitbox.enabled)
        hitboxApi.initialize(config);

    if (config.live_data.beam.enabled)
        beamApi.initialize(config);

    if (config.live_data.dailymotion.enabled)
        dailymotionApi.initialize(config);

    var app = express();
    app.use(express.static('public'));
    app.use(ipfilter(config.whitelisted_ips, {
        mode: 'allow',
        logF: logger.info
    }));

    server = http.Server(app);
    io = socketio(server);

    io.on('connection', function (socket) {
        logger.info('Someone has connected to the chat');
        socket.emit('connected');

        // Send only the last 10 messages
        chatMessagesToSend = chatMessages.slice(Math.max(chatMessages.length - 10, 0));
        io.emit('oldChatMessages', chatMessagesToSend);

        // Send system messages
        io.emit('oldSystemMessages', systemMessages);
    });

    app.get('/', function (req, res) {
        res.sendFile(path.join(__dirname, '/public/chat.html'));
    });


    if (config.live_data.youtube.enabled && config.live_data.youtube.redirect_url) {
        app.get(config.live_data.youtube.redirect_url, function (req, res) {
            youtubeApi.getToken(req.query.code);
            res.redirect('/');
        });
    }

    server.listen(config.port, function () {
        logger.info('listening on *: ' + config.port);
        if (callbacks && callbacks.cb) callbacks.cb();
    });

    // Retrieve new messages
    var newMessages = [];
    async.forever(
        function (next) {

            if (config.live_data.youtube.enabled) {
                youtubeApi.getNewMessages().forEach(function (elt) {
                    newMessages.push(elt);
                });
            }

            if (config.live_data.twitch.enabled && twitchApi.isReady()) {
                twitchApi.getNewMessages().forEach(function (elt) {
                    newMessages.push(elt);
                });
            }

            if (config.live_data.hitbox.enabled && hitboxApi.isReady()) {
                hitboxApi.getNewMessages().forEach(function (elt) {
                    newMessages.push(elt);
                });
            }

            if (config.live_data.beam.enabled && beamApi.isReady()) {
                beamApi.getNewMessages().forEach(function (elt) {
                    newMessages.push(elt);
                });
            }

            if (config.live_data.dailymotion.enabled && dailymotionApi.isReady()) {
                dailymotionApi.getNewMessages().forEach(function (elt) {
                    newMessages.push(elt);
                });
            }

            if (newMessages.length > 0) {
                logger.info(newMessages);

                newMessages.forEach(function (elt) {
                    if (elt.type == 'chat') {
                        // Affect a unique id to each message
                        elt.id = chatMessageId;
                        chatMessageId++;

                        chatMessages.push(elt);

                        // Make sure to keep less than the maximum allowed
                        if (chatMessages.length > maxMessagesStored)
                            chatMessages.shift();

                        io.emit('newChatMessage', elt);
                    } else if (elt.type == 'system') {
                        systemMessages.push(elt);

                        if (systemMessages.length > maxMessagesStored)
                            systemMessages.shift();

                        io.emit('newSystemMessage', elt);
                    }
                });

                newMessages = [];
            }

            setTimeout(next, 1000);
        },
        function (err) {
            logger.error('Error retrieving new messages: ' + err);
        }
    );

}

function stop() {
    server.close();
    return true;
}

// Create a new directory for log files
mkdirp('./logs', function (err) {
    if (err)
        logger.error('Unable to create the log folder', err);
});

exports.run = run;
exports.stop = stop;