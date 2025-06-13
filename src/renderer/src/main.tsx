import './assets/main.css'


import { createRoot } from 'react-dom/client'
import { Toaster } from '@/components/ui/sonner'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <>
    <App />
    <Toaster />
  </>
)
