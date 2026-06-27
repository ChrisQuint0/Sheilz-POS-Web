import React from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface ErrorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  message: string;
}

export function ErrorModal({
  open,
  onOpenChange,
  title,
  message,
}: ErrorModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm p-0 gap-0 overflow-hidden">
        <div className="px-6 pt-6 pb-5 flex flex-col items-center text-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-rose-50 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-6 h-6 text-rose-500" />
          </div>
          <div>
            <DialogTitle className="text-[15px] font-bold text-[#3a2b27] mb-1">
              {title}
            </DialogTitle>
            <DialogDescription className="text-[13px] text-gray-400 leading-relaxed">
              {message}
            </DialogDescription>
          </div>
        </div>
        <div className="px-6 pb-5 flex justify-center">
          <Button
            onClick={() => onOpenChange(false)}
            className="h-9 px-6 bg-[#C2456A] hover:bg-[#a33858] text-white text-[13px] shadow-sm"
          >
            Got it
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
