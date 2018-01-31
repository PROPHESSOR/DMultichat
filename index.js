"use strict";

/* global $ */

const server = require("./server");

let config;

try {
	config = require("./config");
} catch (e) {
	error("Файл конфигурации не найден!");
	config = require("./config.template");
	// TODO: Блокировка запуска и создание конфига
}

server.setLogger({
	log,
	error,
	info,
	warn
});

const Server = {
	"_status": false,
	start() {
		server.run(() => {
			Server._status = true;
			$("#currentstate").text("DMultichat запущен!");
			$("#currentstatebg").removeClass("back-danger back-warning").addClass("back-success");
			Section.update();
		}, {});
		$("#currentstate").text("DMultichat запускается...");
		$("#currentstatebg").removeClass("back-danger back-success").addClass("back-warning");
	},

	stop() {
		server.stop();
		Server._status = false;
		$("#currentstate").text("DMultichat не запущен!");
		$("#currentstatebg").removeClass("back-success back-warning").addClass("back-danger");
		Section.update();
	}
}

const Button = { //eslint-disable-line
	float() {
		if (!Server._status) return alert("Необходимо сначала запустить сервер!"); //eslint-disable-line

		require("nw.gui").Window.open(`${config.server.host}:${config.server.port}`, {
			"transparent": true,
			"frame": false
			// "always-on-top": true
		}, () => {
			log("Открыто плавающее окно")
		});
	},
	toggle() {
		if (Server._status) {
			Server.stop();
			$("#footer-toggle").removeClass("btn-danger").addClass("btn-success").text("Старт");
		} else {
			Server.start();
			$("#footer-toggle").removeClass("btn-success").addClass("btn-danger").text("Стоп");
		}
	}
}

const Settings = { //eslint-disable-line
	saveChannels() {
		// TODO:
	},

	saveSettings() {
		// TODO:
	},

	openYouTubeToken() {
		openExt(server.API.youtube.getTokenLink());
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

		from.fadeOut({"complete": () => to.fadeIn()});

		fromnav.removeClass("active");
		tonav.addClass("active");
	}

	getSection(section) {
		return $(`section.${section}`);
	}

	getNav(section) {
		return $(`ul.nav > li.${section}`);
	}

	update() {
		// TODO: Обновление состояния поля enabled в секции Каналы
		// TODO: Обновление состояния трансляции в секции Старт FIXME: Можно лучше
		if (server.enabled() && server.API.youtube.status === "ready") $("#start_apis .youtube")
				.removeClass("label-danger label-warning label-success")
				.addClass("label-success");
		else if (server.API.youtube.status === "nobroadcast") $("#start_apis .youtube")
				.removeClass("label-danger label-warning label-success")
				.addClass("label-warning");
		else if (!server.enabled() || server.API.youtube.status === "off") $("#start_apis .youtube")
				.removeClass("label-danger label-warning label-success")
				.addClass("label-danger");

		if (server.enabled() && server.API.twitch.status === "ready") $("#start_apis .twitch")
				.removeClass("label-danger label-warning label-success")
				.addClass("label-success");
		else if (!server.enabled() || server.API.twitch.status === "off") $("#start_apis .twitch")
				.removeClass("label-danger label-warning label-success")
				.addClass("label-danger");

		// $("#start_apis .gg")
		// 	.removeClass("label-danger label-warning label-success")
		// 	.addClass("label-success");
		// $("#start_apis .vk")
		// 	.removeClass("label-danger label-warning label-success")
		// 	.addClass("label-success");
	}
}()

function openExt(url) { //eslint-disable-line
	require("nw.gui").Shell.openExternal(url);
}

function postHtml() {
	$(".dmurl").text(`${config.server.host}:${config.server.port}/#noapi`);
}

// $(document).ready(postHtml);
postHtml();
setInterval(Section.update, 1000);


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