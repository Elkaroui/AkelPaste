import { toast } from 'sonner'

/**
 * Copy text to clipboard with toast notifications
 * @param content - The text content to copy
 * @param successMessage - Custom success message (optional)
 * @param errorMessage - Custom error message (optional)
 */
export const copyToClipboard = async (
  content: string,
  successMessage = 'Template copied to clipboard!',
  errorMessage = 'Failed to copy template'
): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(content)
    toast.success(successMessage)
    return true
  } catch (err) {
    console.error('Failed to copy text: ', err)
    toast.error(errorMessage)
    return false
  }
}

/**
 * Check if clipboard API is available
 */
export const isClipboardAvailable = (): boolean => {
  return !!navigator.clipboard && !!navigator.clipboard.writeText
}

/**
 * Read text from clipboard
 */
export const readFromClipboard = async (): Promise<string | null> => {
  try {
    if (!navigator.clipboard || !navigator.clipboard.readText) {
      throw new Error('Clipboard API not available')
    }
    return await navigator.clipboard.readText()
  } catch (err) {
    console.error('Failed to read from clipboard: ', err)
    return null
  }
}