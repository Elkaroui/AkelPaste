import { useEffect, useState } from 'react'
import { SidebarProvider, SidebarTrigger, SidebarInset } from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbPage } from '@/components/ui/breadcrumb'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Search, X, Save } from 'lucide-react'

import { HomePage } from './components/HomePage'
import { TemplateEditor } from './components/TemplateEditor'
import { SettingsPage } from './components/SettingsPage'
import { AppSidebar } from './components/app-sidebar'
import { dataManager, type AppData, type Theme } from './utils/dataManager'
import type { Template } from './types/global'
import { Language, defaultLanguage, useTranslation } from './utils/translations'
import floatingWindowService from './services/floatingWindowService'

type Tab = 'home' | 'editor' | 'settings'
type CollectionFilter = 'all' | string
type CollectionCreateResult = { status: 'created' | 'existing' | 'empty'; name?: string }
type CollectionRenameResult = {
  status: 'renamed' | 'existing' | 'empty' | 'unchanged'
  name?: string
}

function normalizeCollectionName(value: string): string {
  return value.trim().replace(/\s+/g, ' ')
}

function appendCollectionIfMissing(previousCollections: string[], nextCollection: string): string[] {
  if (
    previousCollections.some(
      (collection) => collection.toLowerCase() === nextCollection.toLowerCase()
    )
  ) {
    return previousCollections
  }

  return [...previousCollections, nextCollection]
}

