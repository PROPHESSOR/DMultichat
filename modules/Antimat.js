"use strict";

function a(text) {
	return text.replace(/хер/g, "хрен").replace(/пизд/g, "хренд").replace(/еба/g, "хлеба");
}

if (!module.parent) console.log(`${process.argv[2]} => ${a(process.argv[2])}`);

module.exports = a;