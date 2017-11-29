"use strict";

const irc = require("tmi.js");
const winston = require("../libs/logger");

let _config = null;
let _isReady = false;
let _newMessages = [];

function initialize(config) {
    _config = config.live_data.twitch;

    const options = {
        "options": {"debug": false},
        "connection": {"reconnect": true},
        "channels": [_config.channel]
    };

    const client = new irc.client(options);

    client.on("connected", (address, port) => {
        ready();
    });

    client.on("chat", (channel, user, message, self) => {
        const chatMessage = {
            "type": "chat",
            "author": user["display-name"],
            "color": user.color,
            message,
            "emotes": user.emotes,
            "source": "twitch",
            "date": new Date().getTime()
        };

        _newMessages.push(chatMessage);
    });

    client.connect();
}

function ready() {
    winston.info(`Twitch API is ready to use (connected to ${_config.channel})`, {"source": "twitch"});
    _isReady = true;

    _newMessages.push({
        "type": "system",
        "source": "twitch",
        "date": new Date().getTime(),
        "message": "ready"
    });
}

function isReady() {
    return _isReady;
}

function getNewMessages() {
    if (_newMessages.length === 0) return [];

    const newMessage = _newMessages;

    _newMessages = [];

    return newMessage;
}

exports.initialize = initialize;
exports.isReady = isReady;
exports.getNewMessages = getNewMessages;