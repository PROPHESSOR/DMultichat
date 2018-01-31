"use strict";

const fs = require("fs");
const google = require("googleapis");
const googleAuth = require("google-auth-library");
const winston = require("../libs/logger");

const SCOPES = [
    "https://www.googleapis.com/auth/youtube.readonly",
    "https://www.googleapis.com/auth/youtube",
    "https://www.googleapis.com/auth/youtube.force-ssl"
];
const TOKEN_DIR = ".credentials/";
const TOKEN_PATH = `${TOKEN_DIR}youtube-credentials.json`;

const _youtube = google.youtube("v3");
let _liveChatId = "";
let _isReady = false;
let _lastCheckTime = new Date().getTime();
let _auth = null;
const _userColorsMap = {};
let _newMessages = [];
let _liveBroadcastPollingStarted = false;
let _messagePollingStarted = false;
let _noLiveBroadcastFound = false;
let _config = null;

function getRandomColor() {
    const letters = "0123456789ABCDEF".split("");
    let color = "#";

    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }

    return color;
}

function initialize(config) {
    authorize(config);
}

function ready() {
    winston.info("Youtube API is ready to use", {"source": "youtube"});
    _isReady = true;

    _newMessages.push({
        "type": "system",
        "source": "youtube",
        "date": new Date().getTime(),
        "message": "ready|true"
    });

    startMessagePolling();
}

function isReady() {
    return _isReady;
}

function authorize(credentials) {
    _config = credentials;

    const clientSecret = credentials.live_data.youtube.client_secret;
    const clientId = credentials.live_data.youtube.client_id;
    const redirectUrl = `${credentials.server.host}:${credentials.server.port}${credentials.live_data.youtube.redirect_url}`;

    const auth = new googleAuth();

    _auth = new auth.OAuth2(clientId, clientSecret, redirectUrl);

    // Check if we have previously stored a token.
    fs.readFile(TOKEN_PATH, (err, token) => {
        if (err) {
            getNewToken();
        } else {
            _auth.credentials = JSON.parse(token);
            winston.info("Get stored token", {"source": "youtube"});

            startLiveBroadcastPolling();
        }
    });
}

function getTokenLink() {
    if (!_auth) {
        const config = require("../config.json") // FIXME: Костыль, но без него пока никак
        const clientSecret = config.live_data.youtube.client_secret;
        const clientId = config.live_data.youtube.client_id;
        const redirectUrl = `${config.server.host}:${config.server.port}${config.live_data.youtube.redirect_url}`;

        const auth = new googleAuth();

        _auth = new auth.OAuth2(clientId, clientSecret, redirectUrl);
    }

    return _auth.generateAuthUrl({
        "access_type": "offline",
        "scope": SCOPES,
        "approval_prompt": "force"
    });
}

function getNewToken() {
    const authUrl = _auth.generateAuthUrl({
        "access_type": "offline",
        "scope": SCOPES,
        "approval_prompt": "force"
    });

    winston.info("Please select your Youtube account to get a token and use the API.", {"source": "youtube"});

    _newMessages.push({
        "type": "system",
        "source": "youtube",
        "date": new Date().getTime(),
        "message": `auth-url|${authUrl}`
    });
}

function refreshToken() {
    winston.info("Refresh token", {"source": "youtube"});

    _auth.refreshAccessToken((err, token) => {
        if (err) {
            winston.error(`Error trying to get a refreshed token: ${err}`, {"source": "youtube"})
        } else {
            _auth.credentials = token;
            storeToken(token);

            startLiveBroadcastPolling();
        }
    })
}

function getToken(code) {
    _auth.getToken(code, (err, token) => {
        if (err) {
            winston.error("Error while trying to retrieve access token", {"source": "youtube"});
            winston.error(err, {"source": "youtube"});

            return;
        }

        winston.info(token, {"source": "youtube"});
        _auth.credentials = token;
        storeToken(token);

        startLiveBroadcastPolling();
    });
}

