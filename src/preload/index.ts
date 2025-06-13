import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  // Floating window management
createFloatingWindow: (template: any) => ipcRenderer.invoke('create-floating-window', template),
closeFloatingWindow: (templateId: string) => ipcRenderer.invoke('close-floating-window', templateId),
closeAllFloatingWindows: () => ipcRenderer.invoke('close-all-floating-windows'),
  reloadFloatingTemplates: () => ipcRenderer.invoke('reload-floating-templates'),

// New floating templates window management
createFloatingTemplates: (templates: any[]) => ipcRenderer.invoke('create-floating-templates', templates),
closeFloatingTemplates: () => ipcRenderer.invoke('close-floating-templates'),
updateFloatingTemplates: (templates: any[]) => ipcRenderer.invoke('update-floating-templates', templates),
isFloatingTemplatesOpen: () => ipcRenderer.invoke('is-floating-templates-open'),
requestTemplatesData: () => ipcRenderer.invoke('request-templates-data'),
  copyToClipboard: (text: string) => ipcRenderer.invoke('copy-to-clipboard', text),
  
  // Floating window controls
  minimizeFloatingTemplates: () => ipcRenderer.invoke('minimize-floating-templates'),
  toggleFloatingPin: (isPinned: boolean) => ipcRenderer.invoke('toggle-floating-pin', isPinned),
  moveFloatingWindow: (deltaX: number, deltaY: number) => ipcRenderer.invoke('move-floating-window', deltaX, deltaY),
  resizeFloatingWindow: (width: number, height: number) => ipcRenderer.invoke('resize-floating-window', width, height),

  getSettings: () => ipcRenderer.invoke('get-settings'),
  
  // Global shortcut management
  registerGlobalShortcuts: (templates: any[], settings?: any) => ipcRenderer.invoke('register-global-shortcuts', templates, settings),
  checkShortcutConflict: (shortcut: string, excludeTemplateId?: string) => ipcRenderer.invoke('check-shortcut-conflict', shortcut, excludeTemplateId),
  unregisterGlobalShortcuts: () => ipcRenderer.invoke('unregister-global-shortcuts'),
  
  // Listen for shortcut triggered events
  onShortcutTriggered: (callback: (data: { templateId: string, title: string, shortcut: string }) => void) => {
    ipcRenderer.on('shortcut-triggered', (_, data) => callback(data))
  },
  
  // Listen for template data in floating windows
onTemplateData: (callback: (template: any) => void) => {
  ipcRenderer.on('template-data', (_, template) => callback(template))
},

// Listen for templates data in floating templates window
onTemplatesData: (callback: (templates: any[]) => void) => {
  ipcRenderer.on('templates-data', (_, templates) => callback(templates))
},
  
  // Remove listeners
  removeAllListeners: (channel?: string) => {
    if (channel) {
      ipcRenderer.removeAllListeners(channel)
    } else {
      ipcRenderer.removeAllListeners()
    }
  }
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
