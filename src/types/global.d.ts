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

export interface DesktopApi {
  createFloatingWindow: (template: Template) => Promise<{ success: boolean; error?: string }>
  closeFloatingWindow: (templateId: string) => Promise<void>
  closeAllFloatingWindows: () => Promise<void>
  reloadFloatingTemplates: () => Promise<{ success: boolean; error?: string }>
  createFloatingTemplates: (templates: Template[]) => Promise<{ success: boolean; error?: string }>
  closeFloatingTemplates: () => Promise<{ success: boolean; error?: string }>
  updateFloatingTemplates: (templates: Template[]) => Promise<{ success: boolean; error?: string }>
  isFloatingTemplatesOpen: () => Promise<{ isOpen: boolean }>
  resizeFloatingWindow: (width: number, height: number) => Promise<{ success: boolean; error?: string }>
  requestTemplatesData: () => Promise<Template[]>
  copyToClipboard: (text: string) => Promise<void>
  registerGlobalShortcuts: (templates: Template[], settings?: Record<string, unknown>) => Promise<any>
  unregisterGlobalShortcuts: () => Promise<void>
  checkShortcutConflict: (shortcut: string, excludeTemplateId?: string) => Promise<boolean>
  onShortcutTriggered: (
    callback: (data: { templateId: string; title: string; shortcut: string }) => void
  ) => void
  onTemplateData: (callback: (template: Template) => void) => void
  onTemplatesData: (callback: (templates: Template[]) => void) => void
  removeAllListeners: (channel?: string) => void
}

declare global {
  interface Window {
    electron: {
      ipcRenderer: {
        invoke: (channel: string, ...args: unknown[]) => Promise<any>
      }
      process: {
        versions: Record<string, string>
      }
    }
    api: DesktopApi
  }
}

export {}
