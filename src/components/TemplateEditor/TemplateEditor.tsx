import { useEffect, useRef, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { EmojiPicker } from './EmojiPicker'
import { EmojiRenderer } from '@/components/ui/EmojiRenderer'
import { ShortcutRecorder } from './ShortcutRecorder'
import { useTranslation, type Language } from '@/utils/translations'
import type { Template } from '../../types/global'

const NO_COLLECTION_VALUE = '__none__'

type CollectionCreateResult = { status: 'created' | 'existing' | 'empty'; name?: string }

interface TemplateEditorProps {
  template: Template | null
  onSave: (template: Omit<Template, 'id' | 'createdAt' | 'updatedAt'>) => void
  onCreateCollection: (name: string) => CollectionCreateResult
  collections: string[]
  language: Language
  emojiFolder?: string
  existingShortcuts?: string[]
}

function TemplateEditor({
  template,
  onSave,
  onCreateCollection,
  collections,
  language,
  emojiFolder,
  existingShortcuts = []
}: TemplateEditorProps) {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [icon, setIcon] = useState('')
  const [collection, setCollection] = useState('')
  const [newCollectionName, setNewCollectionName] = useState('')
  const [shortcut, setShortcut] = useState('')
  const [pinned, setPinned] = useState(false)
  const titleInputRef = useRef<HTMLInputElement>(null)
  const { t } = useTranslation(language)

  useEffect(() => {
    if (template) {
      setTitle(template.title)
      setContent(template.content)
      setIcon(template.icon || '')
      setCollection(template.collection || '')
      setShortcut(template.shortcut || '')
      setPinned(template.pinned)
    } else {
      setTitle('')
      setContent('')
      setIcon('')
      setCollection('')
      setNewCollectionName('')
      setShortcut('')
      setPinned(false)
    }
  }, [template])

  useEffect(() => {
    if (titleInputRef.current) {
      titleInputRef.current.focus()
    }
  }, [])

  const handleCreateCollection = () => {
    const result = onCreateCollection(newCollectionName)

    if (result.status === 'empty') {
      toast.error(t('collectionNameRequired'))
      return
    }

    if (result.name) {
      setCollection(result.name)
      setNewCollectionName('')
    }

    if (result.status === 'created') {
      toast.success(t('collectionCreated'))
    } else if (result.status === 'existing') {
      toast.success(t('existingCollectionSelected'))
    }
  }

  const handleSave = () => {
    if (!title.trim() || !content.trim()) {
      toast.error(t('titleAndContentRequired'))
      return
    }

    onSave({
      title: title.trim(),
      content: content.trim(),
      icon: icon.trim() || '📝',
      collection: collection || undefined,
      shortcut: shortcut.trim(),
      pinned,
    })
  }

  useEffect(() => {
    const handleSaveEvent = () => {
      handleSave()
    }

    window.addEventListener('templateSave', handleSaveEvent)
    return () => {
      window.removeEventListener('templateSave', handleSaveEvent)
    }
  })

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 flex justify-center p-6">
        <div className="max-w-2xl w-full space-y-6">
          <Card>
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-3 space-y-2">
                  <Label htmlFor="title">{t('title')} *</Label>
                  <Input
                    ref={titleInputRef}
                    id="title"
                    placeholder={t('enterTemplateTitle')}
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
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
                        onChange={(event) => setIcon(event.target.value)}
                        className={`text-center pr-10 ${icon ? 'text-transparent' : ''}`}
                        maxLength={2}
                      />
                      {icon && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <EmojiRenderer emoji={icon} size={20} />
                        </div>
                      )}
                    </div>
                    <EmojiPicker onEmojiSelect={setIcon} emojiFolder={emojiFolder} />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">{t('content')} *</Label>
                <Textarea
                  id="content"
                  placeholder={t('enterTemplateContent')}
                  value={content}
                  onChange={(event) => setContent(event.target.value)}
                  className="min-h-[200px] resize-none"
                />
                <p className="text-sm text-muted-foreground">
                  {content.length} {t('charactersCount')}
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="collection">{t('collection')}</Label>
                  <Select
                    value={collection || NO_COLLECTION_VALUE}
                    onValueChange={(value) =>
                      setCollection(value === NO_COLLECTION_VALUE ? '' : value)
                    }
                  >
                    <SelectTrigger id="collection" className="w-full">
                      <SelectValue placeholder={t('chooseCollection')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NO_COLLECTION_VALUE}>
                        {t('noCollection')}
                      </SelectItem>
                      {collections.map((collectionOption) => (
                        <SelectItem key={collectionOption} value={collectionOption}>
                          {collectionOption}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground">
                    {t('collectionOptionalDescription')}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="new-collection">{t('createCollection')}</Label>
                  <div className="flex gap-2">
                    <Input
                      id="new-collection"
                      placeholder={t('enterCollectionName')}
                      value={newCollectionName}
                      onChange={(event) => setNewCollectionName(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                          event.preventDefault()
                          handleCreateCollection()
                        }
                      }}
                    />
                    <Button type="button" variant="outline" onClick={handleCreateCollection}>
                      {t('add')}
                    </Button>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="shortcut">{t('keyboardShortcut')}</Label>
                <ShortcutRecorder
                  value={shortcut}
                  onChange={setShortcut}
                  existingShortcuts={existingShortcuts}
                  language={language}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="pinned">{t('pinTemplate')}</Label>
                  <p className="text-sm text-muted-foreground">
                    {t('pinnedTemplateDescription')}
                  </p>
                </div>
                <Switch id="pinned" checked={pinned} onCheckedChange={setPinned} />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default TemplateEditor
