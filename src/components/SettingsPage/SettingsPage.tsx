import { useState, useEffect } from 'react'
import { AlignCenter, AlignLeft, AlignRight, Folder } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { toast } from 'sonner'
import { ThemeSelector } from './ThemeSelector'
import { DataManagement } from './DataManagement'
import { LanguageSelector, type Language } from './LanguageSelector'
import { useTranslation } from '@/utils/translations'

type Theme = 'system' | 'light' | 'dark'

interface SettingsPageProps {
  theme: Theme
  onThemeChange: (theme: Theme) => void
  pinTemplates: boolean
  onPinTemplatesChange: (enabled: boolean) => void
  language: Language
  onLanguageChange: (language: Language) => void
  emojiFolder?: string
  onEmojiFolderChange: (folder: string) => void
  showTemplateContent: boolean
  onShowTemplateContentChange: (show: boolean) => void
}

function SettingsPage({ theme, onThemeChange, pinTemplates, onPinTemplatesChange, language, onLanguageChange, emojiFolder: initialEmojiFolder, onEmojiFolderChange, showTemplateContent, onShowTemplateContentChange }: SettingsPageProps) {
  const [emojiFolder, setEmojiFolder] = useState(initialEmojiFolder || './src/assets/emoji')
  const [pinWindowSettings, setPinWindowSettings] = useState(() => {
    const saved = localStorage.getItem('pinWindowSettings')
    return saved ? JSON.parse(saved) : { showIcons: true, buttonPosition: 'center' }
  })
  const { t } = useTranslation(language)

  useEffect(() => {
    if (initialEmojiFolder) {
      setEmojiFolder(initialEmojiFolder)
    }
  }, [initialEmojiFolder])

  useEffect(() => {
    localStorage.setItem('pinWindowSettings', JSON.stringify(pinWindowSettings))
  }, [pinWindowSettings])

  const handleEmojiFolder = async () => {
    try {
      // Use Electron's dialog API to select folder
      const result = await window.electron.ipcRenderer.invoke('dialog:openDirectory')
      if (result && !result.canceled && result.filePaths.length > 0) {
        const newPath = result.filePaths[0]
        setEmojiFolder(newPath)
        onEmojiFolderChange(newPath)
        toast.success(t('emojiFolderUpdated'))
      }
    } catch (error) {
      console.error('Error selecting emoji folder:', error)
      toast.error('Failed to select emoji folder')
    }
  }

  const handleThemeChange = (newTheme: Theme) => {
    onThemeChange(newTheme)
    toast.success(`Theme changed to ${newTheme}`)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Settings Content */}
      <div className="flex-1 flex justify-center p-6">
        <div className="max-w-2xl w-full space-y-8">
          {/* Appearance Section */}
          <div className="space-y-4">

            <div className="space-y-4">
              <ThemeSelector 
                theme={theme} 
                onThemeChange={handleThemeChange}
                language={language} 
              />
              <LanguageSelector 
                language={language}
                onLanguageChange={onLanguageChange}
              />
            </div>
          </div>

          {/* Templates Section */}
          <div className="space-y-4">
            <div className="space-y-1">
              <h2 className="text-lg font-medium">{t('templatesSection')}</h2>
              <p className="text-sm text-muted-foreground">{t('templatesSectionDescription')}</p>
            </div>
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">{t('pinWindowSettings')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="pin-templates" className="text-sm font-normal">{t('enableFloatingTemplates')}</Label>
                      <p className="text-xs text-muted-foreground">
                        {t('pinnedTemplatesFloatingWindow')}
                      </p>
                    </div>
                    <Switch
                      id="pin-templates"
                      checked={pinTemplates}
                      onCheckedChange={onPinTemplatesChange}
                    />
                  </div>

                  {pinTemplates && (
                    <>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="show-button-icons" className="text-sm font-normal">{t('showButtonIcons')}</Label>
                        <Switch
                          id="show-button-icons"
                          checked={pinWindowSettings.showIcons}
                          onCheckedChange={(checked) => 
                            setPinWindowSettings(prev => ({ ...prev, showIcons: checked }))
                          }
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="button-position" className="text-sm font-normal">{t('buttonPosition')}</Label>
                        <ToggleGroup
                          id="button-position"
                          type="single"
                          value={pinWindowSettings.buttonPosition}
                          onValueChange={(value) => 
                            value && setPinWindowSettings(prev => ({ ...prev, buttonPosition: value }))
                          }
                          variant="outline"
                          size="sm"
                          className="rounded-md border"
                        >
                          <ToggleGroupItem value="left" aria-label={t('left')} title={t('left')}>
                            <AlignLeft className="h-4 w-4" />
                          </ToggleGroupItem>
                          <ToggleGroupItem value="center" aria-label={t('center')} title={t('center')}>
                            <AlignCenter className="h-4 w-4" />
                          </ToggleGroupItem>
                          <ToggleGroupItem value="right" aria-label={t('right')} title={t('right')}>
                            <AlignRight className="h-4 w-4" />
                          </ToggleGroupItem>
                        </ToggleGroup>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Template Display Settings - Compact */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">{t('templateDisplay')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="show-content" className="text-sm font-normal">{t('showTemplateContent')}</Label>
                    <Switch
                      id="show-content"
                      checked={showTemplateContent}
                      onCheckedChange={onShowTemplateContentChange}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Advanced Section */}
          <div className="space-y-4">
            <div className="space-y-1">
              <h2 className="text-lg font-medium">{t('advancedSection')}</h2>
              <p className="text-sm text-muted-foreground">{t('advancedSectionDescription')}</p>
            </div>
            <div className="space-y-4">
              {/* Emoji Folder Settings - Compact */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">{t('emojiIcons')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="emoji-folder" className="text-sm font-normal">{t('customEmojiFolder')}</Label>
                    <div className="flex gap-2">
                      <Input
                        id="emoji-folder"
                        placeholder={t('selectEmojiFolder')}
                        value={emojiFolder}
                        onChange={(e) => setEmojiFolder(e.target.value)}
                        readOnly
                        className="text-sm"
                      />
                      <Button variant="outline" size="sm" onClick={handleEmojiFolder}>
                        <Folder className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Data Management */}
              <DataManagement language={language} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SettingsPage
