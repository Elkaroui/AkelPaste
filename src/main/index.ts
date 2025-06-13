import { app, BrowserWindow, ipcMain, globalShortcut, clipboard, dialog } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { exec } from 'child_process'

let mainWindow: BrowserWindow
let floatingWindow: BrowserWindow | null = null
let currentTemplates: any[] = []
const registeredShortcuts = new Map<string, string>()
const lastShortcutTime = new Map<string, number>()

function createWindow(): void {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1090,
    height: 670,
    icon: __dirname + '/../../resources/icon.png',
    show: false,
    
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
  })

  // Handle main window closing - ensure floating window is cleaned up
  mainWindow.on('closed', () => {
    if (floatingWindow && !floatingWindow.isDestroyed()) {
      floatingWindow.destroy()
      floatingWindow = null
    }
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    require('electron').shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

function createFloatingTemplatesWindow(): BrowserWindow {
  const floatingWindow = new BrowserWindow({
    width: 250, // Start with a more reasonable width
    height: 150, // Start with a more reasonable height
    alwaysOnTop: true,
    frame: false,
    transparent: true, // VERY IMPORTANT!
    backgroundColor: undefined, // Dark background to prevent black flashing
    resizable: false,
    useContentSize: true,
    skipTaskbar: false,
    thickFrame: false,
    hasShadow: false,
    title: '',
    fullscreenable: false, // Prevent fullscreen mode
    icon: __dirname + '/../../resources/icon.png',

    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      nodeIntegration: true,
      contextIsolation: true,
      sandbox: false,
    }
  });

  // Prevent F11 and other fullscreen attempts
  floatingWindow.on('enter-full-screen', () => {
    // Exit fullscreen immediately if somehow entered
    if (floatingWindow.isFullScreen()) {
      floatingWindow.setFullScreen(false);
    }
  });

  // Add a resize handler to ensure window doesn't exceed reasonable dimensions
  floatingWindow.on('resize', () => {
    const size = floatingWindow.getSize();
    const [width, height] = size;
    
    // If window somehow becomes too large, reset it to reasonable dimensions
    if (width > 500 || height > 500) {
      console.log('Floating window too large, resizing back to normal');
      // Resize back to a reasonable size
      floatingWindow.setSize(250, 150);
    }
  });

  // Load floating templates page
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    floatingWindow.loadURL(process.env['ELECTRON_RENDERER_URL'] + '/floating-templates.html')
  } else {
    floatingWindow.loadFile(join(__dirname, '../renderer/floating-templates.html'))
  }

  return floatingWindow
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.handle('ping', () => 'pong')

  // Dialog handlers
  ipcMain.handle('dialog:openDirectory', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openDirectory']
    })
    return result.filePaths[0] || null
  })

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

// IPC handlers
ipcMain.handle('get-templates', async () => {
  // This would typically fetch from a database or file
  // For now, return some sample templates
  return [
    {
      id: '1',
      title: 'Greeting',
      content: 'Hello! How can I help you today?',
      shortcut: 'Ctrl+Alt+1',
      category: 'General'
    },
    {
      id: '2',
      title: 'Thank You',
      content: 'Thank you for your message. I will get back to you soon.',
      shortcut: 'Ctrl+Alt+2',
      category: 'General'
    }
  ]
})

ipcMain.handle('save-template', async (_, template) => {
  // This would typically save to a database or file
  console.log('Saving template:', template)
  return { success: true }
})

ipcMain.handle('delete-template', async (_, templateId) => {
  // This would typically delete from a database or file
  console.log('Deleting template:', templateId)
  return { success: true }
})

ipcMain.handle('show-floating-templates', async () => {
  if (!floatingWindow) {
    floatingWindow = createFloatingTemplatesWindow()
    
    floatingWindow.on('closed', () => {
      floatingWindow = null
    })
  } else {
    floatingWindow.focus()
  }
  
  return { success: true }
})

ipcMain.handle('hide-floating-templates', async () => {
  if (floatingWindow) {
    floatingWindow.close()
    floatingWindow = null
  }
  
  return { success: true }
})

