// import React from 'react'
import { Language, useTranslation, supportedLanguages } from '../../utils/translations'

export type { Language }
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'


interface LanguageSelectorProps {
  language: Language
  onLanguageChange: (language: Language) => void
}

export function LanguageSelector({ language, onLanguageChange }: LanguageSelectorProps) {
  const { t } = useTranslation(language)

  return (

    <Card>
      <CardHeader>
        <CardTitle>{t('language')}</CardTitle>
      </CardHeader>
      <CardContent>
      <RadioGroup
        value={language}
        onValueChange={(value) => onLanguageChange(value as Language)}
        className="space-y-2"
      >
        {supportedLanguages.map((lang) => (
          <div key={lang.code} className="flex items-center gap-3 cursor-pointer">
            <RadioGroupItem value={lang.code} id={`lang-${lang.code}`} />
            <Label htmlFor={`lang-${lang.code}`} className="text-sm text-gray-700 dark:text-gray-300">
              {lang.nativeName}
            </Label>
          </div>
        ))}
      </RadioGroup>
      </CardContent>
    </Card>


  )
}