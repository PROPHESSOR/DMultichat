"use strict";


const winston = require("../libs/logger");
const eventsource = require("eventsource");

let _config = null;
let _isReady = false;
let _newMessages = [];

function initialize(config) {
    _config = config.live_data.dailymotion;

    const url = `${_config.grosminet_endpoint}/rooms/${_config.room}`;
    const es = new eventsource(url);

    es.addEventListener("open", (data) => {
        ready();
    });

    es.addEventListener("error", (data) => {
        winston.error(data, {"source": "dailymotion"});
    });

    es.addEventListener("message", (event) => {
        if (event.type == "message") {
            const message = JSON.parse(event.data);

            winston.info("New message: ", message);

            const chatMessage = {
                "type": "chat",
                "author": message.s,
                "message": message.m,
                "source": "dailymotion",
                "date": new Date().getTime(),
                "color": `#${message.c}`
            };

            _newMessages.push(chatMessage);
        }
    });
}

function ready() {
    winston.info("Dailymotion API is ready to use!", {"source": "dailymotion"});
    _isReady = true;

    _newMessages.push({
        "type": "system",
        "source": "dailymotion",
        "date": new Date().getTime(),
        "message": "ready"
    });
}

function isReady() {
    return _isReady;
}

function getNewMessages() {
    if (_newMessages.length == 0) return [];

    const newMessage = _newMessages;

    _newMessages = [];

    return newMessage;
}

exports.initialize = initialize;
exports.isReady = isReady;
exports.getNewMessages = getNewMessages;