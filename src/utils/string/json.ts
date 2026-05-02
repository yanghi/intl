export function isJsonString(str: string): boolean {
    try {
        JSON.parse(str);
        return true;
    } catch (e) {
        return false;
    }
}

export function prettyPrintJson(json: string): string {
    const parsed = JSON.parse(json);
    return JSON.stringify(parsed, null, 2);
}

export function prettyPrintJsonSafe(json: string): string {
    try {
        const parsed = JSON.parse(json);
        return JSON.stringify(parsed, null, 2);
    } catch (e) {
        return json;
    }
}