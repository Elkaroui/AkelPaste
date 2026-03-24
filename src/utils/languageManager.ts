import { Language } from './translations'
import languageConfig from '../config/languages.json'
import { promises as fs } from 'fs'
import path from 'path'

interface LanguageConfig {
  defaultLanguage: string
  supportedLanguages: Array<{
    code: string
    name: string
    nativeName: string
  }>
  translations: Record<string, Record<string, string>>
}

/**
 * Language Manager utility for handling language configuration
 */
export class LanguageManager {
  private static configPath = path.join(__dirname, '../config/languages.json')
  private static config: LanguageConfig = languageConfig

  /**
   * Get the current language configuration
   */
  static getConfig(): LanguageConfig {
    return this.config
  }

  /**
   * Get supported languages
   */
  static getSupportedLanguages() {
    return this.config.supportedLanguages
  }

  /**
   * Get default language
   */
  static getDefaultLanguage(): Language {
    return this.config.defaultLanguage as Language
  }

  /**
   * Get translations for a specific language
   */
  static getTranslations(language: Language): Record<string, string> {
    return this.config.translations[language] || this.config.translations[this.getDefaultLanguage()]
  }

  /**
   * Update the default language in the configuration
   */
  static async updateDefaultLanguage(language: Language): Promise<void> {
    try {
      this.config.defaultLanguage = language
      await this.saveConfig()
    } catch (error) {
      console.error('Failed to update default language:', error)
      throw error
    }
  }

  /**
   * Add a new translation key-value pair for a specific language
   */
  static async addTranslation(language: Language, key: string, value: string): Promise<void> {
    try {
      if (!this.config.translations[language]) {
        this.config.translations[language] = {}
      }
      this.config.translations[language][key] = value
      await this.saveConfig()
    } catch (error) {
      console.error('Failed to add translation:', error)
      throw error
    }
  }

  /**
   * Update multiple translations for a specific language
   */
  static async updateTranslations(language: Language, translations: Record<string, string>): Promise<void> {
    try {
      if (!this.config.translations[language]) {
        this.config.translations[language] = {}
      }
      Object.assign(this.config.translations[language], translations)
      await this.saveConfig()
    } catch (error) {
      console.error('Failed to update translations:', error)
      throw error
    }
  }

  /**
   * Add a new supported language
   */
  static async addSupportedLanguage(code: string, name: string, nativeName: string): Promise<void> {
    try {
      const existingLanguage = this.config.supportedLanguages.find(lang => lang.code === code)
      if (existingLanguage) {
        existingLanguage.name = name
        existingLanguage.nativeName = nativeName
      } else {
        this.config.supportedLanguages.push({ code, name, nativeName })
      }
      
      // Initialize empty translations for the new language if not exists
      if (!this.config.translations[code]) {
        this.config.translations[code] = {}
      }
      
      await this.saveConfig()
    } catch (error) {
      console.error('Failed to add supported language:', error)
      throw error
    }
  }

  /**
   * Save the current configuration to the JSON file
   */
  private static async saveConfig(): Promise<void> {
    try {
      const configJson = JSON.stringify(this.config, null, 2)
      await fs.writeFile(this.configPath, configJson, 'utf8')
    } catch (error) {
      console.error('Failed to save language configuration:', error)
      throw error
    }
  }

  /**
   * Reload configuration from the JSON file
   */
  static async reloadConfig(): Promise<void> {
    try {
      const configData = await fs.readFile(this.configPath, 'utf8')
      this.config = JSON.parse(configData)
    } catch (error) {
      console.error('Failed to reload language configuration:', error)
      throw error
    }
  }

  /**
   * Reset configuration to default values
   */
  static async resetToDefault(): Promise<void> {
    try {
      this.config = {
        defaultLanguage: 'en',
        supportedLanguages: [
          { code: 'en', name: 'English', nativeName: 'English' },
          { code: 'zh', name: 'Chinese', nativeName: '中文' }
        ],
        translations: {
          en: {},
          zh: {}
        }
      }
      await this.saveConfig()
    } catch (error) {
      console.error('Failed to reset language configuration:', error)
      throw error
    }
  }
}

// Export convenience functions
export const {
  getConfig,
  getSupportedLanguages,
  getDefaultLanguage,
  getTranslations,
  updateDefaultLanguage,
  addTranslation,
  updateTranslations,
  addSupportedLanguage,
  reloadConfig,
  resetToDefault
} = LanguageManager