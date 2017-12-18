/* API Class
 * Don't remove!
 * Не удаляйте!
 * Copyright (c) 2017 PROPHESSOR
*/

"use strict";

const {log, warn} = require("../libs/logger");

class API {

	/**
	 * @constructor
	 * @param {string} name - API name
	 */
	constructor(name) {
		this._name = name;
		this._isReady = false;

		this.initialize = this.initialize.bind(this);
		this.ready = this.ready.bind(this);
		this.getNewMessages = this.getNewMessages.bind(this);
		this.isReady = this.isReady.bind(this);

		log(`${this._name} API connecting!`, {"level": "Api"});
	}

	/** Get current API name
	 * @returns {string} API name
	 */
	get name() {
		return this._name;
	}

	/** This method will executed at start
	 * @returns {undefined} - Nothing
	 */
	initialize() {
		warn(`In ${this.name} API "initialize" isn't implemented!`);
	}

	/** This method will executed on connect
	 * @returns {undefined} - Nothing
	 */
	ready() {
		warn(`In ${this.name} API "ready" isn't implemented!`);
	}

	/** This method must return array of messages
	 * @returns {array} - Messages
	 */
	getNewMessages() {
		warn(`In ${this.name} API "getNewMessages" isn't implemented!`);
	}
	/** Is API ready?
	 * @returns {bool} True/false
	 */
	isReady() {
		return this._isReady;
	}
}

module.exports = API;