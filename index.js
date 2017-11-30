"use strict";

/* global $ */

const server = require("./server");

let config;

try {
	config = require("./config");
} catch (e) {
	error("Файл конфигурации не найден!");
	// TODO: Блокировка запуска и создание конфига
}

server.setLogger({
	log,
	error,
	info,
	warn
});

const Server = {
	start() {
		server.run(() => {
			$("#currentstate").text("DMultichat запущен!");
			$("#currentstatebg").removeClass("back-danger back-warning").addClass("back-success");
		}, {});
		$("#currentstate").text("DMultichat запускается...");
		$("#currentstatebg").removeClass("back-danger back-success").addClass("back-warning");
	},

	stop() {
		server.stop();
		$("#currentstate").text("DMultichat не запущен!");
		$("#currentstatebg").removeClass("back-success back-warning").addClass("back-danger");
	}
}

const Button = {
	start() {
		Server.start();
	},

	stop() {
		Server.stop();
	}
}

const Settings = {
	saveChannels() {
		// TODO:
	},

	saveSettings() {
		// TODO:
	}
}

/* eslint-disable class-methods-use-this */

const Section = new class {
	constructor() {
		this._currentSection = "start";
		this.goto = this.goto.bind(this);
	}

	goto(section) {
		const from = this.getSection(this._currentSection);
		const to = this.getSection(section);
		const fromnav = this.getNav(this._currentSection);
		const tonav = this.getNav(section);

		Section._currentSection = section;

		from.fadeOut();
		to.fadeIn();

		fromnav.removeClass("active");
		tonav.addClass("active");
	}

	getSection(section) {
		return $(`section.${section}`);
	}

	getNav(section) {
		return $(`ul.nav > li.${section}`);
	}
}()

function openExt(url) { //eslint-disable-line
	require("nw.gui").Shell.openExternal(url);
}

function postHtml() {
	$(".dmurl").text(`${config.server.host}:${config.server.port}`);
}

// $(document).ready(postHtml);
postHtml();


// api
/* eslint-disable no-console */

function log(text) {
	$("#log").append(`${text}<br/>`);
	console.log(text);
}

function error(text) {
	$("#log").append(`<red>${text}</red><br/>`);
	console.log(text);
}

function info(text) {
	$("#log").append(`<blue>${text}</blue><br/>`);
	console.log(text);
}

function warn(text) {
	$("#log").append(`<orange>${text}</orange><br/>`);
	console.log(text);
}