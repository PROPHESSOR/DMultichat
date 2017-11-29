"use strict";

const express = require("express");
const app = express.Router();
const path = require("path");
const logger = require("../libs/logger");

// const Theme = require("../modules/Theme");
// const theme = new Theme();

app.get("/", (req, res) => {
	res.sendFile(path.join(__dirname, "/../public/chat.html"));
});

// app.get("/css/chat.css", (req, res) => {
// 	logger.log("chat.css");
// 	res.send("cssload");
// });

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