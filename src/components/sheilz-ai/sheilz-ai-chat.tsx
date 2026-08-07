"use client";

import React, { useRef, useEffect, useState } from "react";
import Image from "next/image";
import { Send, User2, Bot, X } from "lucide-react";
import { useSheilzAI, Message } from "./sheilz-ai-context";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export function SheilzAIChat() {
  const { messages, sendMessage, toggleChat } = useSheilzAI();
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = () => {
    if (!inputValue.trim()) return;
    sendMessage(inputValue.trim());
    setInputValue("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const suggestedQuestions = [
    "How do I add an ingredient?",
    "How do I replenish inventory?",
    "How do I export a report?"
  ];

  return (
    <div className="fixed bottom-24 right-6 z-50 flex h-[500px] max-h-[calc(100vh-120px)] w-[380px] sm:w-[400px] flex-col overflow-hidden rounded-2xl border bg-background shadow-2xl animate-in slide-in-from-bottom-5 fade-in-0 zoom-in-95 duration-200">
      {/* Header */}
      <div className="flex items-center justify-between border-b bg-muted/30 p-4">
        <div className="flex items-center gap-3">
          <div className="relative h-10 w-10 overflow-hidden rounded-full border bg-white">
            <Image
              src="/sheilz_ai.png"
              alt="Sheilz AI Mascot"
              fill
              className="object-cover"
            />
          </div>
          <div>
            <h3 className="font-semibold leading-none tracking-tight">Sheilz AI</h3>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
              </span>
              Technical Support Assistant
            </div>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={toggleChat}>
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </Button>
      </div>

      {/* Conversation Area */}
      <div className="flex-1 overflow-y-auto p-4 scroll-smooth">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col justify-center space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Image
                src="/sheilz_ai.png"
                alt="Sheilz AI"
                width={40}
                height={40}
                className="object-cover"
              />
            </div>
            <div className="text-center space-y-2">
              <h4 className="font-semibold text-lg">Hi! I'm Sheilz AI 👋</h4>
              <p className="text-sm text-muted-foreground">
                I'm here to help you navigate and use the Sheilz POS system. Ask me how to perform a task and I'll guide you through it step by step.
              </p>
            </div>
            <div className="mt-4 flex flex-col gap-2">
              {suggestedQuestions.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => sendMessage(q)}
                  className="rounded-lg border bg-card p-3 text-sm text-left text-card-foreground shadow-sm transition-colors hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg) => (
              <ChatMessage key={msg.id} message={msg} />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="border-t bg-background p-3">
        <div className="flex items-end gap-2">
          <Textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask Sheilz AI anything..."
            className="min-h-[44px] max-h-32 resize-none rounded-xl bg-muted/50 py-3 text-sm focus-visible:ring-1"
            rows={1}
          />
          <Button
            size="icon"
            className="mb-0.5 h-10 w-10 shrink-0 rounded-full"
            disabled={!inputValue.trim()}
            onClick={handleSend}
          >
            <Send className="h-4 w-4" />
            <span className="sr-only">Send message</span>
          </Button>
        </div>
      </div>
    </div>
  );
}

function ChatMessage({ message }: { message: Message }) {
  const isUser = message.role === "user";

  return (
    <div className={cn("flex w-full gap-3", isUser ? "justify-end" : "justify-start")}>
      {!isUser && (
        <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border bg-background shadow-sm">
           <Image
              src="/sheilz_ai.png"
              alt="AI"
              width={20}
              height={20}
              className="object-cover"
            />
        </div>
      )}
      
      <div
        className={cn(
          "relative max-w-[80%] rounded-2xl px-4 py-3 text-sm shadow-sm",
          isUser
            ? "bg-primary text-primary-foreground rounded-tr-sm"
            : "bg-muted text-foreground rounded-tl-sm"
        )}
      >
        {message.isTyping ? (
          <div className="flex h-5 items-center gap-1">
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current [animation-delay:-0.3s]"></span>
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current [animation-delay:-0.15s]"></span>
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current"></span>
          </div>
        ) : (
          <div 
            className="prose prose-sm prose-p:my-1 prose-strong:text-current prose-ul:my-1 prose-ol:my-1 dark:prose-invert break-words text-current"
            dangerouslySetInnerHTML={{ __html: message.content }}
          />
        )}
      </div>
      
      {isUser && (
        <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <User2 className="h-4 w-4" />
        </div>
      )}
    </div>
  );
}
