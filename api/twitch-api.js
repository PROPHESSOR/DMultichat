"use strict";

const irc = require("tmi.js");
const {info} = require("../libs/logger");
const API = require("./API");

class TwitchAPI extends API {
	constructor() {
		super("Twitch");

		this._config = null;
		this._newMessages = [];
		this._status = "off";
	}

	get status() {
		return this._status;
	}

	initialize(config) {
		this._config = config.live_data.twitch;

		const options = {
			"options": {"debug": false},
			"connection": {"reconnect": true},
			"channels": [this._config.channel]
		};

		const client = new irc.client(options);

		client.on("connected", (/* address, port */) => {
			this.ready();
		});

		client.on("chat", (channel, user, message/* , self */) => {
			const chatMessage = {
				"type": "chat",
				"author": user["display-name"],
				"color": user.color,
				message,
				"emotes": user.emotes,
				"source": "twitch",
				"date": new Date().getTime()
			};

			this._newMessages.push(chatMessage);
		});

		client.connect();
	}

	ready() {
		info(`Twitch API is ready to use (connected to ${this._config.channel})`, {"level": "twitch"});
		this._isReady = true;
		this._status = "ready";

		this._newMessages.push({
			"type": "system",
			"source": "twitch",
			"date": new Date().getTime(),
			"message": "ready"
		});
	}

	getNewMessages() {
		if (this._newMessages.length === 0) return [];

		const newMessage = this._newMessages;

		this._newMessages = [];

		return newMessage;
	}
}

module.exports = new TwitchAPI();