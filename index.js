const server = require("./server");

const Button = {
	start() {
		Server.start();
	},

	stop() {
		Server.stop();
	}
}

const Server = {
	start() {
		server.run({
			cb() {
				$("#currentstate").text("DMultichat запущен!");
				$("#currentstatebg").removeClass("back-danger back-warning").addClass("back-success");
			},
			log(log) {
				// alert(log);
				$("#log").append(`${log} <br/>`);
			}
		});
		$("#currentstate").text("DMultichat запускается...");
		$("#currentstatebg").removeClass("back-danger back-success").addClass("back-warning");
	},

	stop() {
		server.stop();
		$("#currentstate").text("DMultichat не запущен!");
		$("#currentstatebg").removeClass("back-success back-warning").addClass("back-danger");
	}
}