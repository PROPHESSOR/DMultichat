"use strict";

class Antimat {
	constructor(replace = "***"){
		this._repl = replace;
		this._excps = ["хлеб", "трахея"]; // Exemtions
		this._incl = []; // Includes

		this.removeExceptions = this.removeExceptions.bind(this);
		this.returnExceptions = this.returnExceptions.bind(this);
		this.process = this.process.bind(this);
		this.replaceIncludes = this.replaceIncludes.bind(this);
		this.setException = this.setException.bind(this);
		this.setInclude = this.setInclude.bind(this);
	}

	get exceptions(){
		return this._excps;
	}

	get includes(){
		return this._incl;
	}

	get replace(){
		return this._repl;
	}

	set replace(text){
		this._repl = text;
	}

	setException(exception){
		if(exception instanceof Array)
			this._excps = exption;
		else
			this._excps.push(exception);
		return this;
	}

	setInclude(include){
		if(include instanceof Array)
			this._incl = include;
		else
			this._incl.push(include);
		return this;
	}

	replaceIncludes(text){
		let out = text.split(/\s+/);
		for(const i in out){
			for(const inc of this._incl){
				if(out[i] === inc) out[i] = this._repl; 
			}
		}
		return out.join(" ");
	}

	removeExceptions(text){
		let out = text;
		for(const e in this._excps){
			out = out.replace(new RegExp(this._excps[e], "g"),
					`{{${e}}}`);
		}
		return out;

	}

	returnExceptions(text){
		let out = text;
		for(const e in this._excps){
			out = out.replace(new RegExp(`{{(${e})}}`, "g"),
						this._excps[e])
		}
		return out;
	}

	process(text) {
		let out = this.replaceIncludes(text);
		debugger;
		out = this.removeExceptions(out);
		const r = this._repl;
		const r1 = "$1"+r;
		const r2 = "$2"+r;
		const rr2 = r+"$2";

		out = out
			.replace(/пизд/g, r)
			.replace(/(\s+)(на|по|)\s*хер/g, r1)
			.replace(/(\s+)(на|по|)\s*ху[ийяю]/g, r1)
			.replace(/(\s+)бл[яеэ]([тд]ь|)/g, r1)
			.replace(/(\s+)еб[лане]/g, r1)
			//.replace(/(\s+|^)лох/g, r1)
			.replace(/(\s+|^)трах/g, r1)
			.replace(/(е|ё|йо)[бп](\s+|$)/g, rr2)
			.replace(/(\s+|^)(е|ё|йо)[бп]/g, r1)
			.replace(/(\s+|^)пид[aо]?р(ас)?/g, r1)
			.replace(/(\s+|^)[хк]ул[еи]/g, r1)
			.replace(/(\s+|^)(за)?[ие][бп]ал[аи]?/g, r1)
			.replace(/ёб/g, r)
		return this.returnExceptions(out);
			
	}
}

module.exports = new Antimat();

if (!module.parent) console.log(module.exports.process(process.argv.slice(2).join(" ")));

