import { useState, useEffect } from 'react'
import { SidebarProvider, SidebarTrigger, SidebarInset } from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbPage } from '@/components/ui/breadcrumb'
import { Button } from '@/components/ui/button'
import { Plus, X, Save } from 'lucide-react'

import { HomePage } from './components/HomePage'
import { TemplateEditor } from './components/TemplateEditor'
import { SettingsPage } from './components/SettingsPage'
import { AppSidebar } from './components/app-sidebar'
import { dataManager, type AppData, type Theme } from './utils/dataManager'
import type { Template } from './types/global'
import { Language, defaultLanguage, useTranslation } from './utils/translations'
import floatingWindowService from './services/floatingWindowService'

type Tab = 'home' | 'editor' | 'settings'

function App(): React.JSX.Element {
  const [templates, setTemplates] = useState<Template[]>([])
  const [activeTab, setActiveTab] = useState<Tab>('home')
  const [theme, setTheme] = useState<Theme>('light')
  const [pinTemplates, setPinTemplates] = useState(false)
  const [autoPaste, setAutoPaste] = useState(false)

  const [language, setLanguage] = useState<Language>(defaultLanguage)
  const [emojiFolder, setEmojiFolder] = useState('./src/assets/emoji')
  const [showTemplateContent, setShowTemplateContent] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null)

  const { t } = useTranslation(language)



  // Theme management
  useEffect(() => {
    const root = window.document.documentElement
    root.classList.remove('light', 'dark')

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      root.classList.add(systemTheme)
    } else {
      root.classList.add(theme)
    }
  }, [theme])

  // Load data on app start
  useEffect(() => {
    const data = dataManager.loadData()
    setTemplates(data.templates)
    setTheme(data.settings.theme)
      setPinTemplates(data.settings.pinTemplates)
      setAutoPaste(data.settings.autoPaste || false)
      setLanguage(data.settings.language || 'en')
      setEmojiFolder(data.settings.emojiFolder || './src/assets/emoji')
      setShowTemplateContent(data.settings.showTemplateContent !== false)
    
    // Floating window management is now handled by the useEffect hook with floatingWindowService
    // No need for direct calls here as the service will manage the window state
    
    // Global shortcuts are handled in the main process
    // No need for notifications in the renderer
    
    // Cleanup function to unregister shortcuts when app unmounts
    return () => {
      if (window.api?.unregisterGlobalShortcuts) {
        window.api.unregisterGlobalShortcuts()
      }
    }
  }, [])

  // Save data when state changes
  useEffect(() => {
    const data: Partial<AppData> = {
      templates,
      settings: {
        theme,
        pinTemplates,
        autoPaste,
        language,
        emojiFolder,
        showTemplateContent,
        autoSave: true
      }
    }
    dataManager.saveData(data)
    
    // Register global shortcuts when templates change
    if (window.api?.registerGlobalShortcuts) {
      console.log('Registering global shortcuts for', templates.length, 'templates')
      const settings = { autoPaste, pinTemplates, theme }
      console.log('Settings being passed:', settings)
      window.api.registerGlobalShortcuts(templates, settings)
        .then((result) => {
          console.log('Global shortcuts registration result:', result)
          if (result.success) {
            console.log(`Successfully registered ${result.registeredCount} shortcuts`)
          } else {
            console.error('Failed to register global shortcuts:', result.error)
          }
        })
        .catch((error) => {
          console.error('Error registering global shortcuts:', error)
        })
    }
  }, [templates, theme, pinTemplates, autoPaste, language, emojiFolder, showTemplateContent])

  // Manage floating templates window when pin setting or templates change
  useEffect(() => {
    floatingWindowService.manageWindow(templates, pinTemplates)
  }, [pinTemplates, templates])



  const addTemplate = async (template: Omit<Template, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newTemplate: Template = {
      ...template,
      id: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date()
    }
    setTemplates(prev => [...prev, newTemplate])
    // Floating window will be updated by useEffect when templates change
  }

  const updateTemplate = async (id: string, updates: Partial<Template>) => {
    const updatedTemplates = templates.map(t => {
      if (t.id === id) {
        return { ...t, ...updates, updatedAt: new Date() }
      }
      return t
    })
    
    setTemplates(updatedTemplates)
    // Floating window will be updated by useEffect when templates change
  }

  const reorderTemplates = async (reorderedTemplates: Template[]) => {
    setTemplates(reorderedTemplates)
    // Floating window will be updated by useEffect when templates change
  }

  const deleteTemplate = async (id: string) => {
    setTemplates(prev => prev.filter(t => t.id !== id))
    // Floating window will be updated by useEffect when templates change
  }

  const filteredTemplates = templates.filter(template =>
    template.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    template.content.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Handler functions
  const handleEditTemplate = (template: Template) => {
    setEditingTemplate(template)
    setActiveTab('editor')
  }

  const handleDeleteTemplate = (id: string) => {
    deleteTemplate(id)
  }

  const handleNewTemplate = () => {
    setEditingTemplate(null)
    setActiveTab('editor')
  }

  const handleSaveTemplate = (template: Omit<Template, 'id' | 'createdAt'>) => {
    if (editingTemplate) {
      updateTemplate(editingTemplate.id, template)
    } else {
      addTemplate(template)
    }
    setActiveTab('home')
    setEditingTemplate(null)
  }

  const handleCancelEdit = () => {
    setActiveTab('home')
    setEditingTemplate(null)
  }



  return (
    <SidebarProvider defaultOpen={false}>
      <AppSidebar 
        activeTab={activeTab}
        onTabChange={setActiveTab}
        language={language}
      />


      <SidebarInset className='flex flex-col h-auto'>
          <header className="flex h-16 shrink-0 items-center gap-2 border-b">
            <div className="flex items-center gap-2 px-4">
              <SidebarTrigger className="-ml-1" />
              <Separator 
                orientation="vertical" 
                className="mr-2 data-[orientation=vertical]:h-4" 
              />
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbPage className="line-clamp-1">
                      {activeTab === 'home' ? t('templates') : activeTab === 'editor' ? (editingTemplate ? t('editTemplate') : t('newTemplate')) : t('settings')}
                    </BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
            <div className="flex items-center gap-2 px-4 ml-auto">
              {activeTab === 'home' && (
                <Button onClick={handleNewTemplate} className="gap-2">
                  <Plus size={16} />
                  {t('newTemplate')}
                </Button>
              )}
              {activeTab === 'editor' && (
                <>
                  <Button variant="outline" onClick={handleCancelEdit} className="gap-2">
                    <X size={16} />
                    {t('cancel')}
                  </Button>
                  <Button onClick={() => {
                    const saveEvent = new CustomEvent('templateSave')
                    window.dispatchEvent(saveEvent)
                  }} className="gap-2">
                    <Save size={16} />
                    {t('save')}
                  </Button>
                </>
              )}
            </div>
          </header>
        
          <div className="flex flex-col items-stretch gap-4 pt-0">
            {activeTab === 'home' && (
              <HomePage
                templates={filteredTemplates}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                onEditTemplate={handleEditTemplate}
                onDeleteTemplate={handleDeleteTemplate}
                onNewTemplate={handleNewTemplate}
                onReorderTemplates={reorderTemplates}
                language={language}
                showTemplateContent={showTemplateContent}
              />
            )}
            
            {activeTab === 'editor' && (
              <TemplateEditor
                template={editingTemplate}
                onSave={handleSaveTemplate}
                language={language}
                emojiFolder={emojiFolder}
                existingShortcuts={templates
                  .filter(t => t.id !== editingTemplate?.id && t.shortcut)
                  .map(t => t.shortcut!)}
              />
            )}
            
            {activeTab === 'settings' && (
              <SettingsPage
                theme={theme}
                onThemeChange={setTheme}
                pinTemplates={pinTemplates}
                onPinTemplatesChange={setPinTemplates}
                autoPaste={autoPaste}
                onAutoPasteChange={setAutoPaste}
                language={language}
                onLanguageChange={setLanguage}
                emojiFolder={emojiFolder}
                onEmojiFolderChange={(newEmojiFolder: string) => {
                  setEmojiFolder(newEmojiFolder)
                  dataManager.saveData({
                    settings: {
                      theme,
                      pinTemplates,
                      autoPaste,
                      language,
                      emojiFolder: newEmojiFolder,
                      showTemplateContent,
                      autoSave: true
                    }
                  })
                }}
                showTemplateContent={showTemplateContent}
                onShowTemplateContentChange={setShowTemplateContent}
              />
            )}
          </div>
      </SidebarInset>

    </SidebarProvider>
  )
}

export default App