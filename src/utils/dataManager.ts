export interface AppData {
  templates: Template[]
  collections: string[]
  settings: {
    theme: Theme
    pinTemplates: boolean
    autoSave: boolean
    language: 'en' | 'zh'
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
  collection?: string
  shortcut?: string
  pinned: boolean
  createdAt: Date
  updatedAt: Date
}

export type Theme = 'light' | 'dark' | 'system'

const DATA_VERSION = '1.0.0'
const STORAGE_KEY = 'akel-app-data'
const BACKUP_KEY = 'akel-app-data-backup'

function normalizeCollectionName(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined
  }

  const normalized = value.trim().replace(/\s+/g, ' ')
  return normalized || undefined
}

function normalizeTemplate(template: any): Template {
  return {
    ...template,
    collection: normalizeCollectionName(template.collection),
    createdAt: new Date(template.createdAt),
    updatedAt: template.updatedAt ? new Date(template.updatedAt) : new Date(template.createdAt)
  }
}

function normalizeCollections(collections: unknown, templates: Template[]): string[] {
  const normalizedCollections: string[] = []

  if (Array.isArray(collections)) {
    for (const collection of collections) {
      const normalized = normalizeCollectionName(collection)
      if (
        normalized &&
        !normalizedCollections.some((item) => item.toLowerCase() === normalized.toLowerCase())
      ) {
        normalizedCollections.push(normalized)
      }
    }
  }

  for (const template of templates) {
    if (
      template.collection &&
      !normalizedCollections.some((item) => item.toLowerCase() === template.collection!.toLowerCase())
    ) {
      normalizedCollections.push(template.collection)
    }
  }

  return normalizedCollections
}

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
      let normalizedTemplates: Template[] = []
      
      // Convert date strings back to Date objects
      if (data.templates) {
        normalizedTemplates = data.templates.map((t: any) => normalizeTemplate(t))
      }
      
      return {
        ...dataManager.getDefaultData(),
        ...data,
        templates: normalizedTemplates,
        collections: normalizeCollections(data.collections, normalizedTemplates)
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
      let normalizedTemplates: Template[] = []
      if (data.templates) {
        normalizedTemplates = data.templates.map((t: any) => normalizeTemplate(t))
      }
      
      return {
        ...dataManager.getDefaultData(),
        ...data,
        templates: normalizedTemplates,
        collections: normalizeCollections(data.collections, normalizedTemplates)
      }
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
    templates: [],
    collections: [],
    settings: {
      theme: 'system' as Theme,
      pinTemplates: false,
      autoSave: true,
      language: 'en' as 'en' | 'zh',
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
