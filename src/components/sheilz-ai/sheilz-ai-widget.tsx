"use client";

import React from "react";
import { useSheilzAI } from "./sheilz-ai-context";
import { SheilzAIButton } from "./sheilz-ai-button";
import { SheilzAIChat } from "./sheilz-ai-chat";

export function SheilzAIWidget() {
  const { isWidgetVisible, isChatOpen } = useSheilzAI();

  if (!isWidgetVisible) {
    return null;
  }

  return (
    <>
      {isChatOpen && <SheilzAIChat />}
      <SheilzAIButton />
    </>
  );
}
