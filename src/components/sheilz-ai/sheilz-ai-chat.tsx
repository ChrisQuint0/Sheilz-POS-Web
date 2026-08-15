"use client";

import React, { useRef, useEffect, useState } from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkBreaks from "remark-breaks";
import { Send, User2, Bot, X, Trash2 } from "lucide-react";
import { useSheilzAI, Message } from "./sheilz-ai-context";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export function SheilzAIChat() {
  const { messages, sendMessage, toggleChat, clearMessages } = useSheilzAI();
  const [inputValue, setInputValue] = useState("");
  const pathname = usePathname() || "";
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatRef = useRef<HTMLDivElement>(null);

  const isTyping =
    messages.length > 0 && !!messages[messages.length - 1].isTyping;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // If clicking inside the chat, do nothing
      if (chatRef.current && chatRef.current.contains(event.target as Node)) {
        return;
      }
      
      // If clicking the toggle button, do nothing (let the button handle it)
      const target = event.target as Element;
      if (target.closest("#sheilz-ai-toggle-button")) {
        return;
      }
      
      // Otherwise, close the chat
      toggleChat();
    };

    // Use mousedown instead of click to catch it earlier and feel more responsive
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [toggleChat]);

  const handleSend = () => {
    if (!inputValue.trim() || isTyping) return;
    sendMessage(inputValue.trim(), pathname);
    setInputValue("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const getSuggestedQuestions = () => {
    if (pathname.startsWith("/inventory")) {
      return [
        "How do I add an ingredient?",
        "How does recipe-based deduction work?",
        "How do I adjust stock?",
      ];
    }
    if (pathname.startsWith("/team")) {
      return [
        "How do I add a new cashier?",
        "What are the manager permissions?",
      ];
    }
    if (pathname.startsWith("/sales")) {
      return ["How do I view order details?", "Can I see voided transactions?"];
    }
    if (pathname.startsWith("/customers")) {
      return [
        "How do I view customer details?",
        "How do I filter active customers?",
        "How do I configure loyalty rewards?"
      ];
    }
    if (pathname.startsWith("/diagnostics")) {
      return [
        "How do I view application error logs?",
        "What do the database health metrics mean?",
        "How do I export a diagnostics report?"
      ];
    }
    return [
      "How do I view sales history?",
      "How do I manage my team?",
      "How do I check inventory?",
    ];
  };

  const suggestedQuestions = getSuggestedQuestions();

  return (
    <div ref={chatRef} className="fixed bottom-24 right-6 z-50 flex h-[500px] max-h-[calc(100vh-120px)] w-[380px] sm:w-[400px] flex-col overflow-hidden rounded-2xl border bg-background shadow-2xl animate-in slide-in-from-bottom-5 fade-in-0 zoom-in-95 duration-200">
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
            <h3 className="font-semibold leading-none tracking-tight">
              Sheilz AI
            </h3>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
              </span>
              Technical Support Assistant
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {messages.length > 0 && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              onClick={clearMessages}
              title="Clear Chat"
            >
              <Trash2 className="h-4 w-4" />
              <span className="sr-only">Clear Chat</span>
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full"
            onClick={toggleChat}
            title="Close"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </Button>
        </div>
      </div>

      {/* Conversation Area */}
      <div className="flex-1 overflow-y-auto p-4 scroll-smooth">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col justify-center space-y-4">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <div className="relative h-12 w-12 overflow-hidden rounded-full bg-white shadow-sm">
                <Image
                  src="/sheilz_ai.png"
                  alt="Sheilz AI"
                  fill
                  className="object-cover"
                />
              </div>
            </div>
            <div className="text-center space-y-2">
              <h4 className="font-semibold text-lg">Hi! I'm Sheilz AI 👋</h4>
              <p className="text-sm text-muted-foreground">
                I'm here to help you navigate and use the Sheilz POS system. Ask
                me how to perform a task and I'll guide you through it step by
                step.
              </p>
            </div>
            <div className="mt-4 flex flex-col gap-2">
              {suggestedQuestions.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => sendMessage(q, pathname)}
                  disabled={isTyping}
                  className="rounded-lg border bg-card p-3 text-sm text-left text-card-foreground shadow-sm transition-colors hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
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
            disabled={isTyping}
          />
          <Button
            size="icon"
            className="mb-0.5 h-10 w-10 shrink-0 rounded-full"
            disabled={!inputValue.trim() || isTyping}
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
    <div
      className={cn(
        "flex w-full gap-3",
        isUser ? "justify-end" : "justify-start",
      )}
    >
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
            : "bg-muted text-foreground rounded-tl-sm",
        )}
      >
        {message.isTyping ? (
          <div className="flex h-5 items-center gap-1">
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current [animation-delay:-0.3s]"></span>
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current [animation-delay:-0.15s]"></span>
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current"></span>
          </div>
        ) : (
          <div className="text-sm break-words text-current">
            <ReactMarkdown
              remarkPlugins={[remarkBreaks]}
              components={{
                p: ({node, ...props}) => <p className="mb-4 last:mb-0 leading-relaxed" {...props} />,
                ul: ({node, ...props}) => <ul className="mb-4 ml-6 list-disc space-y-1" {...props} />,
                ol: ({node, ...props}) => <ol className="mb-4 ml-6 list-decimal space-y-1" {...props} />,
                li: ({node, ...props}) => <li className="leading-relaxed" {...props} />,
                strong: ({node, ...props}) => <strong className="font-semibold" {...props} />
              }}
            >
              {message.content.replace(/\n+/g, '\n\n')}
            </ReactMarkdown>
          </div>
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
