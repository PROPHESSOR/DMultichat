"use strict";

const fs = require("fs");
const logger = require("../libs/logger");

const config = require("../config.json");

class Theme {
	constructor(theme) {
		this.css = Theme.getCss(theme);

		const cfg = Theme.getConfig(theme);

		this.main = cfg.main;
		this.name = cfg.name;
		this.description = cfg.description;
		this.url = cfg.url;
		this.author = cfg.author;
	}

	static get currentTheme() {
		return new Theme(config.theme);
	}

	static getConfig(theme) {
		if (!fs.existsSync(`../themes/${theme}/theme.json`)) {
			return null;
		}

		return require(`../theme/${theme}/theme.json`);
	}

	static getCss(theme) {
		const thconfig = Theme.getConfig(theme);

		if (!thconfig) return logger.error(`Да нет у меня темы ${theme}!`);

		const cssfile = thconfig.main;

		const tmp = `../themes/${theme}/${cssfile}`;

		if (!fs.existsSync(tmp)) return logger.error(`У темы ${theme} нет файла ${cssfile}, который указан в theme.json!`);

		const css = fs.readFileSync(tmp, "utf8");


		return css;
	}
}

module.exports = Theme;