/* Antimat module
 * Copyright (c) 2017 PROPHESSOR
 */

"use strict";

class Antimat {
	/**
	 * @constructor
	 * @param  {string} replace="***" - Symbols for replacer
	 * @param {array} exceptions=["хлеб", "трахея"] - White listed words
	 * @param {array} includes=[] - Black listed words
	 */
	constructor(replace = "***", exceptions = ["хлеб", "трахея"], includes = []) { // eslint-disable-line
		this._repl = replace;
		this._excps = exceptions;
		this._incl = includes;

		this.removeExceptions = this.removeExceptions.bind(this);
		this.returnExceptions = this.returnExceptions.bind(this);
		this.process = this.process.bind(this);
		this.replaceIncludes = this.replaceIncludes.bind(this);
		this.setException = this.setException.bind(this);
		this.setInclude = this.setInclude.bind(this);
	}

	/** Get current whitelist
	 * @public
	 * @returns {array} whitelist
	 */
	get exceptions() {
		return this._excps;
	}


	/** Get current blacklist
	 * @public
	 * @returns {array} blacklist
	 */
	get includes() {
		return this._incl;
	}


	/** Get current replace symbols
	 * @public
	 * @returns {string} Symbols
	 */
	get replace() {
		return this._repl;
	}

	set replace(text) {
		this._repl = text;
	}

	/** Add (string) or set (array) whitelist
	 * @public
	 * @param  {string|array} exception - Whitelisted word(s)
	 * @returns {this} This
	 */
	setException(exception) {
		if (exception instanceof Array) this._excps = exception;
		else this._excps.push(exception);

		return this;
	}

	/** Add (string) or set (array) blacklist
	 * @public
	 * @param  {string|array} include - Blacklisted word(s)
	 * @returns {this} This
	 */
	setInclude(include) {
		if (include instanceof Array) this._incl = include;
		else this._incl.push(include);

		return this;
	}

	/** Replace blacklist at first
	 * @private
	 * @param  {string} text - In text
	 * @returns {string} Out text
	 */
	replaceIncludes(text) {
		const out = text.split(/\s+/);

		for (const i in out) { //eslint-disable-line
			for (const inc of this._incl) {
				if (out[i] === inc) out[i] = this._repl;
			}
		}

		return out.join(" ");
	}

	/** Replace whitelisted words to the temporary decorators
	 * @private
	 * @param  {string} text - In text
	 * @returns {string} Out text
	 */
	removeExceptions(text) {
		let out = text;

		for (const e in this._excps) { //eslint-disable-line
			out = out.replace(new RegExp(this._excps[e], "g"),
				`{{${e}}}`);
		}

		return out;

	}

	/** Replace whitelisted words back
	 * @private
	 * @param  {string} text - In text
	 * @returns {string} Out text
	 */
	returnExceptions(text) {
		let out = text;

		for (const e in this._excps) { //eslint-disable-line
			out = out.replace(new RegExp(`{{(${e})}}`, "g"),
				this._excps[e])
		}

		return out;
	}
	/** Process the text (Just do it)
	 * @public
	 * @param  {string} text - In text
	 * @returns {string} Out text
	 */
	process(text) {
		let out = text;

		if (typeof text === "object") out = text.message;

		out = this.replaceIncludes(out);


		out = this.removeExceptions(out);
		const r = this._repl;
		const r1 = `$1${r}`;
		const r2 = `$2${r}`;
		const rr2 = `${r}$2`;

		out = out
			.replace(/пизд/g, r)
			.replace(/(\s+|^)(на|по|)\s*хер/g, r1)
			.replace(/(\s+|^)(на|по|)\s*ху[ийяю]/g, r1)
			.replace(/(\s+|^)бл[яеэ]([тд]ь|)/g, r1)
			.replace(/(\s+|^)еб[лане]/g, r1)
			// .replace(/(\s+|^)лох/g, r1)
			.replace(/(\s+|^)трах/g, r1)
			.replace(/(е|ё|йо)[бп](\s+|$)/g, rr2)
			.replace(/(\s+|^)(е|ё|йо)[бп]/g, r1)
			.replace(/(\s+|^)пид[aо]?р(ас)?/g, r1)
			.replace(/(\s+|^)[хк]ул[еи]/g, r1)
			.replace(/(\s+|^)(за)?[ие][бп]ал[аи]?/g, r1)
			.replace(/ёб/g, r);

		out = this.returnExceptions(out);

		if (typeof text === "object") {
			const tmp = out;

			out = text;
			out.message = tmp;
		}

		return out;

	}
}

module.exports = new Antimat();

if (!module.parent) console.log(module.exports.process(process.argv.slice(2).join(" "))); //eslint-disable-line