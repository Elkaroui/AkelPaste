"use client"

import * as React from "react"
import {
  SquareTerminal,
  PenTool,
  Settings,
  Citrus,
  // Pin
} from "lucide-react"
import { useTranslation, type Language } from '@/utils/translations'

import {
  Sidebar,
  SidebarContent,
  // SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
} from "@/components/ui/sidebar"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import avatarImage from '@/assets/me.jpg'

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  activeTab: 'home' | 'editor' | 'settings'
  onTabChange: (tab: 'home' | 'editor' | 'settings') => void
  language: Language
}

const data = {
  navMain: [
    {
      title: "Home",
      url: "#",
      icon: SquareTerminal,
      key: "home" as const,
    },
    {
      title: "Template Editor",
      url: "#",
      icon: PenTool,
      key: "editor" as const,
    },
  ],
  navSecondary: [
    {
      title: "Settings",
      url: "#",
      icon: Settings,
      key: "settings" as const,
    },
  ],

}

export function AppSidebar({ activeTab, onTabChange, language, ...props }: AppSidebarProps) {
  const { t } = useTranslation(language)
  const [isSignatureModalOpen, setIsSignatureModalOpen] = React.useState(false)

  const handleSignatureClick = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsSignatureModalOpen(true)
  }

  return (
    <>
    <Sidebar variant="inset" collapsible="icon"  {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              asChild
              className="data-[slot=sidebar-menu-button]:!cursor-pointer"
            >
              <a href="#" onClick={handleSignatureClick}>
                <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                  <Citrus className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">AkelPaste</span>
                  <span className="truncate text-xs">A simple pastebin</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      
      <SidebarContent>
        {/* Main Navigation */}
        <SidebarGroup>
        <SidebarMenu>
          {data.navMain.map((item) => {
            const Icon = item.icon
            const title = item.key === 'home' ? t('home') : t('templateEditor')
            return (
              <SidebarMenuItem key={item.key}>
                <SidebarMenuButton
                  onClick={() => onTabChange(item.key)}
                  isActive={activeTab === item.key}
                  className="cursor-pointer"
                >
                  <Icon />
                  {title}
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
        </SidebarGroup>


        {/* Secondary Navigation */}
        <SidebarGroup className="mt-auto"> 
        {/* <SidebarGroupLabel>Settings</SidebarGroupLabel> */}
        <SidebarMenu >
          {data.navSecondary.map((item) => {
            const Icon = item.icon
            return (
              <SidebarMenuItem key={item.key}>
                <SidebarMenuButton
                  onClick={() => onTabChange(item.key)}
                  isActive={activeTab === item.key}
                  className="cursor-pointer"
                >
                  <Icon />
                  {t('settings')}
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      
      {/* <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton className="w-full justify-start" disabled>
              <Pin className="mr-2 h-4 w-4" />
              <span className="text-xs text-muted-foreground">v1.0.0</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter> */}
    </Sidebar>
    
    {/* Signature Modal */}
    <Dialog open={isSignatureModalOpen} onOpenChange={setIsSignatureModalOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('aboutAkelPaste')}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center space-y-4 py-4">
          <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-orange-400">
            <img 
              src={avatarImage} 
              alt="Zack's Avatar" 
              className="w-full h-full object-cover"
            />
          </div>
          <div className="text-center space-y-2">
            <h3 className="text-lg font-semibold">{t('createdByZack')}</h3>
            <p className="text-sm text-muted-foreground max-w-xs">
              {t('akelPasteDescription')}
            </p>
            <div className="pt-2">
              <p className="text-xs text-muted-foreground">
                {t('madeWithLove')}
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
    </>
  )
}