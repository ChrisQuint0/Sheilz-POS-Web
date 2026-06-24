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
  LogOut,
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

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu"

import Image from "next/image"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { useProfile } from "@/components/profile-provider"

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
  const { profile, loading, signOut } = useProfile()

  // Display name and email — use profile data when available, fallback to skeleton-like defaults
  const displayName = profile?.display_name ?? "Loading..."
  const displayEmail = profile?.email ?? ""
  const displayRole = profile?.role ?? ""

  // Filter navigation items based on user role
  const role = profile?.role ?? "Cashier"
  const filteredNavItems = navItems.filter(item => {
    if (role === "Administrator") return true; // Admins see everything
    if (role === "Manager") {
      // Managers see these specific pages
      return ["Dashboard", "Sales History", "Inventory", "Team", "Analytics"].includes(item.title);
    }
    if (role === "Cashier") {
      // Cashiers only see the dashboard and sales history (for current day viewing)
      return ["Dashboard", "Sales History"].includes(item.title);
    }
    return false;
  });

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
            <div className={cn("relative aspect-square size-12 shrink-0 overflow-hidden flex items-center justify-center rounded-md", state === "collapsed" && "group-hover/logo:bg-sidebar-accent")}>
               <Image 
                 src="/sheilz_pos_logo.png" 
                 alt="Sheilz Coffee Logo" 
                 fill 
                 className="object-cover"
               />
            </div>
            <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
              <span className="truncate font-bold tracking-tight text-lg text-sidebar-foreground">Sheilz Coffee</span>
              <span className="truncate text-xs font-medium text-sidebar-foreground/60">POS System</span>
            </div>
          </div>
          
          <SidebarTrigger className="group-data-[collapsible=icon]:hidden shrink-0" />
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1.5">
              {filteredNavItems.map((item) => {
                const isActive = pathname === item.url || pathname.startsWith(item.url + "/")
                
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
            <DropdownMenu>
              <DropdownMenuTrigger render={<SidebarMenuButton size="lg" className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground hover:bg-sidebar-accent/20" />}>
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-muted text-muted-foreground shrink-0">
                    {profile?.avatar_url ? (
                      <Image
                        src={profile.avatar_url}
                        alt={displayName}
                        width={32}
                        height={32}
                        className="rounded-lg object-cover"
                      />
                    ) : (
                      <User2 className="size-4" />
                    )}
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium text-sidebar-foreground">
                      {loading ? "Loading..." : displayName}
                    </span>
                    <span className="truncate text-xs text-sidebar-foreground/70">
                      {loading ? "" : displayEmail}
                    </span>
                  </div>
                  <ChevronsUpDown className="ml-auto size-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                side="top"
                align="start"
                sideOffset={4}
              >
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="p-0 font-normal">
                    <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                      <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-muted text-muted-foreground shrink-0">
                        {profile?.avatar_url ? (
                          <Image
                            src={profile.avatar_url}
                            alt={displayName}
                            width={32}
                            height={32}
                            className="rounded-lg object-cover"
                          />
                        ) : (
                          <User2 className="size-4" />
                        )}
                      </div>
                      <div className="grid flex-1 text-left text-sm leading-tight">
                        <span className="truncate font-semibold">{displayName}</span>
                        <span className="truncate text-xs text-muted-foreground">{displayRole}</span>
                      </div>
                    </div>
                  </DropdownMenuLabel>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={signOut}
                  className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer"
                >
                  <LogOut className="mr-2 size-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
