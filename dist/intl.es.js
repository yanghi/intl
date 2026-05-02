//#region src/commands/collect.ts
async function e(e, t) {
	return e.collect(t);
}
//#endregion
//#region src/commands/fix.ts
async function t(e, t) {
	return e.fix(t);
}
//#endregion
//#region src/commands/lint.ts
async function n(e, t) {
	return e.lint(t);
}
//#endregion
//#region src/commands/translate.ts
async function r(e, t) {
	return e.translate(t);
}
//#endregion
//#region src/cli/index.ts
function i(i) {
	return {
		lint: n,
		collect: e,
		translate: r,
		fix: t
	};
}
//#endregion
export { i as createCliCommandRegistry };
