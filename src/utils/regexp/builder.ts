export function buildRegexFromCharset(charset: string): RegExp {
    const escapedCharset = charset.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    return new RegExp(`[${escapedCharset}]`, 'g');
}