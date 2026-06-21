"use client"

import React from "react"
import { User } from "../data"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import Image from "next/image"

interface TeamMobileListProps {
  users: User[]
  onCardClick: (user: User) => void
}

export function TeamMobileList({ users, onCardClick }: TeamMobileListProps) {
  return (
    <div className="flex flex-col gap-3 pb-8">
      {users.map((user) => (
        <Card 
          key={user.id} 
          className="cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => onCardClick(user)}
        >
          <CardContent className="p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative h-10 w-10 rounded-full overflow-hidden bg-muted flex-shrink-0">
                  {user.avatar ? (
                    <Image src={user.avatar} alt={user.displayName} fill sizes="40px" className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-sm font-medium text-muted-foreground bg-primary/10">
                      {user.displayName.charAt(0)}
                    </div>
                  )}
                </div>
                <div>
                  <h4 className="font-semibold text-sm">{user.displayName}</h4>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
              </div>
              <Badge variant={user.status === "Active" ? "default" : "secondary"}>
                {user.status}
              </Badge>
            </div>
            
            <div className="grid grid-cols-2 gap-2 text-xs border-t pt-3 mt-1">
              <div>
                <span className="text-muted-foreground block mb-1">Role</span>
                <span className="font-medium">{user.role}</span>
              </div>
              <div>
                <span className="text-muted-foreground block mb-1">Last Login</span>
                <span className="font-medium">
                  {user.lastLogin ? format(new Date(user.lastLogin), "MMM d, yyyy • h:mm a") : "Never"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
