import { useState, useEffect } from 'react'
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

export function ShortcutRecorder({ value, onChange, existingShortcuts = [], language }: ShortcutRecorderProps) {
  const { t } = useTranslation(language)
  const [isRecording, setIsRecording] = useState(false)
  const [recordedKeys, setRecordedKeys] = useState<string[]>([])

  useEffect(() => {
    if (!isRecording) return

    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault()
      e.stopPropagation()

      const keys: string[] = []
      
      // Add modifier keys
      if (e.ctrlKey) keys.push('Ctrl')
      if (e.altKey) keys.push('Alt')
      if (e.shiftKey) keys.push('Shift')
      if (e.metaKey) keys.push('Meta')
      
      // Add the main key (if it's not a modifier)
      if (!['Control', 'Alt', 'Shift', 'Meta'].includes(e.key)) {
        keys.push(e.key.toUpperCase())
      }
      
      setRecordedKeys(keys)
    }

    const handleKeyUp = async (e: KeyboardEvent) => {
      e.preventDefault()
      e.stopPropagation()
      
      // Only finish recording if we have at least one non-modifier key and all modifier keys are released
      if (recordedKeys.length > 0 && !['Control', 'Alt', 'Shift', 'Meta'].includes(e.key)) {
        // Wait a bit to ensure all keys are captured properly
        setTimeout(() => {
          const shortcut = recordedKeys.join(' + ')
          
          // Validate that we have a complete shortcut (at least one non-modifier key)
          const hasNonModifier = recordedKeys.some(key => !['Ctrl', 'Alt', 'Shift', 'Meta'].includes(key))
          if (!hasNonModifier) {
            toast.error(t('includeNonModifierKey'))
            setIsRecording(false)
            setRecordedKeys([])
            return
          }
          
          // Check if this shortcut conflicts with existing ones
           if (shortcut === value) {
             toast.error(t('shortcutAlreadyAssigned'))
             setIsRecording(false)
             setRecordedKeys([])
             return
           }
           
           // Check if shortcut is already used by another template
           if (existingShortcuts.includes(shortcut)) {
             toast.error(t('keyboardShortcutAlreadyUsed'))
             setIsRecording(false)
             setRecordedKeys([])
             return
           }
           
           // Check for common system shortcuts that should be avoided
           const systemShortcuts = ['Ctrl + C', 'Ctrl + V', 'Ctrl + X', 'Ctrl + Z', 'Ctrl + Y', 'Ctrl + A', 'Ctrl + S']
           if (systemShortcuts.includes(shortcut)) {
             toast.error(t('systemShortcutCannotBeUsed'))
             setIsRecording(false)
             setRecordedKeys([])
             return
           }
          
          try {
            console.log('Recording shortcut:', shortcut)
            onChange(shortcut)
            setIsRecording(false)
            setRecordedKeys([])
            // Removed success toast to reduce clutter
          } catch (error) {
            console.error('Error recording shortcut:', error)
            toast.error(t('errorRecordingShortcut'))
            setIsRecording(false)
            setRecordedKeys([])
          }
        }, 100) // Small delay to ensure all keys are captured
      }
    }

    // Handle escape to cancel recording
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsRecording(false)
        setRecordedKeys([])
        // Removed cancellation toast to reduce clutter
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('keyup', handleKeyUp)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('keyup', handleKeyUp)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isRecording, recordedKeys, onChange])

  const startRecording = () => {
    setIsRecording(true)
    setRecordedKeys([])
    // Removed instruction toast to reduce clutter
  }

  const clearShortcut = () => {
    setIsRecording(false)
    setRecordedKeys([])
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