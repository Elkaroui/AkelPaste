import { Monitor, Sun, Moon } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { THEME_OPTIONS } from '@/utils/constants'
import { useTranslation, Language } from '@/utils/translations'

type Theme = 'system' | 'light' | 'dark'

interface ThemeSelectorProps {
  theme: Theme
  onThemeChange: (theme: Theme) => void
  language: Language
}

export function ThemeSelector({ theme, onThemeChange, language }: ThemeSelectorProps) {
  const { t } = useTranslation(language)
  const themeOptions = THEME_OPTIONS.map(option => ({
    ...option,
    label: t(option.value as keyof typeof t),
    description: t(`${option.value}Description` as keyof typeof t),
    icon: option.value === 'system' ? Monitor : option.value === 'light' ? Sun : Moon
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('appearance')}</CardTitle>
        <CardDescription>
          {t('appearanceDescription')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <RadioGroup
          value={theme}
          onValueChange={(value) => onThemeChange(value as Theme)}
          className="grid grid-cols-3 gap-4"
        >
          {themeOptions.map((option) => {
            const Icon = option.icon
            return (
              <div key={option.value}>
                <RadioGroupItem
                  value={option.value}
                  id={option.value}
                  className="peer sr-only"
                />
                <Label
                  htmlFor={option.value}
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                >
                  <Icon className="mb-3 h-6 w-6" />
                  <div className="text-center">
                    <div className="font-medium">{option.label}</div>
                    <div className="text-xs text-muted-foreground">{option.description}</div>
                  </div>
                </Label>
              </div>
            )
          })}
        </RadioGroup>
      </CardContent>
    </Card>
  )
}