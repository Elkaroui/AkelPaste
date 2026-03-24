import './assets/main.css'

import { createRoot } from 'react-dom/client'

import App from './App'
import { FloatingTemplates } from '@/components/FloatingTemplates/FloatingTemplates'
import { Toaster } from '@/components/ui/sonner'
import { installDesktopBridge, isFloatingTemplatesWindow } from '@/lib/desktopBridge'

async function bootstrap() {
  await installDesktopBridge()

  const root = createRoot(document.getElementById('root')!)
  const isFloatingWindow = isFloatingTemplatesWindow()
  const screen = isFloatingWindow ? <FloatingTemplates /> : <App />

  if (isFloatingWindow) {
    document.documentElement.style.background = 'transparent'
    document.body.style.background = 'transparent'
    document.body.style.overflow = 'hidden'
  }

  root.render(
    <>
      {screen}
      {!isFloatingWindow && <Toaster />}
    </>
  )
}

bootstrap()
