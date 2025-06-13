// import React from 'react'
import { Download, Upload, Trash2, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { useTranslation, type Language } from '@/utils/translations'
import { dataManager } from '@/utils/dataManager'

interface DataManagementProps {
  language: Language
}

export function DataManagement({ language }: DataManagementProps) {
  const { t } = useTranslation(language)
  const handleExportData = () => {
    try {
      const data = dataManager.loadData()
      const dataStr = JSON.stringify(data, null, 2)
      const dataBlob = new Blob([dataStr], { type: 'application/json' })
      
      const url = URL.createObjectURL(dataBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = `akel-templates-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      
      toast.success(t('exportSuccess'))
    } catch (error) {
      console.error('Export failed:', error)
      toast.error(t('exportError'))
    }
  }

  const handleImportData = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return

      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target?.result as string)
          if (dataManager.saveData(data)) {
            toast.success(t('importSuccess'))
            // Reload the page to reflect changes
            window.location.reload()
          } else {
            toast.error(t('importError'))
          }
        } catch (error) {
          console.error('Import failed:', error)
          toast.error(t('invalidFileFormat'))
        }
      }
      reader.readAsText(file)
    }
    input.click()
  }

  const handleRestoreBackup = () => {
    const backupData = dataManager.loadBackup()
    if (backupData) {
      dataManager.saveData(backupData)
      toast.success(t('backupRestoredSuccessfully'))
      // Reload the page to reflect changes
      window.location.reload()
    } else {
      toast.error(t('noBackupFoundOrRestoreFailed'))
    }
  }

  const handleClearData = () => {
    if (window.confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
      try {
        dataManager.clearData()
        toast.success(t('allDataClearedSuccessfully'))
        // Reload the page to reflect changes
        window.location.reload()
      } catch (error) {
        toast.error(t('failedToClearData'))
      }
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('dataManagement')}</CardTitle>
        <CardDescription>
          {t('dataManagementDescription')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Button variant="outline" onClick={handleExportData} className="gap-2">
            <Download className="w-4 h-4" />
            {t('exportData')}
          </Button>
          <Button variant="outline" onClick={handleImportData} className="gap-2">
            <Upload className="w-4 h-4" />
            {t('importData')}
          </Button>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <Button variant="outline" onClick={handleRestoreBackup} className="gap-2">
            <RotateCcw className="w-4 h-4" />
            Restore Backup
          </Button>
          <Button variant="destructive" onClick={handleClearData} className="gap-2">
            <Trash2 className="w-4 h-4" />
            Clear All Data
          </Button>
        </div>
        
        <div className="mt-4 p-4 bg-muted/50 rounded-lg">
          <p className="text-sm text-muted-foreground">
            <strong>Auto-backup:</strong> Your data is automatically backed up before each save operation.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}