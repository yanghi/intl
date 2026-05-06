import { I18nUsage } from "./usage";

export interface FastMatchOptions {
    filePath: string;
    code: string;
    /**
     * i18n function names, like t, this.t, $t, etc.
     */
    t: string[];
}

function escapeRegex(s: string): string {
    return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Same length as input: comment regions replaced with spaces so indices stay stable for regex matching.
 *  Uses a tiny string-aware scan (not regex-only): `//` inside `'http://…'` must not start a line comment. */
function maskCommentsPreserveLength(code: string): string {
    const chars = [...code];
    let i = 0;

    while (i < code.length) {
        const c = code[i];

        if (c === "'" || c === '"') {
            i = skipQuotedString(code, i, c);
            continue;
        }
        if (c === "`") {
            i = skipTemplateLiteral(code, i);
            continue;
        }

        if (c === "<" && code.startsWith("<!--", i)) {
            const end = code.indexOf("-->", i + 4);
            const e = end === -1 ? code.length : end + 3;
            for (let j = i; j < e; j++) chars[j] = " ";
            i = e;
            continue;
        }

        if (c === "/" && code[i + 1] === "/") {
            for (let j = i; j < code.length && code[j] !== "\n"; j++) chars[j] = " ";
            while (i < code.length && code[i] !== "\n") i++;
            continue;
        }

        if (c === "/" && code[i + 1] === "*") {
            const end = code.indexOf("*/", i + 2);
            const e = end === -1 ? code.length : end + 2;
            for (let j = i; j < e; j++) chars[j] = " ";
            i = e;
            continue;
        }

        i++;
    }

    return chars.join("");
}

function skipQuotedString(code: string, start: number, quote: string): number {
    let i = start + 1;
    while (i < code.length) {
        const ch = code[i];
        if (ch === "\\" && i + 1 < code.length) {
            i += 2;
            continue;
        }
        if (ch === quote) return i + 1;
        i++;
    }
    return code.length;
}

function skipTemplateSubstitution(code: string, start: number): number {
    let depth = 1;
    let i = start;
    while (i < code.length && depth > 0) {
        const ch = code[i];
        if (ch === "'" ) {
            i = skipQuotedString(code, i, "'");
            continue;
        }
        if (ch === '"') {
            i = skipQuotedString(code, i, '"');
            continue;
        }
        if (ch === "`") {
            i = skipTemplateLiteral(code, i);
            continue;
        }
        if (ch === "/" && code[i + 1] === "/") {
            while (i < code.length && code[i] !== "\n") i++;
            continue;
        }
        if (ch === "/" && code[i + 1] === "*") {
            const end = code.indexOf("*/", i + 2);
            i = end === -1 ? code.length : end + 2;
            continue;
        }
        if (ch === "{") depth++;
        else if (ch === "}") depth--;
        i++;
    }
    return i;
}

function skipTemplateLiteral(code: string, start: number): number {
    let i = start + 1;
    while (i < code.length) {
        const ch = code[i];
        if (ch === "\\" && i + 1 < code.length) {
            i += 2;
            continue;
        }
        if (ch === "`") return i + 1;
        if (ch === "$" && code[i + 1] === "{") {
            i = skipTemplateSubstitution(code, i + 2);
            continue;
        }
        i++;
    }
    return code.length;
}

function indexToLineColumn(code: string, index: number): { line: number; column: number } {
    let line = 1;
    let lineStart = 0;
    for (let p = 0; p < index; p++) {
        if (code[p] === "\n") {
            line++;
            lineStart = p + 1;
        }
    }
    return { line, column: index - lineStart + 1 };
}

function unescapeJsStringLiteral(raw: string): string {
    let out = "";
    for (let p = 0; p < raw.length; p++) {
        if (raw[p] !== "\\" || p + 1 >= raw.length) {
            out += raw[p];
            continue;
        }
        const n = raw[p + 1];
        switch (n) {
            case "n":
                out += "\n";
                p++;
                break;
            case "r":
                out += "\r";
                p++;
                break;
            case "t":
                out += "\t";
                p++;
                break;
            case "v":
                out += "\v";
                p++;
                break;
            case "b":
                out += "\b";
                p++;
                break;
            case "f":
                out += "\f";
                p++;
                break;
            case "u": {
                const hex = raw.slice(p + 2, p + 6);
                if (/^[0-9a-fA-F]{4}$/.test(hex)) {
                    out += String.fromCodePoint(parseInt(hex, 16));
                    p += 5;
                } else {
                    out += n;
                    p++;
                }
                break;
            }
            case "x": {
                const hex = raw.slice(p + 2, p + 4);
                if (/^[0-9a-fA-F]{2}$/.test(hex)) {
                    out += String.fromCharCode(parseInt(hex, 16));
                    p += 3;
                } else {
                    out += n;
                    p++;
                }
                break;
            }
            case "\r":
                p++;
                if (raw[p + 1] === "\n") p++;
                break;
            case "\n":
            case "\u2028":
            case "\u2029":
                p++;
                break;
            default:
                out += n;
                p++;
                break;
        }
    }
    return out;
}

function readStaticFirstArg(
    code: string,
    openParenIndex: number,
): { key: string; value: string; closeParenIndex: number } | null {
    let i = openParenIndex + 1;
    while (i < code.length) {
        const c = code[i];
        if (c === undefined || !/\s/.test(c)) break;
        i++;
    }

    const q = code[i];
    if (q !== "'" && q !== '"' && q !== "`") return null;

    let raw: string;
    if (q === "`") {
        raw = "";
        i++;
        let closed = false;
        while (i < code.length) {
            const ch = code[i];
            if (ch === "\\" && i + 1 < code.length) {
                raw += ch + code[i + 1];
                i += 2;
                continue;
            }
            if (ch === "`") {
                i++;
                closed = true;
                break;
            }
            if (ch === "$" && code[i + 1] === "{") return null;
            raw += ch;
            i++;
        }
        if (!closed) return null;
    } else {
        raw = "";
        i++;
        let closed = false;
        while (i < code.length) {
            const ch = code[i];
            if (ch === "\\" && i + 1 < code.length) {
                raw += ch + code[i + 1];
                i += 2;
                continue;
            }
            if (ch === q) {
                i++;
                closed = true;
                break;
            }
            raw += ch;
            i++;
        }
        if (!closed) return null;
    }

    while (i < code.length) {
        const c = code[i];
        if (c === undefined || !/\s/.test(c)) break;
        i++;
    }
    const next = code[i];
    if (next !== ")" && next !== ",") return null;

    const closeIdx = findMatchingCloseParen(code, openParenIndex);
    if (closeIdx === -1) return null;

    const decoded = unescapeJsStringLiteral(raw);
    return { key: decoded, value: decoded, closeParenIndex: closeIdx };
}

function findMatchingCloseParen(code: string, openParenIndex: number): number {
    let depth = 0;
    let i = openParenIndex;
    while (i < code.length) {
        const ch = code[i];
        if (ch === "'" ) {
            i = skipQuotedString(code, i, "'");
            continue;
        }
        if (ch === '"') {
            i = skipQuotedString(code, i, '"');
            continue;
        }
        if (ch === "`") {
            i = skipTemplateLiteral(code, i);
            continue;
        }
        if (ch === "(") depth++;
        else if (ch === ")") {
            depth--;
            if (depth === 0) return i;
        }
        i++;
    }
    return -1;
}

/**
 * Callee names must match whole identifiers, not a suffix (e.g. `import(` must not match as `t(`).
 * - Dotted names (`this.t`) and `$`-prefixed names are matched as literal fragments.
 * - Simple identifiers use a leading word boundary so `import(` does not match bare `t`.
 */
function buildCalleePattern(names: string[]): RegExp {
    const sorted = [...names].sort((a, b) => b.length - a.length);
    const body = sorted
        .map((name) => {
            if (name.includes(".")) {
                return escapeRegex(name);
            }
            if (name.startsWith("$")) {
                return escapeRegex(name);
            }
            return `\\b${escapeRegex(name)}`;
        })
        .join("|");
    return new RegExp(`(?:${body})\\s*\\(`, "g");
}

export function fastMatch(options: FastMatchOptions): I18nUsage[] {
    const { filePath, code, t } = options;
    if (t.length === 0) return [];

    const masked = maskCommentsPreserveLength(code);
    const pattern = buildCalleePattern(t);
    const usages: I18nUsage[] = [];

    let m: RegExpExecArray | null;
    const re = new RegExp(pattern.source, pattern.flags);
    while ((m = re.exec(masked)) !== null) {
        const openParen = m.index + m[0].length - 1;
        const parsed = readStaticFirstArg(code, openParen);
        if (!parsed) continue;

        const { line, column } = indexToLineColumn(code, m.index);
        usages.push({
            key: parsed.key,
            value: parsed.value,
            filePath,
            line,
            column,
        });

        re.lastIndex = parsed.closeParenIndex + 1;
    }

    return usages;
}
