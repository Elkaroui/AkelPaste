import React, { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { EmojiRenderer } from '@/components/ui/EmojiRenderer'
import { toast } from 'sonner'
import type { Template } from '@/types/global'
import { useTranslation, Language } from '@/utils/translations'
import { copyToClipboard } from '@/utils/clipboard'

interface FloatingTemplatesProps {
  language?: Language
}

export function FloatingTemplates({ language = 'en' }: FloatingTemplatesProps) {
  const [templates, setTemplates] = useState<Template[]>([])
  const [pinWindowSettings, setPinWindowSettings] = useState(() => {
    const saved = localStorage.getItem('pinWindowSettings')
    return saved ? JSON.parse(saved) : { showIcons: true, buttonPosition: 'right' }
  })
  const { t } = useTranslation(language)
  const containerRef = useRef<HTMLDivElement>(null)

  // Force empty title to prevent title bar from appearing
  useEffect(() => {
    document.title = ''
  }, [])

  // Listen for templates data from main process
  useEffect(() => {
    const handleTemplatesData = (templatesData: Template[]) => {
      setTemplates(templatesData)
    }

    // Request initial templates data
    if (window.api?.requestTemplatesData) {
      window.api.requestTemplatesData().then(setTemplates)
    }

    // Listen for updates
    if (window.api?.onTemplatesData) {
      window.api.onTemplatesData(handleTemplatesData)
    }

    return () => {
      if (window.api?.removeAllListeners) {
        window.api.removeAllListeners('templates-data')
      }
    }
  }, [])

  // Detect system theme
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const updateTheme = () => {
      document.documentElement.classList.toggle('dark', mediaQuery.matches)
    }
    
    updateTheme()
    mediaQuery.addEventListener('change', updateTheme)
    
    return () => mediaQuery.removeEventListener('change', updateTheme)
  }, [])

  // Listen for pin window settings changes
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      // Only handle pinWindowSettings changes
      if (event.key === 'pinWindowSettings' && event.newValue) {
        const newSettings = JSON.parse(event.newValue)
        const oldSettings = pinWindowSettings
        
        setPinWindowSettings(newSettings)
        
        // Only reload if pin-related settings changed
        const pinSettingsChanged = 
          oldSettings.enabled !== newSettings.enabled ||
          oldSettings.position !== newSettings.position ||
          oldSettings.opacity !== newSettings.opacity
        
        if (pinSettingsChanged && window.api?.reloadFloatingTemplates) {
          window.api.reloadFloatingTemplates().catch(console.error)
        }
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [pinWindowSettings])

  // Auto-resize window to fit content
  useEffect(() => {
    const resizeWindow = () => {
      if (containerRef.current && window.api?.resizeFloatingWindow) {
        // Wait for DOM to update and ensure content is rendered
        setTimeout(() => {
          const container = containerRef.current!
          
          // Get the bounding box of the actual content
          const rect = container.getBoundingClientRect()
          
          // Use exact content dimensions with minimal constraints
          // Add 1px to width to prevent any scrollbar appearance
          // Set max height to 400px to ensure scrolling works properly
          const width = Math.max(50, Math.min(500, Math.ceil(rect.width) + -1))
          const height = Math.max(50, Math.min(400, Math.ceil(rect.height)))
          
          console.log('Auto-resizing floating window:', { 
            contentRect: { width: rect.width, height: rect.height },
            final: { width, height }
          })
          
          window.api?.resizeFloatingWindow(width, height).catch(console.error)
        }, 150)
      }
    }

    resizeWindow()
  }, [templates, pinWindowSettings])

  const [copyingId, setCopyingId] = useState<string | null>(null)

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
      toast.success(t('copyToClipboard'))
    } catch (error) {
      console.error('Failed to copy template:', error)
      toast.error(t('failedToCopyTemplate'))
    } finally {
      setTimeout(() => setCopyingId(null), 1000)
    }
  }

  const pinnedTemplates = templates.filter(t => t.pinned)

  if (pinnedTemplates.length === 0) {
    return (
      <div ref={containerRef} className="inline-block">
        {/* Fixed Drag handle */}
        <div 
          className="fixed pointer-events-auto w-full h-6 bg-gray-900 cursor-move flex items-center justify-center border-b border-white/10 flex-shrink-0"
          style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
        >
          <div className="w-6 h-0.5 bg-white/40 rounded-full"></div>
        </div>
        
        {/* Scrollable content area */}
          <ScrollArea className="h-full max-h-[350px] rounded-md border">
          <div className="">
              <div className="p-6 flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <div className="text-sm font-medium">No pinned templates</div>
                  <div className="text-xs mt-1">Pin templates in the main window to see them here</div>
                </div>
              </div>
          </div>
          </ScrollArea>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="inline-block">
      {/* Fixed Drag handle */}
      <div 
        className="fixed z-10 pointer-events-auto w-full h-6 bg-gray-900 cursor-move flex items-center justify-center border-b border-white/10 flex-shrink-0"
        style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
      >
        <div className="w-6 h-0.5 bg-white/40 rounded-full"></div>
      </div>
      
      {/* Scrollable templates container */}
        <ScrollArea className="h-full max-h-[350px] pt-6">
      <div className=" overflow-hidden">
          <div className={`p-1 space-y-1 flex flex-col ${
            pinWindowSettings.buttonPosition === 'left' ? 'items-start' :
            pinWindowSettings.buttonPosition === 'center' ? 'items-center' :
            'items-end'
          }`}>
            {pinnedTemplates.map((template) => {
              const isCopying = copyingId === template.id
              
              return (
                <Button
                  key={template.id}
                  variant="secondary"
                  size="sm"
                  className={`h-8 px-2 pointer-events-auto transition-all duration-200 flex items-center gap-1.5 backdrop-blur-sm border border-white/20 hover:scale-105 ${
                     isCopying 
                       ? 'bg-green-500/90 text-white border-green-400/60 shadow-lg shadow-green-500/30' 
                       : 'bg-black/70 text-white hover:bg-black/90 hover:border-white/40'
                   }`}
                  onClick={() => handleCopy(template)}
                  disabled={isCopying}
                  title={`Copy: ${template.title}`}
                >
                  {/* Template icon */}
                  {pinWindowSettings.showIcons && (
                    <div className="flex-shrink-0">
                      {template.icon ? (
                        <EmojiRenderer 
                          emoji={template.icon} 
                          size={12} 
                          className="text-xs"
                        />
                      ) : (
                        <div className="w-3 h-3 rounded bg-white/20 flex items-center justify-center text-xs">
                          T
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Template title */}
                  <span className="text-xs font-medium truncate max-w-[150px]">
                    {template.title}
                  </span>
                  
                  {/* Copy indicator */}
                   {isCopying && (
                     <div className="h-2.5 w-2.5 border-2 border-current border-t-transparent rounded-full animate-spin flex-shrink-0" />
                   )}
                </Button>
              )
            })}
          </div>
      </div>
        </ScrollArea>
    </div>
  )
}

export default FloatingTemplates