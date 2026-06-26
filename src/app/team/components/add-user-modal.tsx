"use client"

import React, { useState } from "react"
import { Role } from "../data"
import { createUser } from "../actions"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Upload, Eye, EyeOff, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { createClient } from "@/app/lib/supabase/client"

interface AddUserModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onUserCreated: () => void
}

export function AddUserModal({ open, onOpenChange, onUserCreated }: AddUserModalProps) {
  const [displayName, setDisplayName] = useState("")
  const [email, setEmail] = useState("")
  const [role, setRole] = useState<Role>("Cashier")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setAvatarFile(file)
      setAvatarPreview(URL.createObjectURL(file))
    }
  }
  
  const handleSave = async () => {
    if (!displayName || !email || !password) {
      setError("Please fill in all required fields.")
      return
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.")
      return
    }

    setError("")
    setIsSubmitting(true)

    let avatarUrl = undefined

    if (avatarFile) {
      const supabase = createClient()
      const ext = avatarFile.name.split('.').pop()
      const fileName = `avatars/${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('images')
        .upload(fileName, avatarFile)

      if (uploadError) {
        setError(`Failed to upload avatar: ${uploadError.message}`)
        setIsSubmitting(false)
        return
      }

      const { data: publicUrlData } = supabase.storage
        .from('images')
        .getPublicUrl(fileName)
        
      avatarUrl = publicUrlData.publicUrl
    }

    const result = await createUser({
      displayName,
      email,
      password,
      role,
      avatarUrl,
    })

    setIsSubmitting(false)

    if (result.success) {
      toast.success(`${displayName} has been added to the team.`)
      // Reset form
      setDisplayName("")
      setEmail("")
      setRole("Cashier")
      setPassword("")
      setAvatarFile(null)
      setAvatarPreview(null)
      onUserCreated()
    } else {
      setError(result.error || "Failed to create user.")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Team Member</DialogTitle>
          <DialogDescription>
            Create a new staff account. They will be required to change their password on first login.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="flex flex-col items-center gap-2 mb-2">
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={handleFileChange} 
              disabled={isSubmitting}
            />
            <div 
              className="relative h-20 w-20 rounded-full border-2 border-dashed border-muted-foreground/30 flex items-center justify-center bg-muted/20 text-muted-foreground cursor-pointer hover:bg-muted/50 transition-colors overflow-hidden"
              onClick={() => fileInputRef.current?.click()}
            >
              {avatarPreview ? (
                <img src={avatarPreview} alt="Preview" className="h-full w-full object-cover" />
              ) : (
                <Upload className="h-6 w-6" />
              )}
            </div>
            <span className="text-xs text-muted-foreground">Upload Avatar (Optional)</span>
            {avatarPreview && (
              <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => { setAvatarFile(null); setAvatarPreview(null); }} disabled={isSubmitting}>
                Remove
              </Button>
            )}
          </div>

          {error && (
            <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-md border border-destructive/20">
              {error}
            </div>
          )}

          <div className="grid gap-2">
            <Label htmlFor="name">Display Name</Label>
            <Input 
              id="name" 
              placeholder="e.g. John Doe" 
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              disabled={isSubmitting}
            />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input 
              id="email" 
              type="email" 
              placeholder="e.g. john@sheilz.com" 
              value={email}
              onChange={e => setEmail(e.target.value)}
              disabled={isSubmitting}
            />
          </div>
          
          <div className="grid gap-2">
            <Label>Role</Label>
            <Select value={role} onValueChange={(v) => setRole(v as Role)} disabled={isSubmitting}>
              <SelectTrigger>
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Administrator">Administrator</SelectItem>
                <SelectItem value="Manager">Manager</SelectItem>
                <SelectItem value="Cashier">Cashier</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input 
                id="password" 
                type={showPassword ? "text" : "password"} 
                placeholder="Enter password" 
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
          <Button onClick={handleSave} disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Create User
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
