import { useState } from 'react'
import { Check, FolderPlus, Pencil, Trash2, X } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useTranslation, type Language } from '@/utils/translations'

type CollectionCreateResult = { status: 'created' | 'existing' | 'empty'; name?: string }
type CollectionRenameResult = {
  status: 'renamed' | 'existing' | 'empty' | 'unchanged'
  name?: string
}

interface CollectionManagerDialogProps {
  collections: string[]
  collectionCounts: Record<string, number>
  onCreateCollection: (name: string) => CollectionCreateResult
  onRenameCollection: (currentName: string, nextName: string) => CollectionRenameResult
  onDeleteCollection: (name: string) => void
  language: Language
}

export function CollectionManagerDialog({
  collections,
  collectionCounts,
  onCreateCollection,
  onRenameCollection,
  onDeleteCollection,
  language
}: CollectionManagerDialogProps) {
  const { t } = useTranslation(language)
  const [isOpen, setIsOpen] = useState(false)
  const [newCollectionName, setNewCollectionName] = useState('')
  const [editingCollection, setEditingCollection] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const [collectionToDelete, setCollectionToDelete] = useState<string | null>(null)

  const handleCreateCollection = () => {
    const result = onCreateCollection(newCollectionName)

    if (result.status === 'empty') {
      toast.error(t('collectionNameRequired'))
      return
    }

    if (result.status === 'existing') {
      toast.error(t('collectionAlreadyExists'))
      return
    }

    toast.success(t('collectionCreated'))
    setNewCollectionName('')
  }

  const handleStartRename = (collection: string) => {
    setEditingCollection(collection)
    setEditingName(collection)
  }

  const handleRenameCollection = () => {
    if (!editingCollection) {
      return
    }

    const result = onRenameCollection(editingCollection, editingName)

    if (result.status === 'empty') {
      toast.error(t('collectionNameRequired'))
      return
    }

    if (result.status === 'existing') {
      toast.error(t('collectionAlreadyExists'))
      return
    }

    if (result.status === 'renamed') {
      toast.success(t('collectionUpdated'))
    }

    setEditingCollection(null)
    setEditingName('')
  }

  const handleDeleteCollection = () => {
    if (!collectionToDelete) {
      return
    }

    onDeleteCollection(collectionToDelete)
    toast.success(t('collectionDeleted'))
    setCollectionToDelete(null)
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <FolderPlus size={14} />
            {t('manageCollections')}
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('manageCollections')}</DialogTitle>
            <DialogDescription>{t('manageCollectionsDescription')}</DialogDescription>
          </DialogHeader>

          <div className="space-y-5">
            <div className="space-y-2">
              <p className="text-sm font-medium">{t('createCollection')}</p>
              <div className="flex gap-2">
                <Input
                  placeholder={t('enterCollectionName')}
                  value={newCollectionName}
                  onChange={(event) => setNewCollectionName(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault()
                      handleCreateCollection()
                    }
                  }}
                />
                <Button onClick={handleCreateCollection}>{t('add')}</Button>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-sm font-medium">{t('collections')}</p>

              {collections.length === 0 ? (
                <div className="rounded-lg border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
                  {t('noCollectionsYet')}
                </div>
              ) : (
                <div className="space-y-2">
                  {collections.map((collection) => (
                    <div
                      key={collection}
                      className="flex items-center gap-3 rounded-lg border px-3 py-3"
                    >
                      <div className="flex-1 min-w-0">
                        {editingCollection === collection ? (
                          <Input
                            value={editingName}
                            onChange={(event) => setEditingName(event.target.value)}
                            onKeyDown={(event) => {
                              if (event.key === 'Enter') {
                                event.preventDefault()
                                handleRenameCollection()
                              }
                            }}
                          />
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="truncate font-medium">{collection}</span>
                            <Badge variant="outline">{collectionCounts[collection] ?? 0}</Badge>
                          </div>
                        )}
                      </div>

                      {editingCollection === collection ? (
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" onClick={handleRenameCollection}>
                            <Check size={14} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setEditingCollection(null)
                              setEditingName('')
                            }}
                          >
                            <X size={14} />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleStartRename(collection)}
                          >
                            <Pencil size={14} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => setCollectionToDelete(collection)}
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(collectionToDelete)} onOpenChange={(open) => !open && setCollectionToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('deleteCollectionTitle')}</AlertDialogTitle>
            <AlertDialogDescription>{t('deleteCollectionDescription')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteCollection}>
              {t('delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
