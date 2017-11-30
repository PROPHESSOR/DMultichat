"use strict";

const server = require("./server");

function log(text) {
	$("#log").append(`${text}<br/>`);
}

function error(text) {
	$("#log").append(`<red>${text}</red><br/>`);
}

function info(text) {
	$("#log").append(`<blue>${text}</blue><br/>`);
}

function warn(text) {
	$("#log").append(`<orange>${text}</orange><br/>`);
}

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

function openExt(url) {
	require("nw.gui").Shell.openExternal(url);
}