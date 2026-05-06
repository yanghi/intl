import fs from 'node:fs'
import { resolve } from 'node:path'
import { IntlConfiguration, NormalizeConfiguration } from './configuration'
import { globSync } from 'glob'
import { inferFlagLang } from '@/core/document/locale/locale-document'


export function loadConfiguration(cwd: string, path: string): NormalizeConfiguration {
    let resolvedPath = resolve(cwd, path);
    const exists = fs.existsSync(resolvedPath)

    if (!exists) {
        throw new Error(`The configuration file ${path} does not exist`)
    }
    const content = fs.readFileSync(resolvedPath, 'utf8')
    const configuration = JSON.parse(content)

    return normalizeConfiguration(cwd,resolvedPath, configuration)
}

const DEFAULT_EXCLUDE = ['node_modules', 'dist', 'build', 'coverage', 'logs', 'temp', 'cache', 'test', 'output']
/**
 * The default exclude files for json files,exclude these files when globing locale files
 */
const DEFAULT_EXCLUDE_JSON = ['tsconfig.json', '*.tsconfig.json', 'package.json', 'package-lock.json', 'schema.json', '*.schema.json']

export function normalizeConfiguration(cwd: string,absolutePath: string, configuration: IntlConfiguration): NormalizeConfiguration {
    const root = configuration.root || '.'
    const localesFiles = configuration.localeFiles || [`${root}/**/*.json`]
    const rawReferenceLocale = configuration.referenceLocale
    let locales = configuration.locales
    const configDirPath = resolve(absolutePath, '..');
    console.log('globLocaleFiles', localesFiles, 'cwd', resolve(configDirPath, root));
    const globLocaleFiles = globSync(localesFiles, {
        cwd: resolve(configDirPath, root),
        ignore: configuration.exclude || DEFAULT_EXCLUDE.concat(DEFAULT_EXCLUDE_JSON),
        nodir: true,
        absolute: true,
    })

    if (!globLocaleFiles.length) {
        throw new Error('No locale files found, please set the correct localeFiles in configuration')
    }

    if (!locales || locales.length === 0) {
        locales = [...new Set(globLocaleFiles.map(file => inferFlagLang(file)).filter(Boolean) as string[])]
    }

    if (!locales.length) {
        throw new Error('No locales found, please set the correct locales in configuration')
    }

    let referenceLocale = rawReferenceLocale || locales[0]!
    if (rawReferenceLocale && !locales.includes(rawReferenceLocale)) {
        throw new Error(`The reference locale ${rawReferenceLocale} is not in the locales list, must be one of the locales: ${locales.join(', ')}`)
    }

    const i18n = Object.assign({
        t: ['t', '$t', 'this.t'],
        placeholderPattern: '{}',
    }, configuration.i18n)

    const collect = configuration.collect || {}

    return {
        rawConfiguration: configuration,
        root: configuration.root || process.cwd(),
        rootDirPath: configDirPath,
        include: configuration.include || ['src', 'lib', 'packages'].map(dir => `${dir}/**/*.{js,ts,jsx,tsx,vue}`),
        exclude: configuration.exclude || DEFAULT_EXCLUDE,
        i18n,
        locales,
        referenceLocale,
        localeFiles: globLocaleFiles,
        collect: {
            ...collect,
            referenceLocaleKeyAsValue: collect.referenceLocaleKeyAsValue ?? false,
            mergeStrategy: collect.mergeStrategy ?? 'incremental',
        },
    }
}