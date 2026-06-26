"use client"

import React, { useState, useEffect } from "react"
import { User, ROLE_PERMISSIONS, Role, Status } from "../data"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Check, Trash2, KeyRound, Upload, Save, Loader2 } from "lucide-react"
import { format } from "date-fns"
import Image from "next/image"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createClient } from "@/app/lib/supabase/client"
import { toast } from "sonner"

interface UserDetailsDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user: User | null
  onUpdateUser: (user: User) => Promise<void>
  onDeleteUser: (userId: string) => Promise<void>
  onResetPassword: () => void
}

export function UserDetailsDrawer({
  open,
  onOpenChange,
  user,
  onUpdateUser,
  onDeleteUser,
  onResetPassword
}: UserDetailsDrawerProps) {
  const [formData, setFormData] = useState<User | null>(null)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState("")
  
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setFormData(user ? { ...user } : null)
      setAvatarFile(null)
      setAvatarPreview(null)
      setDeleteError("")
    }
  }, [user, open])

  if (!user || !formData) return null

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setAvatarFile(file)
      setAvatarPreview(URL.createObjectURL(file))
      setFormData({ ...formData, avatar: URL.createObjectURL(file) }) // temporary preview
    }
  }

  const permissions = ROLE_PERMISSIONS[formData.role] || []
  const hasChanges = JSON.stringify(formData) !== JSON.stringify(user) || avatarFile !== null

  const handleSave = async () => {
    setIsSaving(true)
    
    let avatarUrl = formData.avatar
    if (avatarFile) {
      const supabase = createClient()
      const ext = avatarFile.name.split('.').pop()
      const fileName = `avatars/${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('images')
        .upload(fileName, avatarFile)

      if (uploadError) {
        toast.error(`Failed to upload avatar: ${uploadError.message}`)
        setIsSaving(false)
        return
      }

      const { data: publicUrlData } = supabase.storage
        .from('images')
        .getPublicUrl(fileName)
        
      avatarUrl = publicUrlData.publicUrl
      setFormData({ ...formData, avatar: avatarUrl })
    }

    await onUpdateUser({ ...formData, avatar: avatarUrl })
    setIsSaving(false)
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    setDeleteError("")
    await onDeleteUser(user.id)
    setIsDeleting(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        className="w-full sm:max-w-md flex flex-col p-0"
      >
        <SheetHeader className="p-6 pb-0 mb-4">
          <SheetTitle>User Details</SheetTitle>
          <SheetDescription>View and manage settings for {user.displayName}.</SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-6 pt-0">
          <div className="space-y-6 pb-6">
            {/* Profile Section */}
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wider">Profile</h3>
              <div className="flex flex-col gap-4 p-4 border rounded-lg bg-card shadow-sm">
                <div className="flex items-center gap-4">
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*" 
                    onChange={handleFileChange} 
                    disabled={isSaving}
                  />
                  <div 
                    className="relative h-16 w-16 rounded-full overflow-hidden bg-muted flex-shrink-0 cursor-pointer group border-2 border-transparent hover:border-primary transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {avatarPreview || formData.avatar ? (
                      <img src={avatarPreview || formData.avatar || ""} alt={formData.displayName} className="h-full w-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xl font-medium text-muted-foreground bg-primary/10">
                        {formData.displayName.charAt(0)}
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                       <Upload className="h-5 w-5 text-white" />
                    </div>
                  </div>
                  <div className="flex-1 space-y-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Display Name</Label>
                      <Input 
                        value={formData.displayName} 
                        onChange={e => setFormData({...formData, displayName: e.target.value})}
                        className="h-8"
                        disabled={isSaving}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Email</Label>
                      <Input 
                        value={formData.email} 
                        onChange={e => setFormData({...formData, email: e.target.value})}
                        className="h-8"
                        disabled={isSaving}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Account Section */}
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wider">Account</h3>
              <div className="space-y-3 p-4 border rounded-lg bg-card shadow-sm text-sm">
                <div className="flex justify-between items-center pb-3 border-b">
                  <span className="text-muted-foreground">Role</span>
                  <Select value={formData.role} onValueChange={(val) => setFormData({...formData, role: val as Role})} disabled={isSaving}>
                    <SelectTrigger className="w-[140px] h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Administrator">Administrator</SelectItem>
                      <SelectItem value="Manager">Manager</SelectItem>
                      <SelectItem value="Cashier">Cashier</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-between items-center pb-3 border-b">
                  <span className="text-muted-foreground">Status</span>
                  <Select value={formData.status} onValueChange={(val) => setFormData({...formData, status: val as Status})} disabled={isSaving}>
                    <SelectTrigger className="w-[140px] h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-between items-center pb-2 border-b">
                  <span className="text-muted-foreground">Created Date</span>
                  <span className="font-medium">{format(new Date(formData.createdDate), "MMM d, yyyy")}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Last Login</span>
                  <span className="font-medium">
                    {formData.lastLogin ? format(new Date(formData.lastLogin), "MMM d, yyyy • h:mm a") : "Never"}
                  </span>
                </div>
              </div>
            </div>

            {/* Permissions Section */}
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wider">Permissions Summary</h3>
              <div className="p-4 border rounded-lg bg-card shadow-sm">
                 <p className="text-xs font-medium mb-3 text-muted-foreground">Granted by {formData.role} role:</p>
                 <ul className="space-y-2">
                   {permissions.map((perm, idx) => (
                     <li key={idx} className="flex items-start gap-2 text-sm">
                       <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                       <span>{perm}</span>
                     </li>
                   ))}
                 </ul>
              </div>
            </div>
          </div>
        </div>

        <SheetFooter className="p-6 pt-4 border-t mt-auto flex-col sm:flex-col gap-3">
           {hasChanges && (
             <Button 
               className="w-full justify-center bg-green-600 hover:bg-green-700 text-white" 
               onClick={handleSave}
               disabled={isSaving}
             >
               {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
               Save Changes
             </Button>
           )}
           <Button variant="outline" className="w-full justify-center" onClick={onResetPassword} disabled={isSaving || isDeleting}>
             <KeyRound className="mr-2 h-4 w-4" /> Reset Password
           </Button>
           
           {deleteError && (
             <div className="p-3 bg-destructive/10 text-destructive text-xs rounded-md border border-destructive/20">
               {deleteError}
             </div>
           )}
           
           <Button 
             variant="destructive" 
             className="w-full justify-center" 
             onClick={handleDelete}
             disabled={isSaving || isDeleting}
           >
             {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
             Delete User
           </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
