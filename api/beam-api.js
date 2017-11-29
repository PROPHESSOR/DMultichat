"use strict";


const winston = require("../libs/logger");
const beam = require("beam-client-node");
const beamsocket = require("beam-client-node/lib/ws");

let _config = null;
let _isReady = false;
let _newMessages = [];
let _userData = null;
let _chatData = null;

function initialize(config) {
    _config = config.live_data.beam;

    // Retrieve channel id/user id/chat endpoints and auth token
    const b = new beam();

    b.use("password", {
        "username": _config.username,
        "password": _config.password
    }).attempt().then((data) => {
        winston.info(`Beam API is now connected with ${_config.username} account!`, {"source": "beam"});
        _userData = data.body;

        return b.chat.join(_userData.channel.id);
    }).then((res) => {
        winston.info("Joining the chat", {"source": "beam"});
        _chatData = res.body;

        initializeSocket();
    }).catch((err) => {
        winston.info(err, {"source": "beam"});
    });
}

function initializeSocket() {
    const socket = new beamsocket(_chatData.endpoints).boot();

    // You don't need to wait for the socket to connect before calling methods,
    // we spool them and run them when connected automatically!
    socket.auth(_userData.channel.id, _userData.id, _chatData.authkey).then(() => {
        ready();
    }).catch((err) => {
        winston.error("Oh no! An error occurred trying to connect to the chat web socket!", {"source": "beam"});
    });

    socket.on("ChatMessage", (data) => {
        let message = "";

        data.message.message.forEach((elt) => {
            switch (elt.type) {
                case "text":
                    message += elt.data;
                    break;
                case "emoticon":
                    message += elt.text;
                    break;
                default:
                    winston.log("Wtf");
            }
        });

        const chatMessage = {
            "type": "chat",
            "author": data.user_name,
            message,
            "source": "beam",
            "date": new Date().getTime()
        };

        _newMessages.push(chatMessage);
    });
}

function ready() {
    winston.info(`Beam API is ready to use (connected to ${_config.username})`, {"source": "beam"});
    _isReady = true;

    _newMessages.push({
        "type": "system",
        "source": "beam",
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