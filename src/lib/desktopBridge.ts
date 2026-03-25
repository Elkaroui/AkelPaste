import { WebviewWindow } from '@tauri-apps/api/webviewWindow'
import { listen } from '@tauri-apps/api/event'
import { getCurrentWindow, LogicalSize } from '@tauri-apps/api/window'
import { invoke } from '@tauri-apps/api/core'
import { open } from '@tauri-apps/plugin-dialog'
import { writeText } from '@tauri-apps/plugin-clipboard-manager'
import { isRegistered } from '@tauri-apps/plugin-global-shortcut'

import type { DesktopApi, Template } from '@/types/global'

const FLOATING_WINDOW_LABEL = 'floating-templates'
const PINNED_TEMPLATES_KEY = 'akel-pinned-templates'
const FLOATING_WINDOW_MANUAL_SIZE_KEY = 'akel-floating-window-manual-size'
const TEMPLATE_SHORTCUT_TRIGGERED_EVENT = 'template-shortcut-triggered'
const TEMPLATE_SHORTCUT_DEBUG_EVENT = 'template-shortcut-debug'
const listenerRegistry = new Map<string, Array<() => void>>()
let shortcutRegistrationGeneration = 0
let shortcutRegistrationQueue: Promise<unknown> = Promise.resolve()

type ShortcutTemplate = Pick<Template, 'id' | 'title' | 'content' | 'shortcut'>
type NativeShortcutRegistration = {
  templateId: string
  title: string
  content: string
  shortcut: string
}

function storePinnedTemplates(templates: Template[]): void {
  localStorage.setItem(PINNED_TEMPLATES_KEY, JSON.stringify(templates))
}

function loadPinnedTemplates(): Template[] {
  const raw = localStorage.getItem(PINNED_TEMPLATES_KEY)
  if (!raw) return []

  try {
    return JSON.parse(raw)
  } catch (error) {
    console.error('Failed to parse pinned templates:', error)
    return []
  }
}

function loadFloatingManualSize(): { width: number; height: number } | null {
  const raw = localStorage.getItem(FLOATING_WINDOW_MANUAL_SIZE_KEY)
  if (!raw) return null

  try {
    return JSON.parse(raw)
  } catch (error) {
    console.error('Failed to parse floating window size:', error)
    return null
  }
}

function normalizeShortcut(shortcut: string): string {
  return shortcut
    .split('+')
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      switch (part.toLowerCase()) {
        case 'ctrl':
        case 'control':
          return 'CommandOrControl'
        case 'meta':
        case 'cmd':
        case 'command':
          return 'Super'
        default:
          return part.length === 1 ? part.toUpperCase() : part
      }
    })
    .join('+')
}

async function getFloatingWindow(): Promise<WebviewWindow | null> {
  return WebviewWindow.getByLabel(FLOATING_WINDOW_LABEL)
}

async function emitTemplatesData(templates: Template[]): Promise<void> {
  const floatingWindow = await getFloatingWindow()
  if (!floatingWindow) return

  await floatingWindow.emit('templates-data', templates)
}

async function ensureFloatingWindow(templates: Template[]): Promise<WebviewWindow> {
  storePinnedTemplates(templates)
  const manualSize = loadFloatingManualSize()

  const existingWindow = await getFloatingWindow()
  if (existingWindow) {
    await existingWindow.setResizable(true)
    await existingWindow.show()
    await existingWindow.setFocus()
    await emitTemplatesData(templates)
    return existingWindow
  }

  const floatingWindow = new WebviewWindow(FLOATING_WINDOW_LABEL, {
    url: '/?window=floating-templates',
    title: '',
    width: manualSize?.width ?? 250,
    height: manualSize?.height ?? 150,
    transparent: true,
    decorations: false,
    alwaysOnTop: true,
    shadow: false,
    skipTaskbar: false,
    resizable: true,
    maximizable: false,
    minimizable: false,
    closable: true,
    visible: true,
    focus: true
  })

  floatingWindow.once('tauri://created', async () => {
    await floatingWindow.setResizable(true)
    await floatingWindow.show()
    await floatingWindow.setFocus()
    await emitTemplatesData(templates)
  })

  return floatingWindow
}

async function selectDirectory() {
  const selected = await open({
    directory: true,
    multiple: false,
    title: 'Select emoji folder'
  })

  if (typeof selected === 'string') {
    return {
      canceled: false,
      filePaths: [selected]
    }
  }

  return {
    canceled: true,
    filePaths: []
  }
}

