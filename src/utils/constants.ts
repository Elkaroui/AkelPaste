// Common emojis and symbols for quick selection
export const EMOJI_CATEGORIES = {
  'Smileys': [
    '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', 
    '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', 
    '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳'
  ],
  'Objects': [
    '📱', '💻', '🖥️', '⌨️', '🖱️', '🖨️', '📄', '📝', '📋', '📌', 
    '📍', '📎', '🔗', '📁', '📂', '🗂️', '📅', '📆', '🗓️', '📇', 
    '📈', '📉', '📊', '💾', '💿'
  ],
  'Symbols': [
    '⭐', '🌟', '✨', '⚡', '🔥', '💎', '🎯', '🎪', '🎨', '🎭', 
    '❤️', '💙', '💚', '💛', '🧡', '💜', '🖤', '🤍', '🤎', '💔', 
    '❣️', '💕', '💞', '💓'
  ],
  'Activities': [
    '⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱', 
    '🪀', '🏓', '🏸', '🏒', '🏑', '🥍', '🏏', '🪃', '🥅', '⛳', 
    '🪁', '🏹', '🎣', '🤿', '🥊', '🥋', '🎽', '🛹', '🛷', '⛸️'
  ]
} as const

// Application constants
export const APP_CONFIG = {
  DATA_VERSION: '1.0.0',
  STORAGE_KEY: 'akel-app-data',
  BACKUP_KEY: 'akel-app-data-backup',
  MAX_TEMPLATE_TITLE_LENGTH: 100,
  MAX_TEMPLATE_CONTENT_LENGTH: 10000,
  DEFAULT_THEME: 'system' as const,
  FLOATING_WINDOW_DEFAULT_POSITION: { x: 100, y: 100 }
} as const

// Keyboard shortcuts
export const DEFAULT_SHORTCUTS = {
  QUICK_PASTE: 'Ctrl + Shift + V',
  SHOW_TEMPLATES: 'Ctrl + Shift + T',
  NEW_TEMPLATE: 'Ctrl + N',
  SAVE_TEMPLATE: 'Ctrl + S'
} as const

// Theme options
export const THEME_OPTIONS = [
  {
    value: 'system' as const,
    label: 'System',
    description: 'Use system preference'
  },
  {
    value: 'light' as const,
    label: 'Light',
    description: 'Light mode'
  },
  {
    value: 'dark' as const,
    label: 'Dark',
    description: 'Dark mode'
  }
] as const

// File extensions for export/import
export const SUPPORTED_FILE_EXTENSIONS = {
  JSON: '.json',
  TXT: '.txt'
} as const

// Toast messages
export const TOAST_MESSAGES = {
  TEMPLATE_COPIED: 'Template copied to clipboard!',
  TEMPLATE_COPY_FAILED: 'Failed to copy template',
  TEMPLATE_CREATED: 'Template created!',
  TEMPLATE_UPDATED: 'Template updated!',
  TEMPLATE_DELETED: 'Template deleted!',
  SHORTCUT_RECORDED: 'Shortcut recorded!',
  SHORTCUT_CANCELLED: 'Shortcut recording cancelled',
  DATA_EXPORTED: 'Templates exported successfully!',
  DATA_IMPORTED: 'Templates imported successfully!',
  DATA_EXPORT_FAILED: 'Failed to export templates',
  DATA_IMPORT_FAILED: 'Failed to import templates',
  BACKUP_RESTORED: 'Backup restored successfully!',
  BACKUP_RESTORE_FAILED: 'No backup found or restore failed',
  DATA_CLEARED: 'All data cleared successfully!',
  DATA_CLEAR_FAILED: 'Failed to clear data',
  THEME_CHANGED: (theme: string) => `Theme changed to ${theme}`
} as const