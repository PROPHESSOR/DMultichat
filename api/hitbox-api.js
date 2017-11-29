"use strict";

const http = require("https");
const hitbox = require("hitbox-chat");
const winston = require("winston");

let _config = null;
let _isReady = false;
let _newMessages = [];
let _colors = ["000000"];
const _userColorsMap = {};

function initialize(config) {
    _config = config.live_data.hitbox;

    const client = new hitbox();

    client.on("connect", () => {

        const channel = client.joinChannel(_config.channel);

        channel.on("login", (name, role) => {
            ready();
        });

        channel.on("chat", (author, message, role) => {
            if (!(author in _userColorsMap) ||
                author in _userColorsMap && _userColorsMap[author] === "000000" && _colors.length > 1) {
                _userColorsMap[author] = _colors[Math.floor(Math.random() * _colors.length)];
            }

            const chatMessage = {
                "type": "chat",
                author,
                message,
                "source": "hitbox",
                "date": new Date().getTime(),
                "color": `#${_userColorsMap[author]}`
            };

            _newMessages.push(chatMessage);
        });
    });

    // hitbox-chat lib can throw exceptions into asynchronous functions
    // we don't want that the server crashes, so we handle them here
    process.on("uncaughtException", (err) => {
        winston.error(err, {"source": "hitbox"});
    })
}

function ready() {
    winston.info(`Hitbox API is ready to use (connected to ${_config.channel})`, {"source": "hitbox"});
    _isReady = true;

    _newMessages.push({
        "type": "system",
        "source": "hitbox",
        "date": new Date().getTime(),
        "message": "ready"
    });

    // Get available colors
    http.get("https://api.hitbox.tv/chat/colors", (res) => {
        res.setEncoding("utf8");
        res.on("data", (chunk) => {
            const json = JSON.parse(chunk);

            if (json && json.colors) _colors = _colors.concat(json.colors);
        })
    }).on("error", (e) => {
        winston.error(e.message, {"source": "hitbox"});
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