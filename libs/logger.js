/*
 * Logger library by PROPHESSOR (2017)
 *  
 * Simple usage:
 * Log.setLevels(["name of level"]);
 * Log.log/warn/error/info("message", { //optional object
 * 	noconvert: true/false, //Disable convertion (timestamps and else)
 * 	level: "name of level"
 * });
 * Log.log("message");
 * Log.log("message", {noconvert:true});
 */
// /* eslint-disable */

"use strict";

/* eslint-disable no-console */

const chalk = require("chalk");

class Logger {
	constructor() {
		this.log = this.log.bind(this);
		this.convert = this.convert.bind(this);
		this.warn = this.warn.bind(this);
		this.error = this.error.bind(this);
		this.info = this.info.bind(this);
		this.timestamp = this.timestamp.bind(this);
		this.setLevels = this.setLevels.bind(this);
		this.removeLevel = this.removeLevel.bind(this);
		this.setCallback = this.setCallback.bind(this);

		this.levels = [];
		this.callbacks = {
			log() {},
			error() {},
			warn() {},
			info() {}
		}
	}

	log(data, options = {}) {
		if (options.level && this.levels.indexOf(options.level) < 0) return;
		const out = !options.noconvert ? this.convert(data) : data;

		console.log(chalk.cyan(out));
		this.callbacks.log(out);

		return this;
	}

	warn(data, options = {}) {
		if (options.level && this.levels.indexOf(options.level) < 0) return;
		const out = !options.noconvert ? this.convert(data) : data;

		console.log(chalk.yellow(out));
		this.callbacks.warn(out);

		return this;
	}

	error(data, options = {}) {
		if (options.level && this.levels.indexOf(options.level) < 0) return;
		const out = !options.noconvert ? this.convert(data) : data;

		console.log(chalk.red(out));
		this.callbacks.error(out);

		return this;
	}

	info(data, options = {}) {
		if (options.level && this.levels.indexOf(options.level) < 0) return;
		const out = !options.noconvert ? this.convert(data) : data;

		console.log(chalk.blue(out));
		this.callbacks.info(out);

		return this;
	}

	convert(data) {
		let out = data;

		if (typeof out === "object") out = JSON.stringify(out);

		return this.timestamp(out);

	}

	timestamp(data) {
		return `[${Date.now()}] ${data}`;
	}

	setLevels(levels) {
		this.levels = levels;

		return this;
	}

	removeLevel(level) {
		const idx = this.levels.indexOf(level);

		if (idx >= 0) {
			this.levels.splice(idx);
		}
		return this;
	}

	setCallback(event, callback = () => {}){
		if(!this.callbacks[event]) return this.error(`Неверное действие ${event}`);
		this.callbacks[event] = callback;
		return this;
	}

}

module.exports = new Logger();