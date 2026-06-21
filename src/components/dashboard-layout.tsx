"use client"

import * as React from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar"

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <main className="flex flex-1 flex-col p-4 lg:p-8">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
