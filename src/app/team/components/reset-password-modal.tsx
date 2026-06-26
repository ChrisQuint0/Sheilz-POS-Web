"use client"

import React, { useState } from "react"
import { User } from "../data"
import { resetUserPassword } from "../actions"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertTriangle, Eye, EyeOff, Loader2 } from "lucide-react"
import { toast } from "sonner"

interface ResetPasswordModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: User
}

export function ResetPasswordModal({ open, onOpenChange, user }: ResetPasswordModalProps) {
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")

  const handleReset = async () => {
    if (!password) return
    if (password.length < 6) {
      setError("Password must be at least 6 characters.")
      return
    }

    setError("")
    setIsSubmitting(true)

    const result = await resetUserPassword(user.id, password)

    setIsSubmitting(false)

    if (result.success) {
      toast.success(`Password for ${user.displayName} has been reset.`)
      onOpenChange(false)
      setPassword("")
    } else {
      setError(result.error || "Failed to reset password.")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Reset Password</DialogTitle>
          <DialogDescription>
             Set a new temporary password for {user.displayName}.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <div className="bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-400 p-3 rounded-md flex items-start gap-3 mb-4 text-sm border border-amber-200 dark:border-amber-900/50">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <p>This action will invalidate the user&apos;s current password. The user will be required to change their password on their next login.</p>
          </div>

          {error && (
            <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-md border border-destructive/20 mb-4">
              {error}
            </div>
          )}

          <div className="grid gap-2">
            <Label htmlFor="new-password">New Temporary Password</Label>
            <div className="relative">
              <Input 
                id="new-password" 
                type={showPassword ? "text" : "password"} 
                placeholder="Enter temporary password" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="pr-10"
                disabled={isSubmitting}
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>Cancel</Button>
          <Button variant="destructive" onClick={handleReset} disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Reset Password
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
