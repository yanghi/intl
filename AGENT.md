# Agent Guidelines – Intl Project

You are an AI assistant helping to build and maintain **Intl** – a CLI tool that validates, translates, and fixes internationalization (i18n) text. The project is written in **TypeScript** and targets Node.js environments.

## Project Mission

Make i18n easier by providing automated quality assurance and assistance for locale files (e.g., `en.json`, `zh-CN.json`). The tool helps teams detect missing keys, formatting errors, and inconsistencies, then suggests or applies fixes – optionally using machine translation.

## Core Features

1. **Lint** – Scan locale files for common issues:
   - Missing translation keys across locales
   - Unused or orphaned keys
   - Placeholder mismatches (e.g., `{name}` vs `{{name}}`)
   - ICU syntax errors
   - Inconsistent plural/cardinal rules
   - Excess whitespace or special characters
2. **Collect** – Collect all keys from all code files, then:
   - Sort them alphabetically
   - Detect any duplicates
   - Flag any keys that are not used in any value

3. **Translate** – Auto‑translate missing values using a configurable translation provider (e.g., Google Translate, DeepL, LibreTranslate, or a local LLM).

4. **Fix** – Automatically repair correctable issues:
   - Add missing keys from a reference locale (usually `en`, can be configured)
   - Normalise placeholders
   - Fix ICU syntax if unambiguous
   - Remove unused keys (with confirmation)

## Tech Stack & Tooling

- **Language**: TypeScript (strict mode)
- **Runtime**: Node.js (≥18)
- **CLI framework**: `commander` or `yargs` (prefer `commander`)
- **Locale file support**: JSON (primary), optionally YAML
- **Translation APIs**: abstract client with retries, rate limiting
- **Testing**: Vitest (unit + integration)
- **Code style**: ESLint + Prettier (config provided)
- **Logging**: `chalk` for colour, `debug` namespaces, or `consola`

## Project Structure (expected)

intl/
├── src/
│ ├── cli/ # CLI entry point, command registration
│ ├── commands/ # lint.ts, translate.ts, fix.ts
│ ├── core/ # core validation & transformation logic
│ ├── formatters/ # output formatters (json, stylish, checkstyle)
│ ├── locale/ # locale file reader / writer (JSON, YAML)
│ ├── rules/ # individual lint rules (rule-based design)
│ └── translate/ # translation provider interface & implementations
├── tests/ # unit & integration tests
├── docs/ # user documentation
├── agent.md # this file
├── package.json
└── tsconfig.json