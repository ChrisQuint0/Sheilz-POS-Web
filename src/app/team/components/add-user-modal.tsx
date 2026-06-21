"use client"

import React, { useState } from "react"
import { User, Role } from "../data"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Upload, Eye, EyeOff } from "lucide-react"

interface AddUserModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAdd: (user: User) => void
}

export function AddUserModal({ open, onOpenChange, onAdd }: AddUserModalProps) {
  const [displayName, setDisplayName] = useState("")
  const [email, setEmail] = useState("")
  const [role, setRole] = useState<Role>("Cashier")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  
  const handleSave = () => {
    if (!displayName || !email || !password) return
    
    const newUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      displayName,
      email,
      role,
      status: "Active",
      createdDate: new Date().toISOString()
    }
    
    onAdd(newUser)
    
    // Reset form
    setDisplayName("")
    setEmail("")
    setRole("Cashier")
    setPassword("")
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
            <div className="h-20 w-20 rounded-full border-2 border-dashed border-muted-foreground/30 flex items-center justify-center bg-muted/20 text-muted-foreground cursor-pointer hover:bg-muted/50 transition-colors">
              <Upload className="h-6 w-6" />
            </div>
            <span className="text-xs text-muted-foreground">Upload Avatar (Optional)</span>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="name">Display Name</Label>
            <Input 
              id="name" 
              placeholder="e.g. John Doe" 
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
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
            />
          </div>
          
          <div className="grid gap-2">
            <Label>Role</Label>
            <Select value={role} onValueChange={(v) => setRole(v as Role)}>
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
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave}>Create User</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
