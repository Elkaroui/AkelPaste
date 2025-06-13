# Language Configuration System

This directory contains the language configuration system for AkelPaste, which allows for easy management and updates of translations and language settings.

## Files Overview

### `languages.json`
The main configuration file that contains:
- **defaultLanguage**: The default language code (e.g., 'en', 'zh')
- **supportedLanguages**: Array of supported language objects with code, name, and native name
- **translations**: Object containing all translations for each supported language

### Structure
```json
{
  "defaultLanguage": "en",
  "supportedLanguages": [
    {
      "code": "en",
      "name": "English",
      "nativeName": "English"
    },
    {
      "code": "zh",
      "name": "Chinese",
      "nativeName": "中文"
    }
  ],
  "translations": {
    "en": {
      "key": "English Translation"
    },
    "zh": {
      "key": "中文翻译"
    }
  }
}
```

## Usage

### 1. Manual Updates
You can directly edit the `languages.json` file to:
- Add new translation keys
- Update existing translations
- Change the default language
- Add new supported languages

### 2. Programmatic Updates
Use the `LanguageManager` utility class located in `../utils/languageManager.ts`:

```typescript
import { LanguageManager } from '../utils/languageManager'

// Add new translations
await LanguageManager.updateTranslations('en', {
  'newKey': 'New Translation'
})

// Change default language
await LanguageManager.updateDefaultLanguage('zh')

// Add new supported language
await LanguageManager.addSupportedLanguage('ja', 'Japanese', '日本語')
```

### 3. Example Scripts
Check the `../scripts/updateLanguage.ts` file for practical examples of how to:
- Add new translations
- Update existing translations
- Add new language support
- Reset configuration to defaults

## Adding a New Language

1. **Add to supported languages**:
   ```typescript
   await LanguageManager.addSupportedLanguage('fr', 'French', 'Français')
   ```

2. **Add translations**:
   ```typescript
   await LanguageManager.updateTranslations('fr', {
     'settings': 'Paramètres',
     'theme': 'Thème',
     'language': 'Langue'
     // ... add all required translations
   })
   ```

3. **Update TypeScript types** (if needed):
   Update the `Language` type in `../utils/translations.ts`:
   ```typescript
   export type Language = 'en' | 'zh' | 'fr'
   ```

## Translation Keys

Common translation keys used throughout the application:

### Settings
- `settings`: Settings page title
- `theme`: Theme section
- `language`: Language section
- `system`, `light`, `dark`: Theme options

### Actions
- `save`, `cancel`, `delete`, `edit`, `add`: Common actions
- `search`: Search functionality
- `exportData`, `importData`: Data management

### Messages
- `success`, `error`, `warning`, `info`: Status messages
- `exportSuccess`, `exportError`: Export-specific messages
- `importSuccess`, `importError`: Import-specific messages

### Templates
- `templates`: Templates section
- `newTemplate`: New template action
- `templateName`, `templateContent`: Template fields

## Best Practices

1. **Consistent Key Naming**: Use camelCase for translation keys
2. **Descriptive Keys**: Make keys self-explanatory (e.g., `exportSuccess` instead of `msg1`)
3. **Grouping**: Group related translations with prefixes (e.g., `export*`, `import*`)
4. **Fallbacks**: Always provide English translations as fallback
5. **Testing**: Test all languages after adding new translations

## Development Workflow

1. **Add new features**: When adding new UI text, add translation keys to `languages.json`
2. **Update translations**: Use the `LanguageManager` or edit the JSON file directly
3. **Test changes**: Restart the development server to see changes
4. **Commit changes**: Include the updated `languages.json` in your commits

## Troubleshooting

### Missing Translations
If a translation key is missing, the application will:
1. Try to use the English translation as fallback
2. Display the key itself if no fallback exists
3. Log a warning in the console

### Invalid JSON
If the `languages.json` file has invalid JSON syntax:
1. The application will use hardcoded fallback translations
2. Check the browser console for parsing errors
3. Validate the JSON syntax using a JSON validator

### File Permissions
If you can't save changes to the configuration:
1. Check file permissions
2. Ensure the application has write access to the config directory
3. Try running the development server with appropriate permissions