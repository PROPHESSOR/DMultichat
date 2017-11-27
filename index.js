const server = require("./server");

const Button = {
	start(){
		server.run();
		$("#currentstate").text("DMultichat запущен!");
		$("#currentstatebg").removeClass("back-danger").addClass("back-success");
	},

	stop(){
		server.stop();
		$("#currentstate").text("DMultichat не запущен!");
		$("#currentstatebg").removeClass("back-success").addClass("back-danger");
	}
}