function storeToken(token) {
    try {
        fs.mkdirSync(TOKEN_DIR);
    } catch (err) {
        if (err.code !== "EEXIST") {
            throw err;
        }
    }

    fs.writeFile(TOKEN_PATH, JSON.stringify(token));
    winston.info(`Token stored to ${TOKEN_PATH}`, {"source": "youtube"});
}

function getLiveBroadcast() {
    _youtube.liveBroadcasts.list({
        "auth": _auth,
        "part": "snippet",
        "broadcastStatus": "active",
        "broadcastType": "all"
    }, (error, response) => {
        if (error) {
            winston.error(`The API returned an error: ${error}`, {"source": "youtube"});
            getNewToken();
        } else {
            const liveBroadcasts = response.items;

            if (liveBroadcasts.length > 0) {
                if (_isReady) return;

                _noLiveBroadcastFound = false;
                const [liveBroadcast] = liveBroadcasts;

                winston.info("Live broadcast found", {"source": "youtube"});
                winston.info(`Title: ${liveBroadcast.snippet.title}`, {"source": "youtube"});
                winston.info(`Description: ${liveBroadcast.snippet.description}`, {"source": "youtube"});

                _liveChatId = liveBroadcast.snippet.liveChatId;

                ready();
            } else if (!_noLiveBroadcastFound) {
                if (_isReady) {
                    _isReady = false;

                    _newMessages.push({
                        "type": "system",
                        "source": "youtube",
                        "date": new Date().getTime(),
                        "message": "ready|false"
                    });
                }

                _noLiveBroadcastFound = true;
                const errorMessage = "No broadcast live detected";

                winston.error(errorMessage, {"source": "youtube"});

                _newMessages.push({
                    "type": "system",
                    "source": "youtube",
                    "date": new Date().getTime(),
                    "message": `error|${errorMessage}`
                });
            }
        }
    });
}

function getNewMessages() {
    if (_newMessages.length === 0) return [];

    const newMessage = _newMessages;

    _newMessages = [];

    return newMessage;
}

function getChatMessages() {
    if (!_isReady) return;

    _youtube.liveChatMessages.list({
        "auth": _auth,
        "part": "snippet,authorDetails",
        "liveChatId": _liveChatId
    }, (error, response) => {
        if (error) {
            winston.error(`The API returned an error: ${error}`, {"source": "youtube"});
            refreshToken();

            return;
        }

        const messages = response.items;
        const chatMessages = [];

        if (messages.length > 0) {
            for (let i = 0; i < messages.length; i++) {
                const message = messages[i];

                if (message.snippet.type === "textMessageEvent") {
                    const messageTimestamp = new Date(message.snippet.publishedAt).getTime();

                    if (_lastCheckTime < messageTimestamp) {
                        const author = message.authorDetails.displayName;

                        if (!(author in _userColorsMap)) _userColorsMap[author] = getRandomColor();

                        const chatMessage = {
                            "type": "chat",
                            author,
                            "message": message.snippet.textMessageDetails.messageText,
                            "source": "youtube",
                            "date": messageTimestamp,
                            "color": _userColorsMap[author]
                        };

                        chatMessages.push(chatMessage);
                    }
                }
            }

            if (chatMessages.length > 0) {
                _newMessages = _newMessages.concat(chatMessages);
                _lastCheckTime = chatMessages[chatMessages.length - 1].date;
            }
        }
    });
}

function startLiveBroadcastPolling() {
    if (!_liveBroadcastPollingStarted) {
        _liveBroadcastPollingStarted = true;
        setInterval(getLiveBroadcast, 1000);
    }
}

function startMessagePolling() {
    if (!_messagePollingStarted) {
        _messagePollingStarted = true;
        setInterval(getChatMessages, 1000);
    }
}

exports.initialize = initialize;
exports.isReady = isReady;
exports.getToken = getToken;
exports.getNewMessages = getNewMessages;
exports.getTokenLink = getTokenLink;
exports.SCOPES = SCOPES;