import { Pin } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { useTranslation, type Language } from '@/utils/translations'

interface PinSettingsProps {
  pinTemplates: boolean
  onPinTemplatesChange: (enabled: boolean) => void
  language: Language
}

export function PinSettings({ pinTemplates, onPinTemplatesChange, language }: PinSettingsProps) {
  const { t } = useTranslation(language)
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Pin className="w-5 h-5" />
          {t('pinTemplate')}
        </CardTitle>
        <CardDescription>
          {t('showPinnedTemplatesFloating')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="pin-templates">{t('enableFloatingTemplates')}</Label>
            <p className="text-sm text-muted-foreground">
              {t('pinnedTemplatesFloatingWindow')}
            </p>
          </div>
          <Switch
            id="pin-templates"
            checked={pinTemplates}
            onCheckedChange={onPinTemplatesChange}
          />
        </div>
      </CardContent>
    </Card>
  )
}