ipcMain.handle('create-floating-templates', async (_, templates) => {
  if (!floatingWindow) {
    floatingWindow = createFloatingTemplatesWindow()
    
    floatingWindow.on('closed', () => {
      floatingWindow = null
    })
    
    // Send templates data to the floating window once it's ready
    floatingWindow.webContents.once('did-finish-load', () => {
      if (floatingWindow && templates && templates.length > 0) {
        floatingWindow.webContents.send('templates-data', templates)
      }
    })
  } else {
    floatingWindow.focus()
    // Send updated templates data
    if (templates && templates.length > 0) {
      floatingWindow.webContents.send('templates-data', templates)
    }
  }
  
  return { success: true }
})

ipcMain.handle('close-floating-templates', async () => {
  if (floatingWindow) {
    floatingWindow.close()
    floatingWindow = null
  }
  
  return { success: true }
})

ipcMain.handle('is-floating-templates-open', async () => {
  return { isOpen: floatingWindow !== null && !floatingWindow.isDestroyed() }
})

ipcMain.handle('update-floating-templates', async (_, templates) => {
  if (floatingWindow && !floatingWindow.isDestroyed()) {
    // Send updated templates data to the floating window
    floatingWindow.webContents.send('templates-data', templates)
    return { success: true }
  } else {
    return { success: false, error: 'Floating window not found or destroyed' }
  }
})

// Handle request for templates data
ipcMain.handle('request-templates-data', () => {
  return currentTemplates || []
})

// Handle copy to clipboard
ipcMain.handle('copy-to-clipboard', async (_, text: string) => {
  const { clipboard } = require('electron')
  clipboard.writeText(text)
  return true
})

// Handle floating window resize
ipcMain.handle('resize-floating-window', async (_, width: number, height: number) => {
  if (floatingWindow && !floatingWindow.isDestroyed()) {
    try {
      floatingWindow.setSize(width, height)
      return { success: true }
    } catch (error) {
      console.error('Error resizing floating window:', error)
      return { success: false, error: error instanceof Error ? error.message : String(error) }
    }
  } else {
    return { success: false, error: 'Floating window not found or destroyed' }
  }
})

// Handle floating window reload
ipcMain.handle('reload-floating-templates', async () => {
  if (floatingWindow && !floatingWindow.isDestroyed()) {
    try {
      floatingWindow.webContents.reload()
      return { success: true }
    } catch (error) {
      console.error('Error reloading floating window:', error)
      return { success: false, error: error instanceof Error ? error.message : String(error) }
    }
  } else {
    return { success: false, error: 'Floating window not found or destroyed' }
  }
})

