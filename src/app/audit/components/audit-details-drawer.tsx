"use client"

import React from "react"
import { AuditLog } from "../data"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { Separator } from "@/components/ui/separator"
import { formatIpAddress, formatDevice } from "../utils"

interface AuditDetailsDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  log: AuditLog | null
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

export function AuditDetailsDrawer({ open, onOpenChange, log }: AuditDetailsDrawerProps) {
  if (!log) return null

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md flex flex-col p-0">
        <SheetHeader className="p-6 pb-0 mb-4 border-b pb-4">
          <SheetTitle>Audit Log Details</SheetTitle>
          <SheetDescription>Detailed information for the selected activity.</SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-6 pt-0 space-y-6">

          {/* Event Information */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Event Information</h3>
            <div className="p-4 border rounded-lg bg-card shadow-sm space-y-3 text-sm">
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-muted-foreground">Action</span>
                <span className="font-semibold">{log.action}</span>
              </div>
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-muted-foreground">Category</span>
                <Badge variant="secondary" className="bg-muted border-transparent">{log.category}</Badge>
              </div>
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-muted-foreground">Severity</span>
                <SeverityBadge value={log.severity} />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Timestamp</span>
                <span className="font-medium">{format(new Date(log.created_at), "MMM dd, yyyy • hh:mm a")}</span>
              </div>
            </div>
          </div>

          {/* User Information */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">User Information</h3>
            <div className="p-4 border rounded-lg bg-card shadow-sm space-y-3 text-sm">
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-muted-foreground">User Name</span>
                <span className="font-medium">{log.user_name}</span>
              </div>
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-muted-foreground">Role</span>
                <span className="font-medium">{log.user_role}</span>
              </div>
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-muted-foreground">Email</span>
                <span className="font-medium">{log.user_email}</span>
              </div>
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-muted-foreground">IP Address</span>
                <span className="font-mono text-xs">{formatIpAddress(log.ip_address)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Device</span>
                <span className="font-medium" title={log.device || undefined}>{formatDevice(log.device)}</span>
              </div>
            </div>
          </div>

          {/* Target Information */}
          {log.target_type && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Target Information</h3>
              <div className="p-4 border rounded-lg bg-card shadow-sm space-y-3 text-sm">
                <div className="flex justify-between items-center border-b pb-2">
                  <span className="text-muted-foreground">Affected Record</span>
                  <span className="font-medium">{log.target_name ?? "-"}</span>
                </div>
                <div className="flex justify-between items-center border-b pb-2">
                  <span className="text-muted-foreground">Record Type</span>
                  <span className="font-medium">{log.target_type}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Record ID</span>
                  <span className="font-mono text-xs">{log.target_id ?? "-"}</span>
                </div>
              </div>
            </div>
          )}

          {/* Change History */}
          {(log.details?.previousValue || log.details?.newValue) && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Change History</h3>
              <div className="border rounded-lg bg-card shadow-sm overflow-hidden text-sm">
                <table className="w-full text-left">
                  <thead className="bg-muted/50 text-muted-foreground">
                    <tr>
                      <th className="px-4 py-2 font-medium border-b text-xs uppercase tracking-wider w-1/3">Field</th>
                      <th className="px-4 py-2 font-medium border-b text-xs uppercase tracking-wider w-1/3">Previous Value</th>
                      <th className="px-4 py-2 font-medium border-b text-xs uppercase tracking-wider w-1/3">New Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {Array.from(
                      new Set([
                        ...(log.details.previousValue ? Object.keys(log.details.previousValue) : []),
                        ...(log.details.newValue ? Object.keys(log.details.newValue) : []),
                      ])
                    ).map((key) => {
                      const prevVal = log.details?.previousValue?.[key];
                      const newVal = log.details?.newValue?.[key];
                      const isChanged = prevVal !== newVal;
                      return (
                        <tr key={key} className="hover:bg-muted/30 transition-colors">
                          <td className="px-4 py-2.5 font-medium capitalize text-muted-foreground align-top">
                            {key.replace(/_/g, ' ')}
                          </td>
                          <td className="px-4 py-2.5 align-top">
                            {prevVal !== undefined && prevVal !== null ? (
                              <span className={isChanged ? "bg-destructive/10 text-destructive px-1.5 py-0.5 rounded font-mono text-xs break-all" : ""}>
                                {String(prevVal)}
                              </span>
                            ) : (
                              <span className="text-muted-foreground/40 italic text-xs">None</span>
                            )}
                          </td>
                          <td className="px-4 py-2.5 align-top">
                            {newVal !== undefined && newVal !== null ? (
                              <span className={isChanged ? "bg-primary/10 text-[#C2456A] px-1.5 py-0.5 rounded font-mono text-xs break-all" : ""}>
                                {String(newVal)}
                              </span>
                            ) : (
                              <span className="text-muted-foreground/40 italic text-xs">None</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Additional Metadata */}
          {log.details?.metadata && Object.keys(log.details.metadata).length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Additional Metadata</h3>
              <div className="p-4 border rounded-lg bg-card shadow-sm space-y-3 text-sm">
                {Object.entries(log.details.metadata).map(([key, value], idx, arr) => (
                  <div key={key} className={`flex justify-between items-start ${idx < arr.length - 1 ? 'border-b pb-2' : ''}`}>
                    <span className="text-muted-foreground">{key}</span>
                    <span className="font-medium text-right max-w-[60%]">{String(value)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </SheetContent>
    </Sheet>
  )
}
