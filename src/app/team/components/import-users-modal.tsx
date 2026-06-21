"use client"

import React, { useState } from "react"
import { User } from "../data"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Upload, FileUp, Download } from "lucide-react"

interface ImportUsersModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImport: (users: User[]) => void
}

export function ImportUsersModal({ open, onOpenChange, onImport }: ImportUsersModalProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSimulatedUpload = () => {
    setIsUploading(true)
    setTimeout(() => {
      setIsUploading(false)
      setSuccess(true)
      setTimeout(() => {
        setSuccess(false)
        const mockImported: User[] = [
          {
            id: Math.random().toString(36).substr(2, 9),
            displayName: "Imported User",
            email: "imported@sheilz.com",
            role: "Cashier",
            status: "Active",
            createdDate: new Date().toISOString()
          }
        ]
        onImport(mockImported)
      }, 1000)
    }, 1500)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Import Users</DialogTitle>
          <DialogDescription>
            Upload a CSV or Excel file to batch create user accounts.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-6 flex flex-col items-center justify-center gap-4">
          <div 
            className="w-full h-32 border-2 border-dashed border-muted-foreground/30 rounded-lg flex flex-col items-center justify-center bg-muted/10 hover:bg-muted/30 transition-colors cursor-pointer"
            onClick={handleSimulatedUpload}
          >
            {isUploading ? (
              <div className="animate-pulse text-primary flex flex-col items-center">
                <Upload className="h-8 w-8 mb-2" />
                <span className="text-sm font-medium">Processing file...</span>
              </div>
            ) : success ? (
              <div className="text-green-600 flex flex-col items-center">
                <FileUp className="h-8 w-8 mb-2" />
                <span className="text-sm font-medium">Import Successful!</span>
              </div>
            ) : (
              <div className="text-muted-foreground flex flex-col items-center">
                <FileUp className="h-8 w-8 mb-2" />
                <span className="text-sm font-medium">Click to upload or drag and drop</span>
                <span className="text-xs mt-1">XLSX, CSV (Max 5MB)</span>
              </div>
            )}
          </div>
          
          {!isUploading && !success && (
            <Button variant="link" className="text-xs h-auto p-0 text-muted-foreground">
              <Download className="h-3 w-3 mr-1" />
              Download Template
            </Button>
          )}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
