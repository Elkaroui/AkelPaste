import React, { useEffect, useRef, useState } from 'react'
import { getCurrentWindow } from '@tauri-apps/api/window'
import { Button } from '@/components/ui/button'
import { EmojiRenderer } from '@/components/ui/EmojiRenderer'
import type { Template } from '@/types/global'
import type { Language } from '@/utils/translations'
import { copyToClipboard } from '@/utils/clipboard'

interface FloatingTemplatesProps {
  language?: Language
}

type PinWindowSettings = {
  showIcons: boolean
  buttonPosition: 'left' | 'center' | 'right'
}

const defaultPinWindowSettings: PinWindowSettings = {
  showIcons: true,
  buttonPosition: 'right'
}

export function FloatingTemplates({ language: _language = 'en' }: FloatingTemplatesProps) {
  const [templates, setTemplates] = useState<Template[]>([])
  const [pinWindowSettings, setPinWindowSettings] = useState<PinWindowSettings>(() => {
    const saved = localStorage.getItem('pinWindowSettings')
    if (!saved) return defaultPinWindowSettings

    try {
      return {
        ...defaultPinWindowSettings,
        ...JSON.parse(saved)
      }
    } catch (error) {
      console.error('Failed to parse pin window settings:', error)
      return defaultPinWindowSettings
    }
  })
  const [hasManualResize, setHasManualResize] = useState(() => {
    return !!localStorage.getItem('akel-floating-window-manual-size')
  })
  const [copyingId, setCopyingId] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const autoResizingRef = useRef(false)

  useEffect(() => {
    document.title = ''
  }, [])

  useEffect(() => {
    const handleTemplatesData = (templatesData: Template[]) => {
      setTemplates(templatesData)
    }

    if (window.api?.requestTemplatesData) {
      window.api.requestTemplatesData().then(setTemplates)
    }

    if (window.api?.onTemplatesData) {
      window.api.onTemplatesData(handleTemplatesData)
    }

    return () => {
      if (window.api?.removeAllListeners) {
        window.api.removeAllListeners('templates-data')
      }
    }
  }, [])

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const updateTheme = () => {
      document.documentElement.classList.toggle('dark', mediaQuery.matches)
    }

    updateTheme()
    mediaQuery.addEventListener('change', updateTheme)

    return () => mediaQuery.removeEventListener('change', updateTheme)
  }, [])

  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'pinWindowSettings' && event.newValue) {
        try {
          setPinWindowSettings({
            ...defaultPinWindowSettings,
            ...JSON.parse(event.newValue)
          })
        } catch (error) {
          console.error('Failed to update floating pin window settings:', error)
        }
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  useEffect(() => {
    const currentWindow = getCurrentWindow()
    currentWindow.setResizable(true).catch(console.error)

    let unlisten: (() => void) | undefined
    currentWindow
      .onResized(({ payload }) => {
        if (autoResizingRef.current) return

        localStorage.setItem(
          'akel-floating-window-manual-size',
          JSON.stringify({ width: payload.width, height: payload.height })
        )
        setHasManualResize(true)
      })
      .then((dispose) => {
        unlisten = dispose
      })
      .catch(console.error)

    return () => {
      unlisten?.()
    }
  }, [])

  useEffect(() => {
    const resizeWindow = () => {
      if (!containerRef.current || !window.api?.resizeFloatingWindow || hasManualResize) {
        return
      }

      window.setTimeout(() => {
        const container = containerRef.current
        if (!container) return

        const width = Math.max(166, Math.min(656, Math.ceil(container.scrollWidth) + 12))
        const height = Math.max(48, Math.min(912, Math.ceil(container.scrollHeight) + 12))

        autoResizingRef.current = true
        window.api
          .resizeFloatingWindow(width, height)
          .catch(console.error)
          .finally(() => {
            window.setTimeout(() => {
              autoResizingRef.current = false
            }, 120)
          })
      }, 150)
    }

    resizeWindow()
  }, [templates, pinWindowSettings, hasManualResize])

  const handleCopy = async (template: Template, event?: React.MouseEvent) => {
    if (event) {
      event.stopPropagation()
    }

    setCopyingId(template.id)

    try {
      if (window.api?.copyToClipboard) {
        await window.api.copyToClipboard(template.content)
      } else {
        await copyToClipboard(template.content)
      }
    } catch (error) {
      console.error('Failed to copy template:', error)
    } finally {
      window.setTimeout(() => setCopyingId(null), 1000)
    }
  }

  const handleDragPointerDown = async (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return

    event.preventDefault()
    event.stopPropagation()

    try {
      await getCurrentWindow().startDragging()
    } catch (error) {
      console.error('Failed to start dragging floating window:', error)
    }
  }

  const pinnedTemplates = templates.filter((template) => template.pinned)
  const alignmentClass =
    pinWindowSettings.buttonPosition === 'left'
      ? 'items-start'
      : pinWindowSettings.buttonPosition === 'center'
        ? 'items-center'
        : 'items-end'
  const contentAreaClass = hasManualResize
    ? 'max-h-[calc(100vh-1.5rem)] overflow-y-auto overflow-x-hidden'
    : 'overflow-hidden'

  if (pinnedTemplates.length === 0) {
    return (
      <div ref={containerRef} className="inline-flex min-w-[220px] flex-col gap-1 overflow-visible bg-transparent px-2 py-2 text-white">
        <div
          className="pointer-events-auto flex h-6 w-full cursor-move items-center justify-center select-none touch-none"
          onPointerDown={handleDragPointerDown}
          onDoubleClick={(event) => event.preventDefault()}
        >
          <div className="h-1 w-10 rounded-full bg-white/55" />
        </div>

        <div className="px-3 pb-2 text-center text-xs text-white/65">
          Pin templates in the main window to see them here
        </div>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="inline-flex min-w-[140px] max-w-[640px] flex-col gap-1 overflow-visible bg-transparent px-2 py-2 text-white">
      <div
        className="pointer-events-auto flex h-6 w-full cursor-move items-center justify-center select-none touch-none"
        onPointerDown={handleDragPointerDown}
        onDoubleClick={(event) => event.preventDefault()}
      >
        <div className="h-1 w-10 rounded-full bg-white/55" />
      </div>

      <div className={contentAreaClass}>
        <div className={`flex flex-col gap-2 px-1 py-1 ${alignmentClass}`}>
          {pinnedTemplates.map((template) => {
            const isCopying = copyingId === template.id

            return (
              <Button
                key={template.id}
                variant="secondary"
                size="sm"
                className={`pointer-events-auto flex h-8 w-fit max-w-full select-none items-center gap-1.5 border border-white/20 px-2 backdrop-blur-sm transition-all duration-200 hover:scale-105 ${
                  isCopying
                    ? 'border-green-400/60 bg-green-500/90 text-white shadow-lg shadow-green-500/30'
                    : 'bg-black/70 text-white hover:border-white/40 hover:bg-black/90'
                }`}
                onClick={() => handleCopy(template)}
                disabled={isCopying}
                title={`Copy: ${template.title}`}
              >
                {pinWindowSettings.showIcons && (
                  <div className="flex-shrink-0">
                    {template.icon ? (
                      <EmojiRenderer emoji={template.icon} size={12} className="text-xs" />
                    ) : (
                      <div className="flex h-3 w-3 items-center justify-center rounded bg-white/20 text-xs">
                        T
                      </div>
                    )}
                  </div>
                )}

                <span className="max-w-[320px] truncate text-xs font-medium">
                  {template.title}
                </span>

                {isCopying && (
                  <div className="h-2.5 w-2.5 flex-shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent" />
                )}
              </Button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default FloatingTemplates
