"use client"

import React, { useState, useRef } from "react"
import { Role } from "../data"
import { importUsers } from "../actions"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Upload, FileUp, Download, Loader2, CheckCircle2, XCircle } from "lucide-react"
import { toast } from "sonner"

interface ImportUsersModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onUsersImported: () => void
}

interface ParsedRow {
  displayName: string
  email: string
  password: string
  role: Role
}

const VALID_ROLES: Role[] = ["Administrator", "Manager", "Cashier"]

function parseCSV(text: string): { rows: ParsedRow[]; errors: string[] } {
  const lines = text.trim().split(/\r?\n/)
  if (lines.length < 2) {
    return { rows: [], errors: ["CSV file must have a header row and at least one data row."] }
  }

  // Parse header
  const header = lines[0].split(",").map(h => h.trim().toLowerCase().replace(/['"]/g, ""))
  const nameIdx = header.findIndex(h => h === "display_name" || h === "displayname" || h === "name")
  const emailIdx = header.findIndex(h => h === "email")
  const passwordIdx = header.findIndex(h => h === "password")
  const roleIdx = header.findIndex(h => h === "role")

  const missing: string[] = []
  if (nameIdx === -1) missing.push("display_name")
  if (emailIdx === -1) missing.push("email")
  if (passwordIdx === -1) missing.push("password")
  if (roleIdx === -1) missing.push("role")

  if (missing.length > 0) {
    return { rows: [], errors: [`Missing required columns: ${missing.join(", ")}`] }
  }

  const rows: ParsedRow[] = []
  const errors: string[] = []

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue
    const cols = line.split(",").map(c => c.trim().replace(/^['"]|['"]$/g, ""))
    
    const name = cols[nameIdx]
    const email = cols[emailIdx]
    const password = cols[passwordIdx]
    const role = cols[roleIdx] as Role

    if (!name || !email || !password) {
      errors.push(`Row ${i + 1}: Missing required fields.`)
      continue
    }

    if (!VALID_ROLES.includes(role)) {
      errors.push(`Row ${i + 1}: Invalid role "${role}". Must be Administrator, Manager, or Cashier.`)
      continue
    }

    rows.push({ displayName: name, email, password, role })
  }

  return { rows, errors }
}

export function ImportUsersModal({ open, onOpenChange, onUsersImported }: ImportUsersModalProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [result, setResult] = useState<{ created: number; failed: { email: string; error: string }[] } | null>(null)
  const [parseErrors, setParseErrors] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const resetState = () => {
    setIsUploading(false)
    setResult(null)
    setParseErrors([])
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Reset for new upload
    setResult(null)
    setParseErrors([])

    const text = await file.text()
    const { rows, errors } = parseCSV(text)

    if (errors.length > 0) {
      setParseErrors(errors)
      return
    }

    if (rows.length === 0) {
      setParseErrors(["No valid rows found in the CSV file."])
      return
    }

    setIsUploading(true)
    const importResult = await importUsers(rows)
    setIsUploading(false)

    if (importResult.success && importResult.data) {
      setResult(importResult.data)
      if (importResult.data.created > 0) {
        toast.success(`${importResult.data.created} user(s) imported successfully.`)
        onUsersImported()
      }
    } else {
      toast.error(importResult.error || "Import failed.")
    }

    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const downloadTemplate = () => {
    const csv = "display_name,email,password,role\nJohn Doe,john@example.com,temp1234,Cashier\nJane Smith,jane@example.com,temp5678,Manager"
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "import_users_template.csv"
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) resetState() }}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Import Users</DialogTitle>
          <DialogDescription>
            Upload a CSV file to batch create user accounts.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-6 flex flex-col items-center justify-center gap-4">
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={handleFileSelect}
          />

          <div 
            className="w-full h-32 border-2 border-dashed border-muted-foreground/30 rounded-lg flex flex-col items-center justify-center bg-muted/10 hover:bg-muted/30 transition-colors cursor-pointer"
            onClick={() => !isUploading && fileInputRef.current?.click()}
          >
            {isUploading ? (
              <div className="animate-pulse text-primary flex flex-col items-center">
                <Loader2 className="h-8 w-8 mb-2 animate-spin" />
                <span className="text-sm font-medium">Creating accounts...</span>
              </div>
            ) : result ? (
              <div className="text-green-600 flex flex-col items-center">
                <CheckCircle2 className="h-8 w-8 mb-2" />
                <span className="text-sm font-medium">{result.created} user(s) created</span>
                {result.failed.length > 0 && (
                  <span className="text-xs text-destructive mt-1">{result.failed.length} failed</span>
                )}
              </div>
            ) : (
              <div className="text-muted-foreground flex flex-col items-center">
                <FileUp className="h-8 w-8 mb-2" />
                <span className="text-sm font-medium">Click to upload CSV</span>
                <span className="text-xs mt-1">CSV file with columns: display_name, email, password, role</span>
              </div>
            )}
          </div>

          {/* Parse errors */}
          {parseErrors.length > 0 && (
            <div className="w-full p-3 bg-destructive/10 rounded-md border border-destructive/20">
              <p className="text-sm font-medium text-destructive mb-1">CSV Errors:</p>
              <ul className="text-xs text-destructive space-y-1">
                {parseErrors.map((err, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <XCircle className="h-3 w-3 shrink-0 mt-0.5" />
                    {err}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Server-side failures */}
          {result && result.failed.length > 0 && (
            <div className="w-full p-3 bg-amber-50 dark:bg-amber-900/20 rounded-md border border-amber-200 dark:border-amber-900/50">
              <p className="text-sm font-medium text-amber-800 dark:text-amber-400 mb-1">Failed Imports:</p>
              <ul className="text-xs text-amber-800 dark:text-amber-400 space-y-1">
                {result.failed.map((f, i) => (
                  <li key={i}><strong>{f.email}</strong>: {f.error}</li>
                ))}
              </ul>
            </div>
          )}
          
          {!isUploading && !result && (
            <Button variant="link" className="text-xs h-auto p-0 text-muted-foreground" onClick={downloadTemplate}>
              <Download className="h-3 w-3 mr-1" />
              Download Template
            </Button>
          )}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => { onOpenChange(false); resetState() }}>
            {result ? "Done" : "Cancel"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
