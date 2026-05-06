export enum PunctuationKind {

}

export enum Punctuation {
    Period,
    ExclamationMark,
    QuestionMark,
    Colon,
    Semicolon,
    Comma,
    Dash,
    Underscore,
    Asterisk,
    Slash,
    Backslash,
    Pipe,
    Quote,
    DoubleQuote,
    SingleQuote,
    Backtick,
    Tilde,
    Caret,
    Dollar,
    Percent,
    Ampersand,
    Hash,
    At,
}


export interface LocalizedPunctuationSet {
    /**
     * all punctuation characters
     */
    characters: string
    charactersRegex: RegExp
    locale: string
    /**
     * the punctuation set for the locale
     */
    punctuationSet: Record<Punctuation, string>

}

const EN_PUNCTUATION_SET: Record<Punctuation, string> = {
  [Punctuation.Period]: '.',
  [Punctuation.ExclamationMark]: '!',
  [Punctuation.QuestionMark]: '?',
  [Punctuation.Colon]: ':',
  [Punctuation.Semicolon]: ';',
  [Punctuation.Comma]: ',',
  [Punctuation.Dash]: '-',
  [Punctuation.Underscore]: '_',
  [Punctuation.Asterisk]: '*',
  [Punctuation.Slash]: '/',
  [Punctuation.Backslash]: '\\',
  [Punctuation.Pipe]: '|',
  [Punctuation.Quote]: "'",
  [Punctuation.DoubleQuote]: '"',
  [Punctuation.SingleQuote]: "'",
  [Punctuation.Backtick]: '`',
  [Punctuation.Tilde]: '~',
  [Punctuation.Caret]: '^',
  [Punctuation.Dollar]: '$',
  [Punctuation.Percent]: '%',
  [Punctuation.Ampersand]: '&',
  [Punctuation.Hash]: '#',
  [Punctuation.At]: '@',
}

const ZH_PUNCTUATION_SET: Record<Punctuation, string> = {
    [Punctuation.Period]: '。',
    [Punctuation.ExclamationMark]: '！',
    [Punctuation.QuestionMark]: '？',
    [Punctuation.Colon]: '：',
    [Punctuation.Semicolon]: '；',
    [Punctuation.Comma]: '，',
    [Punctuation.Dash]: '－',
    [Punctuation.Underscore]: '＿',
    [Punctuation.Asterisk]: '＊',
    [Punctuation.Slash]: '／',
    [Punctuation.Backslash]: '＼',
    [Punctuation.Pipe]: '｜',
    [Punctuation.Quote]: '‘',
    [Punctuation.DoubleQuote]: '“',
    [Punctuation.SingleQuote]: '‘',
    [Punctuation.Backtick]: '‘',
    [Punctuation.Tilde]: '～',
    [Punctuation.Caret]: '^',
    [Punctuation.Dollar]: '￥',
    [Punctuation.Percent]: '％',
    [Punctuation.Ampersand]: '＆',
    [Punctuation.Hash]: '＃',
    [Punctuation.At]: '＠',
}

export const enPunctuationSet = defineLocalizedPunctuationSet('en', EN_PUNCTUATION_SET)
export const zhPunctuationSet = defineLocalizedPunctuationSet('zh', ZH_PUNCTUATION_SET)

/** Escape for use inside a RegExp character class ` [...] `. */
function escapeRegexCharacterClass(char: string): string {
    switch (char) {
        case '\\':
            return '\\\\';
        case ']':
            return '\\]';
        case '^':
            return '\\^';
        case '-':
            return '\\-';
            
        default:
            return char;
    }
}

export function defineLocalizedPunctuationSet(locale: string, punctuationSet: Record<Punctuation, string>): LocalizedPunctuationSet {

    const characters = Object.values(punctuationSet).join('')
    const escapedForClass = [...characters].map(escapeRegexCharacterClass).join('')
    const charactersRegex = new RegExp(`[${escapedForClass}]`, 'g')
    return {
        characters,
        charactersRegex,
        locale,
        punctuationSet,
    } as LocalizedPunctuationSet
}



export class LocalePunctuationRegistry {
     readonly punctuationSets: Map<string, LocalizedPunctuationSet> = new Map()
    private _referenceLocale: string = 'en'
    constructor(referenceLocale: string) {
        this.addPunctuationSet(enPunctuationSet)
        this.addPunctuationSet(zhPunctuationSet)
        this.referenceLocale = referenceLocale
    }
    set referenceLocale(locale: string) {
        if(!this.punctuationSets.has(locale)) {
            throw new Error(`The locale ${locale} is not supported, please add the punctuation set for the locale first`)
        }
        this._referenceLocale = locale
    }
    get referenceLocale(): string {
        return this.referenceLocale
    }
    get defaultPunctuationSet(): LocalizedPunctuationSet | null {
        return this.punctuationSets.get(this.referenceLocale) || null
    }

    addPunctuationSet(punctuationSet: LocalizedPunctuationSet): void {
        this.punctuationSets.set(punctuationSet.locale, punctuationSet)
    }

    getPunctuationSet(locale: string): LocalizedPunctuationSet | null {
        return this.punctuationSets.get(locale) || null
    }
    getPunctuationCharacters(locale: string): string | null {
        return this.getPunctuationSet(locale)?.characters || this.defaultPunctuationSet?.characters || null
    }
}

export const localePunctuationRegistry = new LocalePunctuationRegistry('en')