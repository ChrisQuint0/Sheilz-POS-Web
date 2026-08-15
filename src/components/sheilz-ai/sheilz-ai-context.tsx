"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";

export type MessageRole = "user" | "ai";

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  isTyping?: boolean;
}

interface SheilzAIContextType {
  isWidgetVisible: boolean;
  isChatOpen: boolean;
  messages: Message[];
  toggleWidget: () => void;
  toggleChat: () => void;
  sendMessage: (content: string, pathname: string) => void;
  clearMessages: () => void;
}

const SheilzAIContext = createContext<SheilzAIContextType | undefined>(undefined);

export function useSheilzAI() {
  const context = useContext(SheilzAIContext);
  if (!context) {
    throw new Error("useSheilzAI must be used within a SheilzAIProvider");
  }
  return context;
}

export function SheilzAIProvider({ children }: { children: ReactNode }) {
  const [isWidgetVisible, setIsWidgetVisible] = useState(true);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);

  const toggleWidget = useCallback(() => {
    setIsWidgetVisible((prev) => {
      // If we are hiding the widget, also close the chat
      if (prev) {
        setIsChatOpen(false);
      }
      return !prev;
    });
  }, []);

  const toggleChat = useCallback(() => {
    setIsChatOpen((prev) => !prev);
  }, []);

  const sendMessage = useCallback(async (content: string, pathname: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content,
    };
    
    const typingId = (Date.now() + 1).toString();
    let historyToSend: { role: MessageRole; content: string }[] = [];

    setMessages((prev) => {
      // Gather last 5 messages + the new user message (6 total)
      historyToSend = prev
        .filter(msg => !msg.isTyping)
        .slice(-5)
        .map(msg => ({ role: msg.role, content: msg.content }));
      
      historyToSend.push({ role: "user", content });

      return [
        ...prev,
        userMessage,
        { id: typingId, role: "ai", content: "", isTyping: true },
      ];
    });

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: historyToSend,
          context: { pathname }
        })
      });

      if (res.status === 429) {
        throw new Error("RATE_LIMIT");
      }
      if (!res.ok) {
        throw new Error("API_ERROR");
      }

      const data = await res.json();
      const aiMessageContent = data.message || data.content;

      if (!aiMessageContent) {
        throw new Error("EMPTY_RESPONSE");
      }

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === typingId
            ? { ...msg, content: aiMessageContent, isTyping: false }
            : msg
        )
      );
    } catch (err: any) {
      let errorMessage = "I'm having trouble connecting to the server right now. Please check your connection and try again.";
      
      if (err.message === "RATE_LIMIT") {
        errorMessage = "I'm receiving too many requests right now. Please wait a moment and try again.";
      } else if (err.message === "EMPTY_RESPONSE") {
        errorMessage = "I couldn't process that request. Could you rephrase your question?";
      }

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === typingId
            ? { ...msg, content: errorMessage, isTyping: false }
            : msg
        )
      );
    }
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return (
    <SheilzAIContext.Provider
      value={{
        isWidgetVisible,
        isChatOpen,
        messages,
        toggleWidget,
        toggleChat,
        sendMessage,
        clearMessages,
      }}
    >
      {children}
    </SheilzAIContext.Provider>
  );
}
