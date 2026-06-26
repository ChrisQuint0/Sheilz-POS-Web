"use client"

import React, { useState, useMemo, useEffect, useCallback } from "react"
import { User, Role, Status, mapProfileToUser } from "./data"
import { fetchTeamMembers, updateUser as updateUserAction, deleteUser as deleteUserAction } from "./actions"
import { TeamDesktopGrid } from "./components/team-desktop-grid"
import { TeamMobileList } from "./components/team-mobile-list"
import { UserDetailsDrawer } from "./components/user-details-drawer"
import { AddUserModal } from "./components/add-user-modal"
import { ImportUsersModal } from "./components/import-users-modal"
import { ResetPasswordModal } from "./components/reset-password-modal"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, Plus, Upload, Loader2 } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useProfile } from "@/components/profile-provider"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"

export default function TeamPage() {
  const { profile } = useProfile()
  const isAdmin = profile?.role === 'Administrator'

  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  
  // Filters
  const [searchQuery, setSearchQuery] = useState("")
  const [roleFilter, setRoleFilter] = useState<Role | "All">("All")
  const [statusFilter, setStatusFilter] = useState<Status | "All">("All")
  
  // Modals & Drawer State
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)
  const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] = useState(false)

  // Fetch users from Supabase
  const loadUsers = useCallback(async () => {
    setLoading(true)
    const result = await fetchTeamMembers()
    if (result.success && result.data) {
      setUsers(result.data.map(mapProfileToUser))
    } else {
      toast.error(result.error || 'Failed to load team members.')
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    loadUsers()
  }, [loadUsers])

  // Handlers
  const handleUserSelect = (user: User) => {
    setSelectedUser(user)
    setIsDrawerOpen(true)
  }

  const handleUpdateUser = async (updatedUser: User) => {
    const result = await updateUserAction(updatedUser.id, {
      displayName: updatedUser.displayName,
      email: updatedUser.email,
      role: updatedUser.role,
      status: updatedUser.status,
      avatarUrl: updatedUser.avatar,
    })
    if (result.success) {
      toast.success(`${updatedUser.displayName} updated successfully.`)
      await loadUsers()
      // Update the selected user in the drawer if it's the same user
      if (selectedUser?.id === updatedUser.id) {
        setSelectedUser(updatedUser)
      }
    } else {
      toast.error(result.error || 'Failed to update user.')
    }
  }

  const handleDeleteUser = async (userId: string) => {
    const result = await deleteUserAction(userId)
    if (result.success) {
      toast.success('User deleted successfully.')
      setIsDrawerOpen(false)
      setSelectedUser(null)
      await loadUsers()
    } else {
      toast.error(result.error || 'Failed to delete user.')
    }
  }

  const handleUserCreated = async () => {
    setIsAddModalOpen(false)
    await loadUsers()
  }

  const handleUsersImported = async () => {
    setIsImportModalOpen(false)
    await loadUsers()
  }

  // Filtering Logic
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesSearch = 
        user.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.role.toLowerCase().includes(searchQuery.toLowerCase())
      
      const matchesRole = roleFilter === "All" || user.role === roleFilter
      const matchesStatus = statusFilter === "All" || user.status === statusFilter

      return matchesSearch && matchesRole && matchesStatus
    })
  }, [users, searchQuery, roleFilter, statusFilter])

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-64px)] overflow-hidden bg-background">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 p-6 pb-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Team</h1>
          <p className="text-sm text-muted-foreground">Manage staff accounts, permissions, and system access.</p>
        </div>
        {isAdmin && (
          <div className="flex items-center gap-2 w-full md:w-auto">
            <Button variant="outline" className="w-full md:w-auto" onClick={() => setIsImportModalOpen(true)}>
              <Upload className="h-4 w-4 mr-2" />
              Import Users
            </Button>
            <Button className="w-full md:w-auto" onClick={() => setIsAddModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add User
            </Button>
          </div>
        )}
      </div>

      {/* Filters Toolbar */}
      <div className="px-6 pb-2">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-card p-3 rounded-lg border shadow-sm">
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search team members..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="flex items-center gap-2 w-full sm:w-auto">
          <Select value={roleFilter} onValueChange={(val) => setRoleFilter(val as any)}>
            <SelectTrigger className="w-full sm:w-[140px]">
              <SelectValue placeholder="Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Roles</SelectItem>
              <SelectItem value="Administrator">Administrator</SelectItem>
              <SelectItem value="Manager">Manager</SelectItem>
              <SelectItem value="Cashier">Cashier</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val as any)}>
            <SelectTrigger className="w-full sm:w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Status</SelectItem>
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="Inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-6 pt-2 overflow-hidden flex flex-col">
        {loading ? (
          <div className="flex-1 flex flex-col gap-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full rounded-md" />
            ))}
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center flex-1 text-center border rounded-lg border-dashed p-8">
            <h3 className="text-lg font-medium text-foreground">No team members found</h3>
            <p className="text-sm text-muted-foreground mt-1 mb-4">{isAdmin ? 'Create your first staff account to get started.' : 'No team members match your filters.'}</p>
            {isAdmin && (
              <Button onClick={() => setIsAddModalOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add User
              </Button>
            )}
          </div>
        ) : (
          <>
            {/* Desktop Grid (AG Grid) */}
            <div className="hidden lg:block flex-1 rounded-md border h-full overflow-hidden w-full relative">
              <div className="absolute inset-0">
                <TeamDesktopGrid 
                  users={filteredUsers} 
                  onRowClick={handleUserSelect}
                  onUpdateUser={handleUpdateUser}
                />
              </div>
            </div>
            
            {/* Mobile Cards List */}
            <div className="block lg:hidden flex-1 overflow-y-auto">
              <TeamMobileList 
                users={filteredUsers} 
                onCardClick={handleUserSelect} 
              />
            </div>
          </>
        )}
      </div>

      {/* Drawers & Modals */}
      <UserDetailsDrawer
        open={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
        user={selectedUser}
        onUpdateUser={handleUpdateUser}
        onDeleteUser={handleDeleteUser}
        onResetPassword={() => {
          setIsResetPasswordModalOpen(true)
        }}
      />

      <AddUserModal
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        onUserCreated={handleUserCreated}
      />

      <ImportUsersModal
        open={isImportModalOpen}
        onOpenChange={setIsImportModalOpen}
        onUsersImported={handleUsersImported}
      />

      {selectedUser && (
        <ResetPasswordModal
          open={isResetPasswordModalOpen}
          onOpenChange={setIsResetPasswordModalOpen}
          user={selectedUser}
        />
      )}
    </div>
  )
}
