import type { LocaleMergeStrategy } from '@/core/document/locale/message-merger'

export interface NormalizeConfiguration {
    rawConfiguration: IntlConfiguration
    root: string
    rootDirPath: string
    include: string[]
    exclude: string[]
    locales: string[]
    referenceLocale: string
    localeFiles: string[]
    i18n: IntlI18nConfiguration
    collect: IntlCollectConfiguration
}

export interface IntlTranslateConfiguration {
    provider?: string
}

export interface IntlCollectConfiguration {
    lint?: boolean
    /**
     * reference locel的 message 会将referenceLocale的key作为value
     */
    referenceLocaleKeyAsValue?: boolean
    /**
     * How collected keys are merged into existing locale JSON.
     * - `incremental`: keep existing non-empty translations; only fill empty slots.
     * - `overwrite`: non-empty collected values replace existing entries.
     */
    mergeStrategy?: LocaleMergeStrategy
}

export interface IntlI18nConfiguration {
    /**
     * The i18n callee names to collect. Defaults to ['t', '$t', 'this.t'].
     */
    t: string[]
    /**
     * The placeholder pattern to use for the i18n callee names. Defaults to '{}'
     */
    placeholderPattern: string
}


export interface IntlRuleConfiguration {

    /**
     * The rule enable status. 'off' | 'warning' | 'error'
     */
    severity?: 'off' | 'warning' | 'error'
    [key: string]: any
}

export type RawIntlRuleConfiguration = IntlRuleConfiguration['severity'] | [IntlRuleConfiguration['severity'], Exclude<IntlRuleConfiguration, 'severity'>]

export interface IntlConfiguration {
    /**
     * The root directory of the project. Defaults to the config file directory.
     */
    root?: string
    /**
     * Files to include in the scan.
     */
    include?: string[]
    /**
     * Files to exclude from the scan.
     */
    exclude?: string[]
    locales?: string[]
    referenceLocale?: string
    /**
     * The locale files
     */
    localeFiles?: string[]
    /**
     * The translation configuration.
     */
    translate?: IntlTranslateConfiguration

    rules?: Record<string, RawIntlRuleConfiguration>
    i18n?: Partial<IntlI18nConfiguration>
    collect?: Partial<IntlCollectConfiguration>
}