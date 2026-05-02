#!/usr/bin/env node
import { program as e } from "commander";
import { readFileSync as t } from "node:fs";
import { relative as n, sep as r } from "node:path";
import { globSync as i } from "glob";
//#region src/core/document/code/i18n-usage/fast-match.ts
function a(e) {
	return e.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function o(e) {
	let t = [...e], n = 0;
	for (; n < e.length;) {
		let r = e[n];
		if (r === "'" || r === "\"") {
			n = s(e, n, r);
			continue;
		}
		if (r === "`") {
			n = l(e, n);
			continue;
		}
		if (r === "<" && e.startsWith("<!--", n)) {
			let r = e.indexOf("-->", n + 4), i = r === -1 ? e.length : r + 3;
			for (let e = n; e < i; e++) t[e] = " ";
			n = i;
			continue;
		}
		if (r === "/" && e[n + 1] === "/") {
			for (let r = n; r < e.length && e[r] !== "\n"; r++) t[r] = " ";
			for (; n < e.length && e[n] !== "\n";) n++;
			continue;
		}
		if (r === "/" && e[n + 1] === "*") {
			let r = e.indexOf("*/", n + 2), i = r === -1 ? e.length : r + 2;
			for (let e = n; e < i; e++) t[e] = " ";
			n = i;
			continue;
		}
		n++;
	}
	return t.join("");
}
function s(e, t, n) {
	let r = t + 1;
	for (; r < e.length;) {
		let t = e[r];
		if (t === "\\" && r + 1 < e.length) {
			r += 2;
			continue;
		}
		if (t === n) return r + 1;
		r++;
	}
	return e.length;
}
function c(e, t) {
	let n = 1, r = t;
	for (; r < e.length && n > 0;) {
		let t = e[r];
		if (t === "'") {
			r = s(e, r, "'");
			continue;
		}
		if (t === "\"") {
			r = s(e, r, "\"");
			continue;
		}
		if (t === "`") {
			r = l(e, r);
			continue;
		}
		if (t === "/" && e[r + 1] === "/") {
			for (; r < e.length && e[r] !== "\n";) r++;
			continue;
		}
		if (t === "/" && e[r + 1] === "*") {
			let t = e.indexOf("*/", r + 2);
			r = t === -1 ? e.length : t + 2;
			continue;
		}
		t === "{" ? n++ : t === "}" && n--, r++;
	}
	return r;
}
function l(e, t) {
	let n = t + 1;
	for (; n < e.length;) {
		let t = e[n];
		if (t === "\\" && n + 1 < e.length) {
			n += 2;
			continue;
		}
		if (t === "`") return n + 1;
		if (t === "$" && e[n + 1] === "{") {
			n = c(e, n + 2);
			continue;
		}
		n++;
	}
	return e.length;
}
function u(e, t) {
	let n = 1, r = 0;
	for (let i = 0; i < t; i++) e[i] === "\n" && (n++, r = i + 1);
	return {
		line: n,
		column: t - r + 1
	};
}
function d(e) {
	let t = "";
	for (let n = 0; n < e.length; n++) {
		if (e[n] !== "\\" || n + 1 >= e.length) {
			t += e[n];
			continue;
		}
		let r = e[n + 1];
		switch (r) {
			case "n":
				t += "\n", n++;
				break;
			case "r":
				t += "\r", n++;
				break;
			case "t":
				t += "	", n++;
				break;
			case "v":
				t += "\v", n++;
				break;
			case "b":
				t += "\b", n++;
				break;
			case "f":
				t += "\f", n++;
				break;
			case "u": {
				let i = e.slice(n + 2, n + 6);
				/^[0-9a-fA-F]{4}$/.test(i) ? (t += String.fromCodePoint(parseInt(i, 16)), n += 5) : (t += r, n++);
				break;
			}
			case "x": {
				let i = e.slice(n + 2, n + 4);
				/^[0-9a-fA-F]{2}$/.test(i) ? (t += String.fromCharCode(parseInt(i, 16)), n += 3) : (t += r, n++);
				break;
			}
			case "\r":
				n++, e[n + 1] === "\n" && n++;
				break;
			case "\n":
			case "\u2028":
			case "\u2029":
				n++;
				break;
			default:
				t += r, n++;
				break;
		}
	}
	return t;
}
function f(e, t) {
	let n = t + 1;
	for (; n < e.length;) {
		let t = e[n];
		if (t === void 0 || !/\s/.test(t)) break;
		n++;
	}
	let r = e[n];
	if (r !== "'" && r !== "\"" && r !== "`") return null;
	let i;
	if (r === "`") {
		i = "", n++;
		let t = !1;
		for (; n < e.length;) {
			let r = e[n];
			if (r === "\\" && n + 1 < e.length) {
				i += r + e[n + 1], n += 2;
				continue;
			}
			if (r === "`") {
				n++, t = !0;
				break;
			}
			if (r === "$" && e[n + 1] === "{") return null;
			i += r, n++;
		}
		if (!t) return null;
	} else {
		i = "", n++;
		let t = !1;
		for (; n < e.length;) {
			let a = e[n];
			if (a === "\\" && n + 1 < e.length) {
				i += a + e[n + 1], n += 2;
				continue;
			}
			if (a === r) {
				n++, t = !0;
				break;
			}
			i += a, n++;
		}
		if (!t) return null;
	}
	for (; n < e.length;) {
		let t = e[n];
		if (t === void 0 || !/\s/.test(t)) break;
		n++;
	}
	let a = e[n];
	if (a !== ")" && a !== ",") return null;
	let o = p(e, t);
	if (o === -1) return null;
	let s = d(i);
	return {
		key: s,
		value: s,
		closeParenIndex: o
	};
}
function p(e, t) {
	let n = 0, r = t;
	for (; r < e.length;) {
		let t = e[r];
		if (t === "'") {
			r = s(e, r, "'");
			continue;
		}
		if (t === "\"") {
			r = s(e, r, "\"");
			continue;
		}
		if (t === "`") {
			r = l(e, r);
			continue;
		}
		if (t === "(") n++;
		else if (t === ")" && (n--, n === 0)) return r;
		r++;
	}
	return -1;
}
function m(e) {
	let t = [...e].sort((e, t) => t.length - e.length).map(a).join("|");
	return RegExp(`(?:${t})\\s*\\(`, "g");
}
function h(e) {
	let { filePath: t, code: n, t: r } = e;
	if (r.length === 0) return [];
	let i = o(n), a = m(r), s = [], c, l = new RegExp(a.source, a.flags);
	for (; (c = l.exec(i)) !== null;) {
		let e = f(n, c.index + c[0].length - 1);
		if (!e) continue;
		let { line: r, column: i } = u(n, c.index);
		s.push({
			key: e.key,
			value: e.value,
			filePath: t,
			line: r,
			column: i
		}), l.lastIndex = e.closeParenIndex + 1;
	}
	return s;
}
//#endregion
//#region src/features/collect/collect.ts
function g(e, t) {
	return n(e, t).split(r).join("/");
}
function _(e) {
	let { t: n, include: r, exclude: a } = e, o = e.cwd ?? process.cwd(), s = { usage: {} };
	if (r.length === 0 || n.length === 0) return s;
	let c = i(r, {
		cwd: o,
		ignore: a,
		nodir: !0,
		absolute: !0
	});
	c.sort((e, t) => e.localeCompare(t));
	for (let e of c) {
		let r;
		try {
			r = t(e, "utf8");
		} catch {
			continue;
		}
		let i = h({
			filePath: g(o, e),
			code: r,
			t: n
		});
		for (let e of i) {
			let t = e.key, n = s.usage[t];
			n ? n.push(e) : s.usage[t] = [e];
		}
	}
	return s;
}
//#endregion
//#region src/commands/collect.ts
async function v(e) {
	await _(e);
}
e.command("collect").option("-c", "configure file paths").description("Collect all keys from code files").action(async (e) => {
	await v(e);
}), e.parse(process.argv);
//#endregion
