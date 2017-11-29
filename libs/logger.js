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
/* eslint-disable */
'use strict';

/* eslint-disable no-console */

const chalk = require('chalk');

class Logger {
	constructor() {
		this.log = this.log.bind(this);
		this.convert = this.convert.bind(this);
		this.warn = this.warn.bind(this);
		this.error = this.error.bind(this);
		this.info = this.info.bind(this);
		this.timestamp = this.timestamp.bind(this);

		this.levels = [];
	}

	log(data, options = {}) {
		if (options.level && this.levels.indexOf(options.level) < 0) return;
		let out = !options.noconvert ? this.convert(data) : data;

		console.log(chalk.cyan(out));
	}

	warn(data, options = {}) {
		if (options.level && this.levels.indexOf(options.level) < 0) return;
		let out = !options.noconvert ? this.convert(data) : data;

		console.log(chalk.yellow(out));
	}

	error(data, options = {}) {
		if (options.level && this.levels.indexOf(options.level) < 0) return;
		let out = !options.noconvert ? this.convert(data) : data;

		console.log(chalk.red(out));
	}

	info(data, options = {}) {
		if (options.level && this.levels.indexOf(options.level) < 0) return;
		let out = !options.noconvert ? this.convert(data) : data;

		console.log(chalk.blue(out));
	}

	convert(data) {
		let out = data;

		if (typeof out === 'object') out = JSON.stringify(out);

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
	}

}

module.exports = new Logger();