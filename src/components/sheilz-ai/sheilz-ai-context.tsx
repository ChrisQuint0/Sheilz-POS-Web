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
  sendMessage: (content: string) => void;
}

const SheilzAIContext = createContext<SheilzAIContextType | undefined>(undefined);

export function useSheilzAI() {
  const context = useContext(SheilzAIContext);
  if (!context) {
    throw new Error("useSheilzAI must be used within a SheilzAIProvider");
  }
  return context;
}

const generateMockResponse = (question: string): string => {
  const lowerQ = question.toLowerCase();

  if (lowerQ.includes("add") && (lowerQ.includes("ingredient") || lowerQ.includes("inventory"))) {
    return `To add a new ingredient, follow these steps:
<br/><br/>
**1. Go to Inventory**<br/>
Navigate to the Inventory section from the sidebar.
<br/><br/>
**2. Click 'Add Item'**<br/>
Look for the button to add a new inventory item.
<br/><br/>
**3. Fill Details**<br/>
Enter the ingredient name, category, and initial stock.
<br/><br/>
**4. Save**<br/>
Click save to add it to your inventory ledger.`;
  }

  if (lowerQ.includes("replenish") || lowerQ.includes("restock")) {
    return `You can replenish inventory from the Inventory page. Here's how:
<br/><br/>
**1. Open Inventory**<br/>
Go to the Inventory section from the sidebar.
<br/><br/>
**2. Find the ingredient**<br/>
Locate the ingredient you want to replenish.
<br/><br/>
**3. Open the inventory action**<br/>
Select the ingredient and choose the replenishment/restock option.
<br/><br/>
**4. Enter the quantity**<br/>
Enter the amount that was added to your stock.
<br/><br/>
**5. Save the update**<br/>
Review the quantity and confirm the replenishment.
<br/><br/>
The inventory quantity will then be updated accordingly.`;
  }
  
  if (lowerQ.includes("add") && lowerQ.includes("product")) {
    return `To add a new product for sale:
<br/><br/>
**1. Navigate to POS Settings**<br/>
Go to the POS Settings page via the sidebar.
<br/><br/>
**2. Select Products**<br/>
Find the products or menu management section.
<br/><br/>
**3. Create Product**<br/>
Click the 'Add Product' button. Enter the name, price, and upload an image if applicable.
<br/><br/>
**4. Save changes**<br/>
Confirm to make the product available for checkout.`;
  }

  if (lowerQ.includes("export") || lowerQ.includes("report")) {
    return `To export your data:
<br/><br/>
**1. Go to Analytics or Sales History**<br/>
Navigate to the section you want to export data from.
<br/><br/>
**2. Locate Export Options**<br/>
Look for an 'Export' button, usually near the top right of the data table or charts.
<br/><br/>
**3. Choose Format**<br/>
Select whether you want to export as CSV, Excel, or PDF.
<br/><br/>
The file will download automatically to your device.`;
  }

  return `I can help guide you through the Sheilz POS system. Try asking me how to add an ingredient, replenish inventory, manage products, or export a report.`;
};

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

  const sendMessage = useCallback((content: string) => {
    // 1. Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content,
    };
    
    setMessages((prev) => [...prev, userMessage]);

    // 2. Add typing indicator
    const typingId = (Date.now() + 1).toString();
    setMessages((prev) => [
      ...prev,
      { id: typingId, role: "ai", content: "", isTyping: true },
    ]);

    // 3. Resolve mock response after a delay
    setTimeout(() => {
      const responseContent = generateMockResponse(content);
      
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === typingId
            ? { ...msg, content: responseContent, isTyping: false }
            : msg
        )
      );
    }, 1500); // 1.5 second fake delay
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
      }}
    >
      {children}
    </SheilzAIContext.Provider>
  );
}
