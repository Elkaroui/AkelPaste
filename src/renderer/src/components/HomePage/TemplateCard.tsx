import { Copy, Edit, Trash2, GripVertical, Citrus } from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card-templates'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { EmojiRenderer } from '@/components/ui/EmojiRenderer'
import { copyToClipboard } from '@/utils/clipboard'

import { useTranslation, type Language } from '@/utils/translations'
import type { Template } from '../../types/global'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface TemplateCardProps {
  template: Template
  onEdit: (template: Template) => void
  onDelete: (id: string) => void
  language: Language
  showTemplateContent: boolean
}

export function TemplateCard({
  template,
  onEdit,
  onDelete,
  language,
  showTemplateContent
}: TemplateCardProps) {
  const { t } = useTranslation(language)
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: template.id })
  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      // Use the main process IPC handler for more reliable clipboard access
      if (window.api?.copyToClipboard) {
        await window.api.copyToClipboard(template.content)
        // Show success toast
        const { toast } = await import('sonner')
        toast.success(t('copyToClipboard'))
      } else {
        // Fallback to renderer clipboard
        await copyToClipboard(template.content)
      }
    } catch (error) {
      console.error('Failed to copy template:', error)
      const { toast } = await import('sonner')
      toast.error(t('failedToCopyTemplate'))
    }
  }

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation()
    onEdit(template)
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    onDelete(template.id)
  }

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <TooltipProvider>
      <Card
        ref={setNodeRef}
        style={style}
        className="group w-full hover:z-10 hover:shadow-md transition-shadow relative flex min-w-[300px] md:max-w-[300px]"

        onClick={handleCopy}
      >
        <div className="px-6 flex flex-col">
          {/* Grip Button */}
          <div 
            className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded absolute right-0.5 opacity-0 group-hover:opacity-100 transition-all duration-200"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="w-4 h-4 text-muted-foreground" />
          </div>
          
          <div className="flex gap-3">
            {/* Icon on the left */}
            {template.icon && (
              <div className="flex-shrink-0 w-14 h-14 flex items-center justify-center rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/10">
                <EmojiRenderer emoji={template.icon} size={32} className="text-xl" />
              </div>
            )}
            
            {/* Right side content */}
            <div className="flex-1 min-w-0 flex flex-col gap-2 overflow-hidden items-end">
              {/* Shortcut and Pin row */}
              <div className="flex items-center justify-end gap-2 w-full">
                {template.shortcut && (
                  <Badge variant="outline" className="text-xs px-2 py-0.5 font-mono">
                    {template.shortcut}
                  </Badge>
                )}
              </div>
              {template.pinned && (
                  // <div className="w-3 h-3 bg-primary/20 rounded-full border-2 border-background shadow-sm"></div>
                  <div className='absolute top-1 right-1'>
                    <Citrus className="w-4 h-4 text-primary/40 " />
                  </div>
              )}
           </div>
          </div>
        </div>
        
        <CardContent className='flex flex-col gap-4'>
          {/* Title row */}
          <div className="border-t border-border/50"></div>
          <div className='flex flex-col gap-2'>
            <h3 className="font-semibold text-base leading-tight truncate w-full">{template.title}</h3>
            {showTemplateContent && (
              <>
                <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                  {template.content}
                </p>
              </>
            )}
          </div>


          {/* Floating Action Buttons */}
          <div className="absolute bottom-3 right-3 z-10 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 bg-background/80 backdrop-blur-sm hover:bg-primary/10 hover:text-primary"
                  onClick={handleCopy}
                >
                  <Copy size={14} />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>{t('copyToClipboard')}</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 bg-background/80 backdrop-blur-sm hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-950 dark:hover:text-blue-400"
                  onClick={handleEdit}
                >
                  <Edit size={14} />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>{t('editTemplate')}</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 bg-background/80 backdrop-blur-sm hover:bg-destructive/10 hover:text-destructive"
                  onClick={handleDelete}
                >
                  <Trash2 size={14} />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>{t('deleteTemplate')}</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  )
}

export default TemplateCard