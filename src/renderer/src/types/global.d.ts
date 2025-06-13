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

export interface ElectronAPI {
  createFloatingWindow: (template: Template) => Promise<{ success: boolean; error?: string }>
  closeFloatingWindow: (templateId: string) => Promise<void>
  closeAllFloatingWindows: () => Promise<void>
  reloadFloatingTemplates: () => Promise<{ success: boolean; error?: string }>
  copyToClipboard: (text: string) => Promise<void>
  onTemplateData: (callback: (template: Template) => void) => void
  removeAllListeners: (channel?: string) => void
}

declare global {
  interface Window {
      api?: {
        createFloatingWindow: (template: Template) => Promise<{ success: boolean; error?: string }>
        closeFloatingWindow: (templateId: string) => Promise<void>
        closeAllFloatingWindows: () => Promise<void>
  reloadFloatingTemplates: () => Promise<{ success: boolean; error?: string }>
        createFloatingTemplates: (templates: any[]) => Promise<{ success: boolean; error?: string }>
        closeFloatingTemplates: () => Promise<{ success: boolean; error?: string }>
        updateFloatingTemplates: (templates: any[]) => Promise<{ success: boolean; error?: string }>
        isFloatingTemplatesOpen: () => Promise<{ isOpen: boolean }>
        resizeFloatingWindow: (width: number, height: number) => Promise<{ success: boolean; error?: string }>
        requestTemplatesData: () => Promise<any[]>
        copyToClipboard: (text: string) => Promise<void>
        registerGlobalShortcuts: (templates: any[], settings?: any) => Promise<any>
        unregisterGlobalShortcuts: () => Promise<void>
        checkShortcutConflict: (shortcut: string, excludeTemplateId?: string) => Promise<boolean>
        onShortcutTriggered: (callback: (data: { templateId: string, title: string, shortcut: string }) => void) => void
        onTemplateData: (callback: (template: Template) => void) => void
        onTemplatesData: (callback: (templates: Template[]) => void) => void
        removeAllListeners: (channel?: string) => void
      }
    }
}

export {}