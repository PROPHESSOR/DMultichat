"use strict";

const fs = require("fs");
const logger = require("../libs/logger");
const path = require("path");

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
		// const themeFolder = path.normalize(`${__dirname}/../themes/${theme}`);
		const themeJson = path.normalize(`${__dirname}/../themes/${theme}/theme.json`);

		try {
			return require(themeJson);
		} catch (e) {
			logger.warn(`По пути ${themeJson} нет файла`, "themes");

			return null;
		}
	}

	static getCss(theme) {
		const thconfig = Theme.getConfig(theme);

		if (!thconfig) return logger.error(`Да нет у меня темы ${theme}!`);

		const cssfile = thconfig.main;

		const tmp = path.normalize(`${__dirname}/../themes/${theme}/${cssfile}`);

		if (!fs.existsSync(tmp)) return logger.error(`У темы ${theme} нет файла ${cssfile}, который указан в theme.json!`);

		const css = fs.readFileSync(tmp, "utf8");


		return css;
	}
}

module.exports = Theme;