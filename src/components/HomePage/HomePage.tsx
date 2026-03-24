import { Plus, FileText, FolderOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { TemplateCard } from './TemplateCard'
import { CollectionManagerDialog } from './CollectionManagerDialog'
import { useTranslation, type Language } from '@/utils/translations'
import type { Template } from '../../types/global'
import { cn } from '@/lib/utils'
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

type CollectionFilter = 'all' | string
type CollectionCreateResult = { status: 'created' | 'existing' | 'empty'; name?: string }
type CollectionRenameResult = {
  status: 'renamed' | 'existing' | 'empty' | 'unchanged'
  name?: string
}

interface HomePageProps {
  templates: Template[]
  collections: string[]
  activeCollection: CollectionFilter
  searchQuery: string
  onSearchChange: (query: string) => void
  onCollectionChange: (collection: CollectionFilter) => void
  onCreateCollection: (name: string) => CollectionCreateResult
  onRenameCollection: (currentName: string, nextName: string) => CollectionRenameResult
  onDeleteCollection: (name: string) => void
  onEditTemplate: (template: Template) => void
  onDeleteTemplate: (id: string) => void
  onNewTemplate: () => void
  onReorderTemplates: (templates: Template[]) => Promise<void>
  language: Language
  showTemplateContent: boolean
}

function reorderVisibleTemplates(
  allTemplates: Template[],
  visibleTemplates: Template[],
  activeId: string,
  overId: string
) {
  const oldIndex = visibleTemplates.findIndex((template) => template.id === activeId)
  const newIndex = visibleTemplates.findIndex((template) => template.id === overId)

  if (oldIndex === -1 || newIndex === -1) {
    return allTemplates
  }

  const reorderedVisibleTemplates = arrayMove(visibleTemplates, oldIndex, newIndex)
  const reorderedQueue = [...reorderedVisibleTemplates]

  return allTemplates.map((template) =>
    visibleTemplates.some((visibleTemplate) => visibleTemplate.id === template.id)
      ? reorderedQueue.shift()!
      : template
  )
}

function HomePage({
  templates,
  collections,
  activeCollection,
  searchQuery,
  onSearchChange,
  onCollectionChange,
  onCreateCollection,
  onRenameCollection,
  onDeleteCollection,
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

  const collectionCounts = templates.reduce<Record<string, number>>((accumulator, template) => {
    if (template.collection) {
      accumulator[template.collection] = (accumulator[template.collection] ?? 0) + 1
    }
    return accumulator
  }, {})

  const normalizedSearchQuery = searchQuery.trim().toLowerCase()
  const filteredTemplates = templates.filter((template) => {
    const matchesCollection =
      activeCollection === 'all' ||
      template.collection?.toLowerCase() === activeCollection.toLowerCase()
    const matchesSearch =
      normalizedSearchQuery.length === 0 ||
      template.title.toLowerCase().includes(normalizedSearchQuery) ||
      template.content.toLowerCase().includes(normalizedSearchQuery) ||
      template.collection?.toLowerCase().includes(normalizedSearchQuery)

    return matchesCollection && matchesSearch
  })

  const hasFilters = normalizedSearchQuery.length > 0 || activeCollection !== 'all'
  const hasCollections = collections.length > 0

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event

    if (!over || active.id === over.id) {
      return
    }

    const reorderedTemplates = reorderVisibleTemplates(
      templates,
      filteredTemplates,
      String(active.id),
      String(over.id)
    )

    await onReorderTemplates(reorderedTemplates)
  }

  const emptyTitle =
    templates.length === 0
      ? t('noTemplatesYet')
      : hasFilters
        ? t('noTemplatesMatchFilters')
        : t('noTemplatesYet')

  const emptyDescription =
    templates.length === 0
      ? t('createFirstTemplate')
      : hasFilters
        ? t('adjustSearchOrCollection')
        : t('createFirstTemplate')

  return (
    <div className="flex flex-col h-full w-full">
      <div className="p-6 border-b border-border bg-background space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant={activeCollection === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => onCollectionChange('all')}
            >
              {t('allCollections')}
            </Button>

            {collections.map((collection) => {
              const isActive = activeCollection !== 'all' && activeCollection === collection
              return (
                <Button
                  key={collection}
                  variant={isActive ? 'default' : 'outline'}
                  size="sm"
                  className={cn(
                    'gap-2',
                    !isActive && 'text-muted-foreground hover:text-foreground'
                  )}
                  onClick={() => onCollectionChange(collection)}
                >
                  <span>{collection}</span>
                  <span className="rounded-full bg-background/80 px-1.5 py-0.5 text-[11px] leading-none text-foreground">
                    {collectionCounts[collection] ?? 0}
                  </span>
                </Button>
              )
            })}
          </div>

          <CollectionManagerDialog
            collections={collections}
            collectionCounts={collectionCounts}
            onCreateCollection={onCreateCollection}
            onRenameCollection={onRenameCollection}
            onDeleteCollection={onDeleteCollection}
            language={language}
          />
        </div>

        {!hasCollections && templates.length > 0 && (
          <div className="flex items-center gap-2 rounded-lg border border-dashed px-3 py-2 text-sm text-muted-foreground">
            <FolderOpen size={14} />
            <span>{t('createFirstCollectionHint')}</span>
          </div>
        )}
      </div>

      <ScrollArea className="flex-1">
        <div className="p-6">
          {filteredTemplates.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center min-h-[400px]">
              <FileText className="text-muted-foreground mb-4" size={48} />
              <h3 className="text-lg font-medium mb-2 text-foreground">{emptyTitle}</h3>
              <p className="text-muted-foreground mb-4">{emptyDescription}</p>

              {templates.length === 0 ? (
                <Button onClick={onNewTemplate} className="gap-2">
                  <Plus size={16} />
                  {t('createTemplate')}
                </Button>
              ) : hasFilters ? (
                <Button
                  variant="outline"
                  onClick={() => {
                    onSearchChange('')
                    onCollectionChange('all')
                  }}
                >
                  {t('clearFilters')}
                </Button>
              ) : null}
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext items={filteredTemplates.map((template) => template.id)} strategy={rectSortingStrategy}>
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
