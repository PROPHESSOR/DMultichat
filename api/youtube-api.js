"use strict";

/* eslint-disable class-methods-use-this */

const fs = require("fs");
const google = require("googleapis");
const googleAuth = require("google-auth-library");
const winston = require("../libs/logger");

const API = require("./API");

const SCOPES = [
    "https://www.googleapis.com/auth/youtube.readonly",
    "https://www.googleapis.com/auth/youtube",
    "https://www.googleapis.com/auth/youtube.force-ssl"
];
const TOKEN_DIR = ".credentials/";
const TOKEN_PATH = `${TOKEN_DIR}youtube-credentials.json`;

const _youtube = google.youtube("v3");
const _userColorsMap = {};

class YoutubeAPI extends API {
    constructor() {
        super("YouTube");

        this._newMessages = [];
        this._status = "off";

        this._liveChatId = "";
        this._isReady = false;
        this._lastCheckTime = new Date().getTime();
        this._auth = null;
        this._newMessages = [];
        this._liveBroadcastPollingStarted = false;
        this._messagePollingStarted = false;
        this._noLiveBroadcastFound = false;

        // Bind this
        {
            this.getRandomColor = this.getRandomColor.bind(this);
            this.initialize = this.initialize.bind(this);
            this.ready = this.ready.bind(this);
            this.isReady = this.isReady.bind(this);
            this.authorize = this.authorize.bind(this);
            this.getTokenLink = this.getTokenLink.bind(this);
            this.getNewToken = this.getNewToken.bind(this);
            this.refreshToken = this.refreshToken.bind(this);
            this.getToken = this.getToken.bind(this);
            this.storeToken = this.storeToken.bind(this);
            this.getLiveBroadcast = this.getLiveBroadcast.bind(this);
            this.getNewMessages = this.getNewMessages.bind(this);
            this.getChatMessages = this.getChatMessages.bind(this);
            this.startLiveBroadcastPolling = this.startLiveBroadcastPolling.bind(this);
            this.startMessagePolling = this.startMessagePolling.bind(this);
        }
    }

    get status() {
        return this._status;
    }

    getRandomColor() {
        const letters = "0123456789ABCDEF".split("");
        let color = "#";

        for (let i = 0; i < 6; i++) {
            color += letters[Math.floor(Math.random() * 16)];
        }

        return color;
    }

    initialize(config) {
        this.authorize(config);
    }

    ready() {
        winston.info("Youtube API is ready to use", {"source": "youtube"});
        this._isReady = true;
        this._status = "ready";

        this._newMessages.push({
            "type": "system",
            "source": "youtube",
            "date": new Date().getTime(),
            "message": "ready|true"
        });

        this.startMessagePolling();
    }

    isReady() {
        return this._isReady;
    }

    authorize(credentials) {
        const clientSecret = credentials.live_data.youtube.client_secret;
        const clientId = credentials.live_data.youtube.client_id;
        const redirectUrl = `${credentials.server.host}:${credentials.server.port}${credentials.live_data.youtube.redirect_url}`;

        const auth = new googleAuth();

        this._auth = new auth.OAuth2(clientId, clientSecret, redirectUrl);

        // Check if we have previously stored a token.
        fs.readFile(TOKEN_PATH, (err, token) => {
            if (err) {
                this.getNewToken();
            } else {
                this._auth.credentials = JSON.parse(token);
                winston.info("Get stored token", {"source": "youtube"});

                this.startLiveBroadcastPolling();
            }
        });
    }

    getTokenLink() {
        if (!this._auth) {
            let config;

            try {
                config = require("../config.json") // FIXME: Костыль, но без него пока никак
            } catch (e) {
                return false;
            }
            const clientSecret = config.live_data.youtube.client_secret;
            const clientId = config.live_data.youtube.client_id;
            const redirectUrl = `${config.server.host}:${config.server.port}${config.live_data.youtube.redirect_url}`;

            const auth = new googleAuth();

            this._auth = new auth.OAuth2(clientId, clientSecret, redirectUrl);
        }

        return this._auth.generateAuthUrl({
            "accessthis._type": "offline",
            "scope": SCOPES,
            "approvalthis._prompt": "force"
        });
    }

    getNewToken() {
        const authUrl = this._auth.generateAuthUrl({
            "accessthis._type": "offline",
            "scope": SCOPES,
            "approvalthis._prompt": "force"
        });

        winston.info("Please select your Youtube account to get a token and use the API.", {"source": "youtube"});

        this._newMessages.push({
            "type": "system",
            "source": "youtube",
            "date": new Date().getTime(),
            "message": `auth-url|${authUrl}`
        });
    }

