import * as languageConfig from '../config/languages.json'

export type Language = 'en' | 'zh' | 'de' | 'tzm'

interface LanguageConfig {
  defaultLanguage: string
  supportedLanguages: Array<{
    code: string
    name: string
    nativeName: string
  }>
  translations: Record<string, Record<string, string>>
}

// Load translations from the JSON config file
const config: LanguageConfig = languageConfig as LanguageConfig
export const translations = config.translations
export const supportedLanguages = config.supportedLanguages
export const defaultLanguage = config.defaultLanguage as Language

// All translations are now managed in languages.json config file

export function getTranslation(language: Language, key: string): string {
  const keys = key.split('.')
  let value: any = translations[language]
  
  for (const k of keys) {
    value = value?.[k]
  }
  
  return value || key
}

export function useTranslation(language: Language) {
  return {
    t: (key: string) => getTranslation(language, key),
    language
  }
}