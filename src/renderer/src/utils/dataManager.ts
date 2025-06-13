export interface AppData {
  templates: Template[]
  settings: {
    theme: Theme
    pinTemplates: boolean
    autoSave: boolean
    autoPaste: boolean
    language: 'en' | 'zh' | 'de' | 'tzm'
    showTemplateContent?: boolean
    emojiFolder?: string
    lastBackup?: string
  }
  version: string
}

export interface Template {
  id: string
  title: string
  content: string
  icon?: string
  shortcut?: string
  pinned: boolean
  createdAt: Date
  updatedAt: Date
}

export type Theme = 'light' | 'dark' | 'system'

const DATA_VERSION = '1.0.0'
const STORAGE_KEY = 'akel-app-data'
const BACKUP_KEY = 'akel-app-data-backup'

export const dataManager = {
  // Save all app data
  saveData: (data: Partial<AppData>) => {
    try {
      const currentData = dataManager.loadData()
      const updatedData: AppData = {
        ...currentData,
        ...data,
        version: DATA_VERSION
      }
      
      // Create backup before saving
      const currentDataStr = localStorage.getItem(STORAGE_KEY)
      if (currentDataStr) {
        localStorage.setItem(BACKUP_KEY, currentDataStr)
      }
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedData))
      return true
    } catch (error) {
      console.error('Failed to save data:', error)
      return false
    }
  },
  
  // Load all app data
  loadData: (): AppData => {
    try {
      const dataStr = localStorage.getItem(STORAGE_KEY)
      if (!dataStr) {
        return dataManager.getDefaultData()
      }
      
      const data = JSON.parse(dataStr)
      
      // Convert date strings back to Date objects
      if (data.templates) {
        data.templates = data.templates.map((t: any) => ({
          ...t,
          createdAt: new Date(t.createdAt),
          updatedAt: t.updatedAt ? new Date(t.updatedAt) : new Date(t.createdAt)
        }))
      }
      
      return {
        ...dataManager.getDefaultData(),
        ...data
      }
    } catch (error) {
      console.error('Failed to load data:', error)
      return dataManager.loadBackup() || dataManager.getDefaultData()
    }
  },
  
  // Load backup data
  loadBackup: (): AppData | null => {
    try {
      const backupStr = localStorage.getItem(BACKUP_KEY)
      if (!backupStr) return null
      
      const data = JSON.parse(backupStr)
      if (data.templates) {
        data.templates = data.templates.map((t: any) => ({
          ...t,
          createdAt: new Date(t.createdAt),
          updatedAt: t.updatedAt ? new Date(t.updatedAt) : new Date(t.createdAt)
        }))
      }
      
      return data
    } catch (error) {
      console.error('Failed to load backup:', error)
      return null
    }
  },
  
  // Export data as JSON file
  exportData: () => {
    try {
      const data = dataManager.loadData()
      const dataStr = JSON.stringify(data, null, 2)
      const blob = new Blob([dataStr], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      
      const a = document.createElement('a')
      a.href = url
      a.download = `akel-backup-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      return true
    } catch (error) {
      console.error('Failed to export data:', error)
      return false
    }
  },
  
  // Import data from JSON file
  importData: (file: File): Promise<boolean> => {
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target?.result as string)
          const success = dataManager.saveData(data)
          resolve(success)
        } catch (error) {
          console.error('Failed to import data:', error)
          resolve(false)
        }
      }
      reader.readAsText(file)
    })
  },
  
  // Get default data structure
  getDefaultData: (): AppData => ({
    templates: [
      {
        id: 'default-1',
        title: 'Welcome Email',
        content: 'Hello! Welcome to our service. We\'re excited to have you on board!',
        icon: '👋',
        shortcut: 'Ctrl+Shift+1',
        pinned: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'default-2',
        title: 'Meeting Follow-up',
        content: 'Thank you for the meeting today. Here are the key points we discussed:\n\n1. \n2. \n3. \n\nNext steps:\n- \n- \n\nBest regards',
        icon: '📝',
        shortcut: 'Ctrl+Shift+2',
        pinned: false,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'default-3',
        title: 'Quick Response',
        content: 'Thanks for reaching out! I\'ll get back to you shortly.',
        icon: '⚡',
        shortcut: 'Ctrl+Shift+3',
        pinned: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ],
    settings: {
      theme: 'system' as Theme,
      pinTemplates: false,
      autoSave: true,
      autoPaste: false,
      language: 'en' as 'en' | 'zh' | 'de' | 'tzm',
      emojiFolder: './src/assets/emoji'
    },
    version: DATA_VERSION
  }),
  
  // Clear all data
  clearData: () => {
    localStorage.removeItem(STORAGE_KEY)
    localStorage.removeItem(BACKUP_KEY)
  }
}