"use client";

import React from "react";
import Image from "next/image";
import { X } from "lucide-react";
import { useSheilzAI } from "./sheilz-ai-context";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export function SheilzAIButton() {
  const { isChatOpen, toggleChat } = useSheilzAI();

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-center gap-2">
      <Tooltip>
        <TooltipTrigger
          id="sheilz-ai-toggle-button"
          onClick={toggleChat}
          className={cn(
            "relative flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
            isChatOpen ? "bg-muted" : ""
          )}
          aria-label={isChatOpen ? "Close Sheilz AI" : "Ask Sheilz AI"}
        >
          {isChatOpen ? (
            <X className="h-6 w-6 text-foreground" />
          ) : (
            <div className="relative h-12 w-12 overflow-hidden rounded-full">
              <Image
                src="/sheilz_ai.png"
                alt="Sheilz AI Mascot"
                fill
                className="object-cover"
              />
            </div>
          )}
          
          {/* Notification badge / dot could go here if needed in the future */}
          {!isChatOpen && (
            <span className="absolute right-0 top-0 flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex h-3 w-3 rounded-full bg-primary"></span>
            </span>
          )}
        </TooltipTrigger>
        {!isChatOpen && (
          <TooltipContent side="left" hideArrow className="font-medium bg-primary text-primary-foreground border-none shadow-md">
            Ask Sheilz AI
          </TooltipContent>
        )}
      </Tooltip>
    </div>
  );
}
