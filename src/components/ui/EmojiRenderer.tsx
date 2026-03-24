import { useState } from 'react'

// Import all emoji assets individually to work with Vite
import emoji01 from '../../assets/emoji/01.gif'
import emoji02 from '../../assets/emoji/02.gif'
import emoji03 from '../../assets/emoji/03.gif'
import emoji04 from '../../assets/emoji/04.gif'
import emoji05 from '../../assets/emoji/05.gif'
import emoji06 from '../../assets/emoji/06.gif'
import emoji07 from '../../assets/emoji/07.png'
import emoji08 from '../../assets/emoji/08.png'
import emoji09 from '../../assets/emoji/09.gif'
import emoji10 from '../../assets/emoji/10.gif'
import emoji11 from '../../assets/emoji/11.gif'
import emoji12 from '../../assets/emoji/12.gif'
import emoji13 from '../../assets/emoji/13.gif'
import emoji14 from '../../assets/emoji/14.gif'
import emoji15 from '../../assets/emoji/15.gif'

interface EmojiRendererProps {
  emoji: string
  className?: string
  size?: number
}

// Map of emoji filenames to imported assets
const emojiAssetMap: Record<string, string> = {
  '01.gif': emoji01,
  '02.gif': emoji02,
  '03.gif': emoji03,
  '04.gif': emoji04,
  '05.gif': emoji05,
  '06.gif': emoji06,
  '07.png': emoji07,
  '08.png': emoji08,
  '09.gif': emoji09,
  '10.gif': emoji10,
  '11.gif': emoji11,
  '12.gif': emoji12,
  '13.gif': emoji13,
  '14.gif': emoji14,
  '15.gif': emoji15
}

export function EmojiRenderer({ emoji, className = '', size = 16 }: EmojiRendererProps) {
  const [imageError, setImageError] = useState(false)
  
  // Check if it's a custom emoji (starts with 'custom:')
  if (emoji.startsWith('custom:')) {
    const emojiName = emoji.replace('custom:', '')
    // Try to find the corresponding emoji file
    const emojiFiles = [
      '01.gif', '02.gif', '03.gif', '04.gif', '05.gif', '06.gif',
      '07.png', '08.png', '09.gif', '10.gif', '11.gif', '12.gif',
      '13.gif', '14.gif', '15.gif'
    ]
    
    const matchingFile = emojiFiles.find(file => file.startsWith(emojiName))
    
    if (matchingFile && !imageError) {
      const imageSrc = emojiAssetMap[matchingFile]
      
      if (imageSrc) {
        return (
          <img
            src={imageSrc}
            alt={`Custom emoji ${emojiName}`}
            className={`inline-block object-contain ${className}`}
            style={{ width: size, height: size }}
            onError={() => setImageError(true)}
          />
        )
      }
    }
    
    // Don't show anything if file not found or error occurred (no broken images)
    return null
  }
  
  // Regular emoji - display as text
  return <span className={className}>{emoji}</span>
}