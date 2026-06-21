"use client"

import React, { useState, useMemo } from "react"
import { MOCK_USERS, User, Role, Status } from "./data"
import { TeamDesktopGrid } from "./components/team-desktop-grid"
import { TeamMobileList } from "./components/team-mobile-list"
import { UserDetailsDrawer } from "./components/user-details-drawer"
import { AddUserModal } from "./components/add-user-modal"
import { ImportUsersModal } from "./components/import-users-modal"
import { ResetPasswordModal } from "./components/reset-password-modal"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, Plus, Upload } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function TeamPage() {
  const [users, setUsers] = useState<User[]>(MOCK_USERS)
  
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

  // Handlers
  const handleUserSelect = (user: User) => {
    setSelectedUser(user)
    setIsDrawerOpen(true)
  }

  const handleUpdateUser = (updatedUser: User) => {
    setUsers(users.map(u => u.id === updatedUser.id ? updatedUser : u))
    if (selectedUser?.id === updatedUser.id) {
      setSelectedUser(updatedUser)
    }
  }

  const handleDeleteUser = (userId: string) => {
    setUsers(users.filter(u => u.id !== userId))
    setIsDrawerOpen(false)
    setSelectedUser(null)
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
        {filteredUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center flex-1 text-center border rounded-lg border-dashed p-8">
            <h3 className="text-lg font-medium text-foreground">No team members found</h3>
            <p className="text-sm text-muted-foreground mt-1 mb-4">Create your first staff account to get started.</p>
            <Button onClick={() => setIsAddModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add User
            </Button>
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
        onAdd={(newUser) => {
          setUsers([newUser, ...users])
          setIsAddModalOpen(false)
        }}
      />

      <ImportUsersModal
        open={isImportModalOpen}
        onOpenChange={setIsImportModalOpen}
        onImport={(importedUsers) => {
          setUsers([...importedUsers, ...users])
          setIsImportModalOpen(false)
        }}
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
