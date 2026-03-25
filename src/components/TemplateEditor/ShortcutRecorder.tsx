import { useState, useEffect, useRef } from 'react'
import { Keyboard } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { useTranslation, type Language } from '@/utils/translations'

interface ShortcutRecorderProps {
  value: string
  onChange: (shortcut: string) => void
  existingShortcuts?: string[] // Array of shortcuts already in use
  language: Language
}

const MODIFIER_KEYS = ['Ctrl', 'Alt', 'Shift', 'Meta']
const MODIFIER_FALLBACK_WINDOW_MS = 350

function normalizeShortcutValue(shortcut: string): string {
  return shortcut
    .split('+')
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      switch (part.toLowerCase()) {
        case 'control':
        case 'ctrl':
          return 'Ctrl'
        case 'command':
        case 'cmd':
        case 'super':
        case 'meta':
          return 'Meta'
        case 'alt':
          return 'Alt'
        case 'shift':
          return 'Shift'
        default:
          return part.length === 1 ? part.toUpperCase() : part
      }
    })
    .join(' + ')
}

function getShortcutKey(event: KeyboardEvent): string | null {
  if (event.code.startsWith('Digit')) {
    return event.code.replace('Digit', '')
  }

  if (event.code.startsWith('Numpad')) {
    return event.code.replace('Numpad', '')
  }

  if (event.code.startsWith('Key')) {
    return event.code.replace('Key', '')
  }

  switch (event.code) {
    case 'Space':
      return 'Space'
    case 'Minus':
      return '-'
    case 'Equal':
      return '='
    case 'Comma':
      return ','
    case 'Period':
      return '.'
    case 'Slash':
      return '/'
    case 'Semicolon':
      return ';'
    case 'Quote':
      return "'"
    case 'BracketLeft':
      return '['
    case 'BracketRight':
      return ']'
    case 'Backslash':
      return '\\'
    case 'Backquote':
      return '`'
    default:
      break
  }

  if (!['Control', 'Alt', 'Shift', 'Meta'].includes(event.key)) {
    return event.key.length === 1 ? event.key.toUpperCase() : event.key
  }

  return null
}

export function ShortcutRecorder({ value, onChange, existingShortcuts = [], language }: ShortcutRecorderProps) {
  const { t } = useTranslation(language)
  const [isRecording, setIsRecording] = useState(false)
  const [recordedKeys, setRecordedKeys] = useState<string[]>([])
  const recordedKeysRef = useRef<string[]>([])
  const modifierSnapshotRef = useRef<{ keys: string[]; timestamp: number } | null>(null)
  const normalizedExistingShortcuts = existingShortcuts.map(normalizeShortcutValue)
  const normalizedCurrentValue = normalizeShortcutValue(value)

  useEffect(() => {
    if (!isRecording) return

    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault()
      e.stopPropagation()

      if (e.key === 'Escape') {
        setIsRecording(false)
        setRecordedKeys([])
        recordedKeysRef.current = []
        return
      }

      const keys: string[] = []
      
      // Add modifier keys
      if (e.ctrlKey) keys.push('Ctrl')
      if (e.altKey) keys.push('Alt')
      if (e.shiftKey) keys.push('Shift')
      if (e.metaKey) keys.push('Meta')

      const now = Date.now()
      const shortcutKey = getShortcutKey(e)

      if (!shortcutKey && keys.length > 0) {
        modifierSnapshotRef.current = {
          keys: [...keys],
          timestamp: now
        }
      }

      let finalKeys = [...keys]
      const recentModifierSnapshot =
        modifierSnapshotRef.current &&
        now - modifierSnapshotRef.current.timestamp <= MODIFIER_FALLBACK_WINDOW_MS
          ? modifierSnapshotRef.current.keys
          : null

      if (shortcutKey && finalKeys.length === 0 && recentModifierSnapshot?.length) {
        finalKeys = [...recentModifierSnapshot]
      }

      if (shortcutKey && !finalKeys.includes(shortcutKey)) {
        finalKeys.push(shortcutKey)
      }

      recordedKeysRef.current = finalKeys
      setRecordedKeys(finalKeys)

      if (!shortcutKey) {
        return
      }

      const shortcut = finalKeys.join(' + ')
      const hasNonModifier = finalKeys.some(key => !MODIFIER_KEYS.includes(key))
      if (!hasNonModifier) {
        toast.error(t('includeNonModifierKey'))
        setIsRecording(false)
        setRecordedKeys([])
        recordedKeysRef.current = []
        modifierSnapshotRef.current = null
        return
      }

      const normalizedShortcut = normalizeShortcutValue(shortcut)

      if (normalizedShortcut === normalizedCurrentValue) {
        toast.error(t('shortcutAlreadyAssigned'))
        setIsRecording(false)
        setRecordedKeys([])
        recordedKeysRef.current = []
        modifierSnapshotRef.current = null
        return
      }

      if (normalizedExistingShortcuts.includes(normalizedShortcut)) {
        toast.error(t('keyboardShortcutAlreadyUsed'))
        setIsRecording(false)
        setRecordedKeys([])
        recordedKeysRef.current = []
        modifierSnapshotRef.current = null
        return
      }

      const systemShortcuts = ['Ctrl + C', 'Ctrl + V', 'Ctrl + X', 'Ctrl + Z', 'Ctrl + Y', 'Ctrl + A', 'Ctrl + S']
      if (systemShortcuts.includes(normalizedShortcut)) {
        toast.error(t('systemShortcutCannotBeUsed'))
        setIsRecording(false)
        setRecordedKeys([])
        recordedKeysRef.current = []
        modifierSnapshotRef.current = null
        return
      }

      try {
        console.log('Recording shortcut:', shortcut)
        onChange(normalizedShortcut)
        setIsRecording(false)
        setRecordedKeys([])
        recordedKeysRef.current = []
        modifierSnapshotRef.current = null
      } catch (error) {
        console.error('Error recording shortcut:', error)
        toast.error(t('errorRecordingShortcut'))
        setIsRecording(false)
        setRecordedKeys([])
        recordedKeysRef.current = []
        modifierSnapshotRef.current = null
      }
    }

    window.addEventListener('keydown', handleKeyDown, true)

    return () => {
      window.removeEventListener('keydown', handleKeyDown, true)
    }
  }, [isRecording, normalizedCurrentValue, normalizedExistingShortcuts, onChange, t])

  const startRecording = () => {
    const activeElement = document.activeElement
    if (activeElement instanceof HTMLElement) {
      activeElement.blur()
    }

    setIsRecording(true)
    setRecordedKeys([])
    recordedKeysRef.current = []
    modifierSnapshotRef.current = null
    window.setTimeout(() => window.focus(), 0)
  }

  const clearShortcut = () => {
    setIsRecording(false)
    setRecordedKeys([])
    recordedKeysRef.current = []
    modifierSnapshotRef.current = null
    onChange('')
    // Removed clear confirmation toast to reduce clutter
  }

  return (
    <div className="flex gap-2">
      <Input
        placeholder={t('noShortcutSet')}
        value={isRecording ? recordedKeys.join(' + ') || t('recording') : value}
        readOnly
        className={isRecording ? 'border-primary' : ''}
      />
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={startRecording}
        onMouseDown={(event) => {
          event.preventDefault()
        }}
        disabled={isRecording}
      >
        <Keyboard size={16} />
      </Button>
      {value && (
        <Button
          type="button"
          variant="outline"
          onClick={clearShortcut}
        >
          {t('clear')}
        </Button>
      )}
    </div>
  )
}
