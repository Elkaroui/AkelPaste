import { Search, Plus, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { TemplateCard } from './TemplateCard'
import { useTranslation, type Language } from '@/utils/translations'
import type { Template } from '../../types/global'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from '@dnd-kit/sortable'

interface HomePageProps {
  templates: Template[]
  searchQuery: string
  onSearchChange: (query: string) => void
  onEditTemplate: (template: Template) => void
  onDeleteTemplate: (id: string) => void
  onNewTemplate: () => void
  onReorderTemplates: (templates: Template[]) => Promise<void>
  language: Language
  showTemplateContent: boolean
}

function HomePage({
  templates,
  searchQuery,
  onSearchChange,
  onEditTemplate,
  onDeleteTemplate,
  onNewTemplate,
  onReorderTemplates,
  language,
  showTemplateContent
}: HomePageProps) {

  const { t } = useTranslation(language)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event

    if (active.id !== over?.id) {
      const oldIndex = templates.findIndex((template) => template.id === active.id)
      const newIndex = templates.findIndex((template) => template.id === over?.id)
      
      const reorderedTemplates = arrayMove(templates, oldIndex, newIndex)
      await onReorderTemplates(reorderedTemplates)
    }
  }

  // Filter templates based on search query
  const filteredTemplates = templates.filter(template =>
    template.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    template.content.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Removed copyToClipboard function - now handled by TemplateCard component

  return (
    <div className="flex flex-col h-full w-full">
      {/* Search */}
      <div className="p-6 border-b border-border bg-background">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
          <Input
            placeholder={t('searchTemplates')}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Templates Grid */}
      <ScrollArea className="flex-1">
        <div className="p-6">
          {filteredTemplates.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center min-h-[400px]">
              <FileText className="text-muted-foreground mb-4" size={48} />
              <h3 className="text-lg font-medium mb-2 text-foreground">
                {templates.length === 0 ? t('noTemplatesYet') : 'No templates match your search'}
              </h3>
              <p className="text-muted-foreground mb-4">
                {templates.length === 0 ? t('createFirstTemplate') : 'Try adjusting your search terms'}
              </p>
              {templates.length === 0 && (
                <Button onClick={onNewTemplate} className="gap-2">
                  <Plus size={16} />
                  {t('createTemplate')}
                </Button>
              )}
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext items={filteredTemplates.map(t => t.id)} strategy={rectSortingStrategy}>
                <div className="flex flex-wrap gap-4">
                  {filteredTemplates.map((template) => (
                    <TemplateCard
                      key={template.id}
                      template={template}

                      onEdit={onEditTemplate}
                      onDelete={onDeleteTemplate}
                      language={language}
                      showTemplateContent={showTemplateContent}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}

export default HomePage