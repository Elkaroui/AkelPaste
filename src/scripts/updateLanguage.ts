/**
 * Example script demonstrating how to update language configuration
 * 
 * This script shows how to:
 * 1. Add new translations
 * 2. Update existing translations
 * 3. Change the default language
 * 4. Add new supported languages
 * 
 * Usage:
 * - Import this file in your development environment
 * - Call the functions as needed to update language settings
 * - The changes will be saved to the languages.json file
 */

import { LanguageManager } from '../utils/languageManager'
import { Language } from '../utils/translations'

/**
 * Add new translation keys for both English and Chinese
 */
export async function addNewTranslations() {
  try {
    // Add new English translations
    await LanguageManager.updateTranslations('en', {
      'newFeature': 'New Feature',
      'advancedSettings': 'Advanced Settings',
      'backup': 'Backup',
      'restore': 'Restore',
      'preferences': 'Preferences'
    })

    // Add new Chinese translations
    await LanguageManager.updateTranslations('zh', {
      'newFeature': '新功能',
      'advancedSettings': '高级设置',
      'backup': '备份',
      'restore': '恢复',
      'preferences': '偏好设置'
    })

    console.log('New translations added successfully!')
  } catch (error) {
    console.error('Failed to add new translations:', error)
  }
}

/**
 * Update existing translations
 */
export async function updateExistingTranslations() {
  try {
    // Update English translations
    await LanguageManager.updateTranslations('en', {
      'settings': 'Application Settings',
      'dataManagement': 'Data & Backup Management'
    })

    // Update Chinese translations
    await LanguageManager.updateTranslations('zh', {
      'settings': '应用程序设置',
      'dataManagement': '数据和备份管理'
    })

    console.log('Existing translations updated successfully!')
  } catch (error) {
    console.error('Failed to update existing translations:', error)
  }
}

/**
 * Change the default language
 */
export async function changeDefaultLanguage(language: Language) {
  try {
    await LanguageManager.updateDefaultLanguage(language)
    console.log(`Default language changed to: ${language}`)
  } catch (error) {
    console.error('Failed to change default language:', error)
  }
}

/**
 * Add a new supported language (example: Japanese)
 */
// Japanese support removed as requested
// export async function addJapaneseSupport() {
//   // Function removed to avoid unwanted Japanese language support
// }


/**
 * Example of how to use these functions in development
 */
export async function exampleUsage() {
  console.log('Starting language configuration update...')
  
  // Add new translations
  await addNewTranslations()
  
  // Update existing translations
  await updateExistingTranslations()
  
  // Change default language to Chinese
  await changeDefaultLanguage('zh')
  
  // Japanese support removed as requested
  // await addJapaneseSupport()
  
  // Reload configuration to see changes
  await LanguageManager.reloadConfig()
  
  console.log('Language configuration updated successfully!')
  console.log('Current config:', LanguageManager.getConfig())
}

/**
 * Reset language configuration to default
 */
export async function resetLanguageConfig() {
  try {
    await LanguageManager.resetToDefault()
    console.log('Language configuration reset to default')
  } catch (error) {
    console.error('Failed to reset language configuration:', error)
  }
}

// Uncomment the line below to run the example
// exampleUsage()