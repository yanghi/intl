import fs from 'node:fs'
import { IntlConfiguration, NormalizeConfiguration } from './configuration'
import { globSync } from 'glob'
import { inferFlagLang } from '@/core/document/locale/locale-document'


export function loadConfiguration(path: string): IntlConfiguration {
    const exists = fs.existsSync(path)
    if(!exists) {
        throw new Error(`The configuration file ${path} does not exist`)
    }
    const content = fs.readFileSync(path, 'utf8')
    const configuration = JSON.parse(content)
    return normalizeConfiguration(path, configuration)
}

const DEFAULT_EXCLUDE = ['node_modules', 'dist', 'build', 'coverage', 'logs', 'temp', 'cache','test','output']
/**
 * The default exclude files for json files,exclude these files when globing locale files
 */
const DEFAULT_EXCLUDE_JSON =['tsconfig.json','*.tsconfig.json', 'package.json', 'package-lock.json','schema.json','*.schema.json']

export function normalizeConfiguration(cwd: string, configuration: IntlConfiguration): NormalizeConfiguration {
    const root = configuration.root || cwd || process.cwd()
    const localesFiles = configuration.localeFiles || [`${root}/**/*.json`]
    const rawReferenceLocale = configuration.referenceLocale
    let locales = configuration.locales

    const globLocaleFiles = globSync(localesFiles, {
        cwd: configuration.root || cwd || process.cwd(),
        ignore: configuration.exclude || DEFAULT_EXCLUDE.concat(DEFAULT_EXCLUDE_JSON),
        nodir: true,
        absolute: true,
    })

    if(!globLocaleFiles.length) {
        throw new Error('No locale files found, please set the correct localeFiles in configuration')
    }

    if (!locales || locales.length === 0) {
        locales = [...new Set(globLocaleFiles.map(file => inferFlagLang(file)).filter(Boolean) as string[])]
    }

    if(!locales.length) {
        throw new Error('No locales found, please set the correct locales in configuration')
    }

    let referenceLocale = rawReferenceLocale || locales[0]!
    if(rawReferenceLocale && !locales.includes(rawReferenceLocale)) {
        throw new Error(`The reference locale ${rawReferenceLocale} is not in the locales list, must be one of the locales: ${locales.join(', ')}`)
    }

    const i18n = Object.assign({
        t: ['t', '$t', 'this.t'],
        placeholderPattern: '{}',
    }, configuration.i18n)

    return {
        rawConfiguration: configuration,
        root: configuration.root || process.cwd(),
        include: configuration.include || ['src','lib','packages'].map(dir => `${root}/${dir}/**/*.{js,ts,jsx,tsx,vue}`),
        exclude: configuration.exclude || DEFAULT_EXCLUDE,
        i18n,
        locales,
        referenceLocale,
        localeFiles: globLocaleFiles,
    }
}