function App(): React.JSX.Element {
  const [templates, setTemplates] = useState<Template[]>([])
  const [collections, setCollections] = useState<string[]>([])
  const [activeCollection, setActiveCollection] = useState<CollectionFilter>('all')
  const [activeTab, setActiveTab] = useState<Tab>('home')
  const [theme, setTheme] = useState<Theme>('light')
  const [pinTemplates, setPinTemplates] = useState(false)
  const [language, setLanguage] = useState<Language>(defaultLanguage)
  const [emojiFolder, setEmojiFolder] = useState('./src/assets/emoji')
  const [showTemplateContent, setShowTemplateContent] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null)

  const { t } = useTranslation(language)

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

  useEffect(() => {
    const data = dataManager.loadData()
    setTemplates(data.templates)
    setCollections(data.collections ?? [])
    setTheme(data.settings.theme)
    setPinTemplates(data.settings.pinTemplates)
    setLanguage(data.settings.language || 'en')
    setEmojiFolder(data.settings.emojiFolder || './src/assets/emoji')
    setShowTemplateContent(data.settings.showTemplateContent !== false)

    return () => {
      if (window.api?.unregisterGlobalShortcuts) {
        window.api.unregisterGlobalShortcuts()
      }
    }
  }, [])

  useEffect(() => {
    const data: Partial<AppData> = {
      templates,
      collections,
      settings: {
        theme,
        pinTemplates,
        language,
        emojiFolder,
        showTemplateContent,
        autoSave: true
      }
    }

    dataManager.saveData(data)

    if (window.api?.registerGlobalShortcuts) {
      const settings = { pinTemplates, theme }
      window.api.registerGlobalShortcuts(templates, settings).catch((error) => {
        console.error('Error registering global shortcuts:', error)
      })
    }
  }, [templates, collections, theme, pinTemplates, language, emojiFolder, showTemplateContent])

  useEffect(() => {
    floatingWindowService.manageWindow(templates, pinTemplates)
  }, [pinTemplates, templates])

  useEffect(() => {
    if (
      activeCollection !== 'all' &&
      !collections.some((collection) => collection.toLowerCase() === activeCollection.toLowerCase())
    ) {
      setActiveCollection('all')
    }
  }, [activeCollection, collections])

  const findExistingCollection = (name: string) => {
    const normalized = normalizeCollectionName(name)
    if (!normalized) {
      return null
    }

    return (
      collections.find((collection) => collection.toLowerCase() === normalized.toLowerCase()) ?? null
    )
  }

  const createCollection = (name: string): CollectionCreateResult => {
    const normalized = normalizeCollectionName(name)
    if (!normalized) {
      return { status: 'empty' }
    }

    const existing = findExistingCollection(normalized)
    if (existing) {
      return { status: 'existing', name: existing }
    }

    setCollections((prev) => appendCollectionIfMissing(prev, normalized))
    return { status: 'created', name: normalized }
  }

  const renameCollection = (currentName: string, nextName: string): CollectionRenameResult => {
    const normalized = normalizeCollectionName(nextName)
    if (!normalized) {
      return { status: 'empty' }
    }

    if (currentName.toLowerCase() === normalized.toLowerCase()) {
      if (currentName !== normalized) {
        setCollections((prev) =>
          prev.map((collection) =>
            collection.toLowerCase() === currentName.toLowerCase() ? normalized : collection
          )
        )
        setTemplates((prev) =>
          prev.map((template) =>
            template.collection?.toLowerCase() === currentName.toLowerCase()
              ? { ...template, collection: normalized, updatedAt: new Date() }
              : template
          )
        )
        if (activeCollection !== 'all' && activeCollection.toLowerCase() === currentName.toLowerCase()) {
          setActiveCollection(normalized)
        }
        return { status: 'renamed', name: normalized }
      }

      return { status: 'unchanged', name: currentName }
    }

    const existing = findExistingCollection(normalized)
    if (existing) {
      return { status: 'existing', name: existing }
    }

    setCollections((prev) =>
      prev.map((collection) =>
        collection.toLowerCase() === currentName.toLowerCase() ? normalized : collection
      )
    )
    setTemplates((prev) =>
      prev.map((template) =>
        template.collection?.toLowerCase() === currentName.toLowerCase()
          ? { ...template, collection: normalized, updatedAt: new Date() }
          : template
      )
    )

    if (activeCollection !== 'all' && activeCollection.toLowerCase() === currentName.toLowerCase()) {
      setActiveCollection(normalized)
    }

    return { status: 'renamed', name: normalized }
  }

  const deleteCollection = (name: string) => {
    setCollections((prev) =>
      prev.filter((collection) => collection.toLowerCase() !== name.toLowerCase())
    )
    setTemplates((prev) =>
      prev.map((template) =>
        template.collection?.toLowerCase() === name.toLowerCase()
          ? { ...template, collection: undefined, updatedAt: new Date() }
          : template
      )
    )

    if (activeCollection !== 'all' && activeCollection.toLowerCase() === name.toLowerCase()) {
      setActiveCollection('all')
    }
  }

  const addTemplate = async (template: Omit<Template, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newTemplate: Template = {
      ...template,
      collection: template.collection || undefined,
      id: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date()
    }

    setTemplates((prev) => [...prev, newTemplate])
    if (newTemplate.collection && !findExistingCollection(newTemplate.collection)) {
      setCollections((prev) => appendCollectionIfMissing(prev, newTemplate.collection!))
    }
  }

  const updateTemplate = async (id: string, updates: Partial<Template>) => {
    const normalizedCollection = updates.collection ? normalizeCollectionName(updates.collection) : undefined

    setTemplates((prev) =>
      prev.map((template) => {
        if (template.id !== id) {
          return template
        }

        return {
          ...template,
          ...updates,
          collection: normalizedCollection,
          updatedAt: new Date()
        }
      })
    )

    if (normalizedCollection && !findExistingCollection(normalizedCollection)) {
      setCollections((prev) => appendCollectionIfMissing(prev, normalizedCollection))
    }
  }

  const reorderTemplates = async (reorderedTemplates: Template[]) => {
    setTemplates(reorderedTemplates)
  }

  const deleteTemplate = async (id: string) => {
    setTemplates((prev) => prev.filter((template) => template.id !== id))
  }

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

  const handleSaveTemplate = (template: Omit<Template, 'id' | 'createdAt' | 'updatedAt'>) => {
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
      <AppSidebar activeTab={activeTab} onTabChange={setActiveTab} language={language} />

      <SidebarInset className="flex flex-col h-auto">
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
                    {activeTab === 'home'
                      ? t('templates')
                      : activeTab === 'editor'
                        ? editingTemplate
                          ? t('editTemplate')
                          : t('newTemplate')
                        : t('settings')}
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <div className="flex items-center gap-2 px-4 ml-auto">
            {activeTab === 'home' && (
              <>
                <div className="relative hidden md:block">
                  <Search
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    size={14}
                  />
                  <Input
                    placeholder={t('searchTemplates')}
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    className="h-9 w-[220px] pl-9"
                  />
                </div>
                <Button onClick={handleNewTemplate} className="gap-2">
                  <Plus size={16} />
                  {t('newTemplate')}
                </Button>
              </>
            )}
            {activeTab === 'editor' && (
              <>
                <Button variant="outline" onClick={handleCancelEdit} className="gap-2">
                  <X size={16} />
                  {t('cancel')}
                </Button>
                <Button
                  onClick={() => {
                    const saveEvent = new CustomEvent('templateSave')
                    window.dispatchEvent(saveEvent)
                  }}
                  className="gap-2"
                >
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
              templates={templates}
              collections={collections}
              activeCollection={activeCollection}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onCollectionChange={setActiveCollection}
              onCreateCollection={createCollection}
              onRenameCollection={renameCollection}
              onDeleteCollection={deleteCollection}
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
              onCreateCollection={createCollection}
              collections={collections}
              language={language}
              emojiFolder={emojiFolder}
              existingShortcuts={templates
                .filter((template) => template.id !== editingTemplate?.id && template.shortcut)
                .map((template) => template.shortcut!)}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsPage
              theme={theme}
              onThemeChange={setTheme}
              pinTemplates={pinTemplates}
              onPinTemplatesChange={setPinTemplates}
              language={language}
              onLanguageChange={setLanguage}
              emojiFolder={emojiFolder}
              onEmojiFolderChange={(newEmojiFolder: string) => {
                setEmojiFolder(newEmojiFolder)
                dataManager.saveData({
                  collections,
                  settings: {
                    theme,
                    pinTemplates,
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
