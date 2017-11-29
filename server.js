"use strict";

const http = require("http");
const express = require("express");
const socketio = require("socket.io");
const async = require("async");
const path = require("path");
const ipfilter = require("express-ipfilter");

let config;

try {
    config = require("./config.json");
} catch (e) {
    // winston.error(`Error loading config file: ${e}`);
    throw new Error(`Ошибка чтения файла конфигурации! ${e}`);
}

if (!config.host || !config.port) {
    // winston.error("Error loading config file: host or port is missing!");
    throw new Error(`В конфиге должны быть хост и порт! ${e}`);
}

// FIXME: Костыль
let logcb = () => {};

function _logger(data) {
    if (typeof data === "object") {
        try {
            data = JSON.stringify(data, null, 4);
        } catch (e) {}
    }
    console.log(`[${Date.now()}]`, data); //eslint-disable-line
    logcb(data);
}

const logger = {
    "log": _logger,
    "warn": _logger,
    "error": _logger,
    "info": _logger,
    "debug": _logger
}


const youtubeApi = require("./api/youtube-api");
const twitchApi = require("./api/twitch-api");
const hitboxApi = require("./api/hitbox-api");
const beamApi = require("./api/beam-api");
const dailymotionApi = require("./api/dailymotion-api");

let chatMessageId = 0;
const chatMessages = [];
const systemMessages = [];
const maxMessagesStored = 100;

let server, io;

function setLogger(logfnc) {
    logcb = logfnc;
}

function run(callback) {
    logger.log("Запуск сервера...");

    // initialize all APIs
    if (config.live_data.youtube.enabled) {
        youtubeApi.initialize(config);
    }

    if (config.live_data.twitch.enabled) {
        twitchApi.initialize(config);
    }

    if (config.live_data.hitbox.enabled) {
        hitboxApi.initialize(config);
    }

    if (config.live_data.beam.enabled) {
        beamApi.initialize(config);
    }

    if (config.live_data.dailymotion.enabled) {
        dailymotionApi.initialize(config);
    }

    const app = express();

    app.use(express.static("public"));
    app.use(ipfilter(config.whitelisted_ips, {
        "mode": "allow",
        "logF": logger.info
    }));

    server = http.Server(app);
    io = socketio(server);

    io.on("connection", (socket) => {
        logger.info("Someone has connected to the chat");
        socket.emit("connected");

        // send only the last 10 messages
        const chatMessagesToSend = chatMessages.slice(Math.max(chatMessages.length - 10, 0));

        io.emit("oldChatMessages", chatMessagesToSend);

        // send system messages
        io.emit("oldSystemMessages", systemMessages);
    });

    app.get("/", (req, res) => {
        res.sendFile(path.join(__dirname, "/public/chat.html"));
    });

    if (config.live_data.youtube.enabled && config.live_data.youtube.redirect_url) {
        app.get(config.live_data.youtube.redirect_url, (req, res) => {
            youtubeApi.getToken(req.query.code);
            res.redirect("/");
        });
    }

    server.listen(config.port, () => {
        logger.info(`Сервер запущен на порте: ${config.port}`);
        if (callback) callback();
    });

    // retrieve new messages
    let newMessages = [];

    async.forever(
        (next) => {

            if (config.live_data.youtube.enabled) {
                youtubeApi.getNewMessages().forEach((elt) => {
                    newMessages.push(elt);
                });
            }

            if (config.live_data.twitch.enabled && twitchApi.isReady()) {
                twitchApi.getNewMessages().forEach((elt) => {
                    newMessages.push(elt);
                });
            }

            if (config.live_data.hitbox.enabled && hitboxApi.isReady()) {
                hitboxApi.getNewMessages().forEach((elt) => {
                    newMessages.push(elt);
                });
            }

            if (config.live_data.beam.enabled && beamApi.isReady()) {
                beamApi.getNewMessages().forEach((elt) => {
                    newMessages.push(elt);
                });
            }

            if (config.live_data.dailymotion.enabled && dailymotionApi.isReady()) {
                dailymotionApi.getNewMessages().forEach((elt) => {
                    newMessages.push(elt);
                });
            }

            if (newMessages.length > 0) {
                logger.info(newMessages);

                newMessages.forEach((elt) => {
                    if (elt.type === "chat") {
                        // affect a unique id to each message
                        elt.id = chatMessageId;
                        chatMessageId++;

                        chatMessages.push(elt);

                        // make sure to keep less than the maximum allowed
                        if (chatMessages.length > maxMessagesStored) {
                            chatMessages.shift();
                        }

                        io.emit("newChatMessage", elt);
                    } else if (elt.type === "system") {
                        systemMessages.push(elt);

                        if (systemMessages.length > maxMessagesStored) {
                            systemMessages.shift();
                        }

                        io.emit("newSystemMessage", elt);
                    }
                });

                newMessages = [];
            }

            setTimeout(next, 1000);
        },
        (err) => {
            logger.error(`Error retrieving new messages: ${err}`);
        }
    );

}

function stop() {
    server.close();

    return true;
}

exports.getServer = () => server;
exports.getIo = () => io;
exports.setLogger = setLogger;
exports.run = run;
exports.stop = stop;

// Автозапуск сервера при старте из ноды
if (!module.parent) run();