    refreshToken() {
        winston.info("Refresh token", {"source": "youtube"});

        this._auth.refreshAccessToken((err, token) => {
            if (err) {
                winston.error(`Error trying to get a refreshed token: ${err}`, {"source": "youtube"})
            } else {
                this._auth.credentials = token;
                this.storeToken(token);

                this.startLiveBroadcastPolling();
            }
        })
    }

    getToken(code) {
        this._auth.getToken(code, (err, token) => {
            if (err) {
                winston.error("Error while trying to retrieve access token", {"source": "youtube"});
                winston.error(err, {"source": "youtube"});

                return;
            }

            winston.info(token, {"source": "youtube"});
            this._auth.credentials = token;
            this.storeToken(token);

            this.startLiveBroadcastPolling();
        });
    }

    storeToken(token) {
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

    getLiveBroadcast() {
        _youtube.liveBroadcasts.list({
            "auth": this._auth,
            "part": "snippet",
            "broadcastStatus": "active",
            "broadcastType": "all"
        }, (error, response) => {
            if (error) {
                winston.error(`The API returned an error: ${error}`, {"source": "youtube"});
                this.getNewToken();
            } else {
                const liveBroadcasts = response.items;

                if (liveBroadcasts.length > 0) {
                    if (this._isReady) return;

                    this._noLiveBroadcastFound = false;
                    this._status = "ready";
                    const [liveBroadcast] = liveBroadcasts;

                    winston.info("Live broadcast found", {"source": "youtube"});
                    winston.info(`Title: ${liveBroadcast.snippet.title}`, {"source": "youtube"});
                    winston.info(`Description: ${liveBroadcast.snippet.description}`, {"source": "youtube"});

                    this._liveChatId = liveBroadcast.snippet.liveChatId;

                    this.ready();
                } else if (!this._noLiveBroadcastFound) {
                    if (this._isReady) {
                        this._isReady = false;

                        this._newMessages.push({
                            "type": "system",
                            "source": "youtube",
                            "date": new Date().getTime(),
                            "message": "ready|false"
                        });
                    }

                    this._noLiveBroadcastFound = true;
                    this._status = "nobroadcast";
                    const errorMessage = "No broadcast live detected";

                    winston.error(errorMessage, {"source": "youtube"});

                    this._newMessages.push({
                        "type": "system",
                        "source": "youtube",
                        "date": new Date().getTime(),
                        "message": `error|${errorMessage}`
                    });
                }
            }
        });
    }

    getNewMessages() {
        if (this._newMessages.length === 0) return [];

        const newMessage = this._newMessages;

        this._newMessages = [];

        return newMessage;
    }

    getChatMessages() {
        if (!this._isReady) return;

        _youtube.liveChatMessages.list({
            "auth": this._auth,
            "part": "snippet,authorDetails",
            "liveChatId": this._liveChatId
        }, (error, response) => {
            if (error) {
                winston.error(`The API returned an error: ${error}`, {"source": "youtube"});
                this.refreshToken();

                return;
            }

            const messages = response.items;
            const chatMessages = [];

            if (messages.length > 0) {
                for (let i = 0; i < messages.length; i++) {
                    const message = messages[i];

                    if (message.snippet.type === "textMessageEvent") {
                        const messageTimestamp = new Date(message.snippet.publishedAt).getTime();

                        if (this._lastCheckTime < messageTimestamp) {
                            const author = message.authorDetails.displayName;

                            if (!(author in _userColorsMap)) _userColorsMap[author] = this.getRandomColor();

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
                    this._newMessages = this._newMessages.concat(chatMessages);
                    this._lastCheckTime = chatMessages[chatMessages.length - 1].date;
                }
            }
        });
    }

    startLiveBroadcastPolling() {
        if (!this._liveBroadcastPollingStarted) {
            this._liveBroadcastPollingStarted = true;
            setInterval(this.getLiveBroadcast, 1000);
        }
    }

    startMessagePolling() {
        if (!this._messagePollingStarted) {
            this._messagePollingStarted = true;
            setInterval(this.getChatMessages, 1000);
        }
    }
}

module.exports = new YoutubeAPI();
// exports.initialize = initialize;
// exports.isReady = isReady;
// exports.getToken = getToken;
// exports.getNewMessages = getNewMessages;
// exports.getTokenLink = getTokenLink;
// exports.SCOPES = SCOPES;
// exports.status = this._status;