ipcMain.handle('register-global-shortcuts', async (_, templates, settings = {}) => {
    try {
      // Store templates for floating window access
      currentTemplates = templates || []
      
      // Notify floating window of updated templates
      if (floatingWindow && !floatingWindow.isDestroyed()) {
        floatingWindow.webContents.send('templates-data', currentTemplates)
      }
      
      // Clear existing shortcuts
      globalShortcut.unregisterAll()
      registeredShortcuts.clear()
    
    console.log('Registering global shortcuts for templates:', templates.length)
    console.log('Auto-paste enabled:', settings.autoPaste)
    
    for (const template of templates) {
      if (!template.shortcut) {
        continue
      }
      
      const shortcut = template.shortcut
      
      // Check if shortcut is already registered
      if (registeredShortcuts.has(shortcut)) {
        console.warn(`Shortcut ${shortcut} is already registered, skipping`)
        continue
      }
      
      // Validate shortcut format
      if (!shortcut.includes('+')) {
        console.warn(`Invalid shortcut format: ${shortcut}, skipping`)
        continue
      }
      
      const success = globalShortcut.register(shortcut, () => {
        const now = Date.now()
        const lastTime = lastShortcutTime.get(shortcut) || 0
        
        // Debounce: ignore if triggered within 300ms
        if (now - lastTime < 300) {
          return
        }
        lastShortcutTime.set(shortcut, now)
        
        console.log(`Global shortcut triggered: ${shortcut} for template: ${template.title}`)
        
        // Copy template content to clipboard
        clipboard.writeText(template.content)
        console.log(`Template content copied to clipboard: ${template.title}`)
        
        // Show notification that content is ready to paste
        if (mainWindow) {
          mainWindow.webContents.send('template-copied', {
            title: template.title,
            content: template.content
          })
        }
        
        // Auto-paste if enabled in settings
        if (settings.autoPaste) {
          setTimeout(() => {
            try {
              // Use node-key-sender for fast keyboard simulation
              const ks = require('node-key-sender')
              ks.sendCombination(['control', 'v'])
              console.log('Auto-paste successful with node-key-sender')
            } catch (error) {
              console.log('Auto-paste failed with node-key-sender, falling back to platform-specific methods:', error instanceof Error ? error.message : String(error))
              
              // Fallback to platform-specific methods if node-key-sender fails
              if (process.platform === 'win32') {
                // Use PowerShell as fallback for Windows
                const command = `powershell.exe -Command "Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.SendKeys]::SendWait('^v')"`
                exec(command, { timeout: 2000 }, (error, _stdout, _stderr) => {
                  if (error) {
                    console.log('Auto-paste fallback failed:', error.message)
                    console.log('Content is in clipboard for manual paste')
                  } else {
                    console.log('Auto-paste fallback successful')
                  }
                })
              } else if (process.platform === 'darwin') {
                // macOS
                exec('osascript -e "tell application \"System Events\" to keystroke \"v\" using command down"', 
                  { timeout: 2000 }, 
                  (error) => {
                    if (error) {
                      console.log('Auto-paste failed:', error.message)
                    } else {
                      console.log('Auto-paste successful')
                    }
                  }
                )
              } else {
                // Linux
                exec('xdotool key ctrl+v', 
                  { timeout: 2000 }, 
                  (error) => {
                    if (error) {
                      console.log('Auto-paste failed:', error.message)
                    } else {
                      console.log('Auto-paste successful')
                    }
                  }
                )
              }
            }
          }, 200)
        }
        
      })
      
      if (success) {
        registeredShortcuts.set(shortcut, template.id)
        console.log(`Successfully registered shortcut: ${shortcut}`)
      } else {
        console.error(`Failed to register shortcut: ${shortcut}`)
      }
    }
    
    return { success: true, registeredCount: registeredShortcuts.size }
  } catch (error) {
    console.error('Failed to register global shortcuts:', error)
    return { success: false, error: error instanceof Error ? error.message : String(error) }
  }
})

ipcMain.handle('unregister-global-shortcuts', async () => {
  try {
    globalShortcut.unregisterAll()
    registeredShortcuts.clear()
    console.log('All global shortcuts unregistered')
    return { success: true }
  } catch (error) {
    console.error('Failed to unregister global shortcuts:', error)
    return { success: false, error: error instanceof Error ? error.message : String(error) }
  }
})

ipcMain.handle('get-registered-shortcuts', async () => {
  return Array.from(registeredShortcuts.entries()).map(([shortcut, templateId]) => ({
    shortcut,
    templateId
  }))
})

// Handle window resizing for floating templates


// Handle app closing
app.on('before-quit', () => {
  globalShortcut.unregisterAll()
  // Force close floating window if it exists
  if (floatingWindow) {
    try {
      if (!floatingWindow.isDestroyed()) {
        floatingWindow.removeAllListeners()
        floatingWindow.destroy()
      }
    } catch (error) {
      console.log('Error destroying floating window:', error)
    } finally {
      floatingWindow = null
    }
  }
})

// Handle window closing
app.on('window-all-closed', () => {
  globalShortcut.unregisterAll()
  // Force close floating window if it exists
  if (floatingWindow) {
    try {
      if (!floatingWindow.isDestroyed()) {
        floatingWindow.removeAllListeners()
        floatingWindow.destroy()
      }
    } catch (error) {
      console.log('Error destroying floating window:', error)
    } finally {
      floatingWindow = null
    }
  }
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// Handle activate (macOS)
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})
