"use strict";

const express = require("express");
const app = express.Router();
const path = require("path");
const logger = require("../libs/logger");

const Theme = require("../modules/Theme");

app.get("/", (req, res) => {
	res.sendFile(path.join(__dirname, "/../public/chat.html"));
});

app.get("/css/chat.css", (req, res) => {
	res.sendFile(Theme.currentTheme.chat);
});

app.get("/css/animate.css", (req, res) => {
	res.sendFile(Theme.currentTheme.animate);
});

app.get("/css/context.css", (req, res) => {
	res.sendFile(Theme.currentTheme.context);
});

app.get("/css/yt-emoji.css", (req, res) => {
	res.sendFile(Theme.currentTheme.yt_emoji);
});

app.get("/css/api.css", (req, res) => {
	res.sendFile(Theme.currentTheme.api);
});

app.get("/css/colors.css", (req, res) => {
	res.sendFile(Theme.currentTheme.colors);
});

app.use(express.static("public"));

// catch 404 and forward to error handler
app.use((req, res, next) => {
	const err = new Error("Not Found");

	err.status = 404;
	next(err);
});

// error handler
app.use((err, req, res) => {
	// set locals, only providing error in development
	res.locals.message = err.message;
	res.locals.error = req.app.get("env") === "development" ? err : {};

	// render the error page
	res.send(`
		<meta charset="utf-8">
		Произошла ошибка ${err.status}<br/>${err}
	`)
});

module.exports = app;