const desktopApi: DesktopApi = {
  async createFloatingWindow() {
    return { success: false, error: 'Single floating template windows are not used in the Tauri version.' }
  },
  async closeFloatingWindow() {},
  async closeAllFloatingWindows() {
    const floatingWindow = await getFloatingWindow()
    if (floatingWindow) {
      await floatingWindow.close()
    }
  },
  async reloadFloatingTemplates() {
    await emitTemplatesData(loadPinnedTemplates())
    return { success: true }
  },
  async createFloatingTemplates(templates) {
    try {
      await ensureFloatingWindow(templates)
      return { success: true }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) }
    }
  },
  async closeFloatingTemplates() {
    try {
      const floatingWindow = await getFloatingWindow()
      if (floatingWindow) {
        await floatingWindow.close()
      }
      return { success: true }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) }
    }
  },
  async updateFloatingTemplates(templates) {
    try {
      storePinnedTemplates(templates)
      await emitTemplatesData(templates)
      return { success: true }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) }
    }
  },
  async isFloatingTemplatesOpen() {
    const floatingWindow = await getFloatingWindow()
    return { isOpen: floatingWindow !== null }
  },
  async resizeFloatingWindow(width, height) {
    try {
      await getCurrentWindow().setSize(new LogicalSize(width, height))
      return { success: true }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) }
    }
  },
  async requestTemplatesData() {
    return loadPinnedTemplates()
  },
  async copyToClipboard(text) {
    await writeText(text)
  },
  async registerGlobalShortcuts(templates) {
    const generation = ++shortcutRegistrationGeneration

    const runRegistration = async () => {
      const seenShortcuts = new Set<string>()
      const registrations: NativeShortcutRegistration[] = []

      for (const template of templates) {
        if (!template.shortcut) continue

        const normalizedShortcut = normalizeShortcut(template.shortcut)
        if (!normalizedShortcut || seenShortcuts.has(normalizedShortcut)) continue

        seenShortcuts.add(normalizedShortcut)

        if (generation !== shortcutRegistrationGeneration) {
          return { success: true, registeredCount: 0, skipped: true }
        }

        registrations.push({
          templateId: template.id,
          title: template.title,
          content: template.content,
          shortcut: normalizedShortcut
        })
      }

      const result = await invoke<{
        success: boolean
        registeredCount: number
        failedShortcuts?: Array<{ shortcut: string; error: string }>
      }>('sync_template_shortcuts', {
        shortcuts: registrations
      })

      if (result.failedShortcuts?.length) {
        console.warn('Some global shortcuts could not be registered:', result.failedShortcuts)
      }

      console.debug('Global shortcut registration result:', result)

      return result
    }

    const queuedRegistration = shortcutRegistrationQueue
      .catch(() => undefined)
      .then(runRegistration)

    shortcutRegistrationQueue = queuedRegistration
    return queuedRegistration
  },
  async unregisterGlobalShortcuts() {
    await invoke('clear_template_shortcuts')
  },
  async checkShortcutConflict(shortcut) {
    return isRegistered(normalizeShortcut(shortcut))
  },
  onShortcutTriggered(callback) {
    listen<{
      templateId: string
      title: string
      shortcut: string
    }>(TEMPLATE_SHORTCUT_TRIGGERED_EVENT, (event) => callback(event.payload))
      .then((unlisten) => {
        const listeners = listenerRegistry.get(TEMPLATE_SHORTCUT_TRIGGERED_EVENT) ?? []
        listeners.push(unlisten)
        listenerRegistry.set(TEMPLATE_SHORTCUT_TRIGGERED_EVENT, listeners)
      })
      .catch((error) => {
        console.error('Failed to listen for template-shortcut-triggered:', error)
      })
  },
  onTemplateData() {},
  onTemplatesData(callback) {
    getCurrentWindow()
      .listen<Template[]>('templates-data', (event) => callback(event.payload))
      .then((unlisten) => {
        const listeners = listenerRegistry.get('templates-data') ?? []
        listeners.push(unlisten)
        listenerRegistry.set('templates-data', listeners)
      })
      .catch((error) => {
        console.error('Failed to listen for templates-data:', error)
      })
  },
  removeAllListeners(channel) {
    if (!channel) {
      listenerRegistry.forEach((listeners) => listeners.forEach((unlisten) => unlisten()))
      listenerRegistry.clear()
      return
    }

    const listeners = listenerRegistry.get(channel) ?? []
    listeners.forEach((unlisten) => unlisten())
    listenerRegistry.delete(channel)
  }
}

export async function installDesktopBridge(): Promise<void> {
  if (window.api) return

  listen<{
    templateId: string
    title: string
    shortcut: string
  }>(TEMPLATE_SHORTCUT_TRIGGERED_EVENT, (event) => {
    console.debug('Template shortcut triggered:', event.payload)
  })
    .then((unlisten) => {
      const listeners = listenerRegistry.get(TEMPLATE_SHORTCUT_TRIGGERED_EVENT) ?? []
      listeners.push(unlisten)
      listenerRegistry.set(TEMPLATE_SHORTCUT_TRIGGERED_EVENT, listeners)
    })
    .catch((error) => {
      console.error('Failed to attach template shortcut debug listener:', error)
    })

  listen<{
    templateId: string
    shortcut: string
    stage: string
    message?: string | null
  }>(TEMPLATE_SHORTCUT_DEBUG_EVENT, (event) => {
    console.debug('Template shortcut debug:', event.payload)
  })
    .then((unlisten) => {
      const listeners = listenerRegistry.get(TEMPLATE_SHORTCUT_DEBUG_EVENT) ?? []
      listeners.push(unlisten)
      listenerRegistry.set(TEMPLATE_SHORTCUT_DEBUG_EVENT, listeners)
    })
    .catch((error) => {
      console.error('Failed to attach template shortcut debug listener:', error)
    })

  window.api = desktopApi
  window.electron = {
    ipcRenderer: {
      invoke: async (channel: string) => {
        if (channel === 'dialog:openDirectory') {
          return selectDirectory()
        }

        throw new Error(`Unsupported electron channel in Tauri bridge: ${channel}`)
      }
    },
    process: {
      versions: {
        tauri: '2',
        webview: navigator.userAgent,
        chromium: navigator.userAgent
      }
    }
  }
}

export function isFloatingTemplatesWindow(): boolean {
  const params = new URLSearchParams(window.location.search)
  return params.get('window') === FLOATING_WINDOW_LABEL
}
