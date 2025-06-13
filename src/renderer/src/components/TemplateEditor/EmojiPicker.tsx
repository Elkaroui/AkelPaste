import { useState, useEffect } from 'react'
import { Smile } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

import { EMOJI_CATEGORIES } from '@/utils/constants'

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void
  emojiFolder?: string
}

export function EmojiPicker({ onEmojiSelect, emojiFolder }: EmojiPickerProps) {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [customEmojis, setCustomEmojis] = useState<string[]>([])

  useEffect(() => {
    const loadCustomEmojis = async () => {
      if (emojiFolder) {
        try {
          // Import emoji assets individually to work with Vite
          const emojiImports = [
            import('../../assets/emoji/01.gif'),
            import('../../assets/emoji/02.gif'),
            import('../../assets/emoji/03.gif'),
            import('../../assets/emoji/04.gif'),
            import('../../assets/emoji/05.gif'),
            import('../../assets/emoji/06.gif'),
            import('../../assets/emoji/07.png'),
            import('../../assets/emoji/08.png'),
            import('../../assets/emoji/09.gif'),
            import('../../assets/emoji/10.gif'),
            import('../../assets/emoji/11.gif'),
            import('../../assets/emoji/12.gif'),
            import('../../assets/emoji/13.gif'),
            import('../../assets/emoji/14.gif'),
            import('../../assets/emoji/15.gif')
          ]
          
          const emojiAssets = await Promise.allSettled(emojiImports)
          const validEmojis = emojiAssets
            .filter((result): result is PromiseFulfilledResult<any> => result.status === 'fulfilled')
            .map(result => result.value.default)
            .filter(Boolean)
          
          setCustomEmojis(validEmojis)
        } catch (error) {
          console.error('Failed to load custom emojis:', error)
        }
      }
    }
    
    loadCustomEmojis()
  }, [emojiFolder])

  const handleEmojiClick = (emoji: string) => {
    onEmojiSelect(emoji)
    setShowEmojiPicker(false)
  }

  const handleCustomEmojiClick = (index: number) => {
    // For custom emojis, we'll use the index to match with the original file list
    const emojiFiles = [
      '01.gif', '02.gif', '03.gif', '04.gif', '05.gif', '06.gif',
      '07.png', '08.png', '09.gif', '10.gif', '11.gif', '12.gif',
      '13.gif', '14.gif', '15.gif'
    ]
    
    const fileName = emojiFiles[index]?.split('.')[0] || `${index + 1}`
    onEmojiSelect(`custom:${fileName}`)
    setShowEmojiPicker(false)
  }

  return (
    <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon">
          <Smile size={16} />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <Tabs defaultValue="Smileys" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            {Object.keys(EMOJI_CATEGORIES).map((category) => (
              <TabsTrigger key={category} value={category} className="text-xs">
                {category}
              </TabsTrigger>
            ))}
            {customEmojis.length > 0 && (
              <TabsTrigger value="Custom" className="text-xs">
                Custom
              </TabsTrigger>
            )}
          </TabsList>
          {Object.entries(EMOJI_CATEGORIES).map(([category, emojis]) => (
            <TabsContent key={category} value={category} className="mt-0">
              <ScrollArea className="h-48 p-4">
                <div className="grid grid-cols-8 gap-2">
                  {emojis.map((emoji, index) => (
                    <Button
                      key={`${emoji}-${index}`}
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-lg hover:bg-accent"
                      onClick={() => handleEmojiClick(emoji)}
                    >
                      {emoji}
                    </Button>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>
          ))}
          {customEmojis.length > 0 && (
            <TabsContent value="Custom" className="mt-0">
              <ScrollArea className="h-48 p-4">
                <div className="grid grid-cols-6 gap-2">
                  {customEmojis.map((emojiSrc, index) => (
                    <Button
                      key={`custom-${index}`}
                      variant="ghost"
                      size="sm"
                      className="h-10 w-10 p-1 hover:bg-accent"
                      onClick={() => handleCustomEmojiClick(index)}
                    >
                      <img
                        src={emojiSrc}
                        alt={`Custom emoji ${index + 1}`}
                        className="h-full w-full object-contain"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none'
                        }}
                      />
                    </Button>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>
          )}
        </Tabs>
      </PopoverContent>
    </Popover>
  )
}