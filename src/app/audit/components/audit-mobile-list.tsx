"use client"

import React from "react"
import { format } from "date-fns"
import { AuditLog } from "../data"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface AuditMobileListProps {
  logs: AuditLog[]
  onCardClick: (log: AuditLog) => void
}

const SeverityBadge = ({ value }: { value: string }) => {
  switch (value) {
    case "Critical":
      return <Badge variant="destructive">{value}</Badge>
    case "High":
      return <Badge variant="default">{value}</Badge>
    case "Medium":
      return <Badge variant="secondary">{value}</Badge>
    case "Low":
    default:
      return <Badge variant="outline">{value}</Badge>
  }
}

export function AuditMobileList({ logs, onCardClick }: AuditMobileListProps) {
  return (
    <div className="flex flex-col gap-4 p-4 pb-20">
      {logs.map((log) => (
        <Card 
          key={log.id} 
          className="cursor-pointer hover:border-ring transition-colors"
          onClick={() => onCardClick(log)}
        >
          <CardContent className="p-4 flex flex-col gap-3">
            <div className="flex justify-between items-start">
              <div className="font-semibold text-lg">{log.action}</div>
              <SeverityBadge value={log.severity} />
            </div>
            
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex flex-col">
                <span className="text-muted-foreground text-xs">By</span>
                <span className="font-medium">{log.user.name}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-muted-foreground text-xs">Date</span>
                <span className="font-medium">{format(new Date(log.timestamp), "MMM dd, yyyy • hh:mm a")}</span>
              </div>
              <div className="flex flex-col col-span-2">
                <span className="text-muted-foreground text-xs">Category</span>
                <span className="font-medium">{log.category}</span>
              </div>
            </div>
            
            <div className="mt-2 pt-3 border-t border-border/50 text-center text-xs text-primary font-medium uppercase tracking-wider">
              Tap to View Details
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
