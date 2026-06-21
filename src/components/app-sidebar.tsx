"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Settings2,
  ReceiptText,
  Package,
  Users,
  ClipboardList,
  BarChart3,
  User2,
  ChevronsUpDown,
  PanelRight,
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupContent,
  useSidebar,
  SidebarTrigger,
} from "@/components/ui/sidebar"

import Image from "next/image"
import Link from "next/link"
import { cn } from "@/lib/utils"

const navItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "POS Settings",
    url: "/pos-settings",
    icon: Settings2,
  },
  {
    title: "Sales History",
    url: "/sales",
    icon: ReceiptText,
  },
  {
    title: "Inventory",
    url: "/inventory",
    icon: Package,
  },
  {
    title: "Team",
    url: "/team",
    icon: Users,
  },
  {
    title: "Audit Logs",
    url: "/audit",
    icon: ClipboardList,
  },
  {
    title: "Analytics",
    url: "/analytics",
    icon: BarChart3,
  },
]

export function AppSidebar() {
  const { toggleSidebar, state } = useSidebar()
  const pathname = usePathname()

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border bg-sidebar shadow-sm">
      <SidebarHeader className="h-16 flex items-center justify-center border-b border-sidebar-border px-2">
        <div className="flex items-center w-full justify-between">
          <div 
            className="flex items-center gap-2 cursor-pointer w-full group-data-[collapsible=icon]:justify-center group/logo"
            onClick={() => {
               if (state === "collapsed") toggleSidebar()
            }}
          >
            <div className={cn("relative aspect-square size-8 shrink-0 overflow-hidden flex items-center justify-center rounded-md", state === "collapsed" && "group-hover/logo:bg-sidebar-accent")}>
               <Image 
                 src="/sheilz_pos_logo.png" 
                 alt="Sheilz Coffee Logo" 
                 fill 
                 className={cn("object-contain transition-opacity", state === "collapsed" && "group-hover/logo:opacity-0")} 
               />
               {state === "collapsed" && (
                 <PanelRight className="absolute size-5 opacity-0 transition-opacity group-hover/logo:opacity-100 text-sidebar-foreground" />
               )}
            </div>
            <div className="flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
              <span className="truncate font-sans font-semibold text-lg text-foreground tracking-tight">Sheilz Coffee</span>
            </div>
          </div>
          <SidebarTrigger className="group-data-[collapsible=icon]:hidden ml-auto" />
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="gap-2 mt-2">
              {navItems.map((item) => {
                const isActive = pathname === item.url || (item.url !== "/" && pathname.startsWith(item.url))
                
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton 
                      tooltip={item.title} 
                      isActive={isActive}
                      className={isActive ? "bg-sidebar-accent/40 text-primary font-medium" : "text-sidebar-foreground/80 hover:bg-sidebar-accent/20"}
                      render={<Link href={item.url} />}
                    >
                      <item.icon className="h-[18px] w-[18px]" />
                      <span className="text-[14px]">{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground hover:bg-sidebar-accent/20">
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-muted text-muted-foreground shrink-0">
                <User2 className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium text-sidebar-foreground">Admin User</span>
                <span className="truncate text-xs text-sidebar-foreground/70">admin@sheilz.com</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
