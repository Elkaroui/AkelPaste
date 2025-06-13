import { useState, useEffect, useRef } from 'react'
// Icons removed as buttons moved to App.tsx header
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent } from '@/components/ui/card'
import { toast } from 'sonner'
import { EmojiPicker } from './EmojiPicker'
import { EmojiRenderer } from '@/components/ui/EmojiRenderer'
import { ShortcutRecorder } from './ShortcutRecorder'
import { useTranslation, type Language } from '@/utils/translations'
import type { Template } from '../../types/global'

interface TemplateEditorProps {
  template: Template | null
  onSave: (template: Omit<Template, 'id' | 'createdAt'>) => void
  language: Language
  emojiFolder?: string
  existingShortcuts?: string[]
}

function TemplateEditor({ template, onSave, language, emojiFolder, existingShortcuts = [] }: TemplateEditorProps) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [icon, setIcon] = useState('')
  const [shortcut, setShortcut] = useState('')
  const [pinned, setPinned] = useState(false)
  const titleInputRef = useRef<HTMLInputElement>(null)
  const { t } = useTranslation(language)

  useEffect(() => {
    console.log('TemplateEditor: Loading template data', template)
    if (template) {
      setTitle(template.title)
      setContent(template.content)
      setIcon(template.icon || '')
      setShortcut(template.shortcut || '')
      setPinned(template.pinned)
      console.log('TemplateEditor: Template data loaded', {
        title: template.title,
        content: template.content,
        icon: template.icon,
        shortcut: template.shortcut,
        pinned: template.pinned
      })
    } else {
      setTitle('')
      setContent('')
      setIcon('')
      setShortcut('')
      setPinned(false)
      console.log('TemplateEditor: Creating new template, fields cleared')
    }
  }, [template])

  useEffect(() => {
    // Focus title input when component mounts
    if (titleInputRef.current) {
      titleInputRef.current.focus()
    }
  }, [])

  const handleSave = () => {
    console.log('TemplateEditor: Save button clicked')
    console.log('TemplateEditor: Current form data', {
      title,
      content,
      icon,
      shortcut,
      pinned
    })

    if (!title.trim() || !content.trim()) {
      console.log('TemplateEditor: Save failed - missing title or content')
      toast.error(t('titleAndContentRequired'))
      return
    }

    const templateData = {
      title: title.trim(),
      content: content.trim(),
      icon: icon.trim() || '📝',
      shortcut: shortcut.trim(),
      pinned,
      updatedAt: new Date()
    }

    console.log('TemplateEditor: Calling onSave with data', templateData)
    onSave(templateData)
  }

  useEffect(() => {
    const handleSaveEvent = () => {
      handleSave()
    }

    window.addEventListener('templateSave', handleSaveEvent)
    return () => {
      window.removeEventListener('templateSave', handleSaveEvent)
    }
  }, [handleSave])



  const handleEmojiSelect = (emoji: string) => {
    console.log('TemplateEditor: Emoji selected:', emoji)
    setIcon(emoji)
  }

  const handleShortcutChange = (newShortcut: string) => {
    console.log('TemplateEditor: Shortcut changed to:', newShortcut)
    setShortcut(newShortcut)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-6 border-b border-border bg-background">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">
            {template ? t('editTemplate') : t('newTemplate')}
          </h2>
        </div>
      </div>

      {/* Form */}
      <div className="flex-1 flex justify-center p-6">
        <div className="max-w-2xl w-full space-y-6">
          <Card>
            <CardContent className="p-6 space-y-6">
              {/* Title and Icon */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-3 space-y-2">
                  <Label htmlFor="title">{t('title')} *</Label>
                  <Input
                      ref={titleInputRef}
                      id="title"
                      placeholder={t('enterTemplateTitle')}
                      value={title}
                      onChange={(e) => {
                        console.log('TemplateEditor: Title changed to:', e.target.value)
                        setTitle(e.target.value)
                      }}
                    />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="icon">{t('icon')}</Label>
                  <div className="flex gap-2">
                    <div className="relative">
                      <Input
                        id="icon"
                        placeholder=""
                        value={icon.startsWith('custom:') ? '' : icon}
                        onChange={(e) => setIcon(e.target.value)}
                        className={`text-center pr-10 ${icon ? 'text-transparent' : ''}`}
                        maxLength={2}
                      />
                      {icon && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <EmojiRenderer emoji={icon} size={20} />
                        </div>
                      )}
                    </div>
                    <EmojiPicker onEmojiSelect={handleEmojiSelect} emojiFolder={emojiFolder} />
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="space-y-2">
                <Label htmlFor="content">{t('content')} *</Label>
                <Textarea
                  id="content"
                  placeholder={t('enterTemplateContent')}
                  value={content}
                  onChange={(e) => {
                    console.log('TemplateEditor: Content changed, length:', e.target.value.length)
                    setContent(e.target.value)
                  }}
                  className="min-h-[200px] resize-none"
                />
                <p className="text-sm text-muted-foreground">
                  {content.length} characters
                </p>
              </div>

              {/* Keyboard Shortcut */}
              <div className="space-y-2">
                <Label htmlFor="shortcut">{t('keyboardShortcut')}</Label>
                <ShortcutRecorder
                  value={shortcut}
                  onChange={handleShortcutChange}
                  existingShortcuts={existingShortcuts}
                  language={language}
                />
              </div>

              {/* Pin Template */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="pinned">{t('pinTemplate')}</Label>
                  <p className="text-sm text-muted-foreground">
                    {t('pinnedTemplateDescription')}
                  </p>
                </div>
                <Switch
                  id="pinned"
                  checked={pinned}
                  onCheckedChange={(checked) => {
                    console.log('TemplateEditor: Pinned status changed to:', checked)
                    setPinned(checked)
                  }}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default TemplateEditor