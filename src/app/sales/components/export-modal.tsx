"use client";

import { useState, useEffect } from "react";
import { format, subDays, startOfMonth, subMonths, endOfMonth } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type DatePreset =
  | "Today"
  | "Yesterday"
  | "Last 7 Days"
  | "Last 30 Days"
  | "This Month"
  | "Last Month"
  | "Custom Range";

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (startDate: string, endDate: string, preset: string) => void;
  isLoading?: boolean;
}

export function ExportModal({ isOpen, onClose, onExport, isLoading }: ExportModalProps) {
  const [preset, setPreset] = useState<DatePreset>("Today");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [error, setError] = useState("");

  // Reset fields when opened
  useEffect(() => {
    if (isOpen) {
      setPreset("Today");
      setCustomStart("");
      setCustomEnd("");
      setError("");
    }
  }, [isOpen]);

  // Validate custom dates
  useEffect(() => {
    if (preset === "Custom Range") {
      if (!customStart || !customEnd) {
        setError("Both Start Date and End Date are required.");
      } else if (new Date(customEnd) < new Date(customStart)) {
        setError("End Date cannot be earlier than Start Date.");
      } else {
        setError("");
      }
    } else {
      setError("");
    }
  }, [preset, customStart, customEnd]);

  const handleExportClick = () => {
    let startDate = "";
    let endDate = "";
    const today = new Date();

    switch (preset) {
      case "Today":
        startDate = format(today, "yyyy-MM-dd");
        endDate = format(today, "yyyy-MM-dd");
        break;
      case "Yesterday":
        const yesterday = subDays(today, 1);
        startDate = format(yesterday, "yyyy-MM-dd");
        endDate = format(yesterday, "yyyy-MM-dd");
        break;
      case "Last 7 Days":
        startDate = format(subDays(today, 6), "yyyy-MM-dd"); // 6 days ago + today = 7 days
        endDate = format(today, "yyyy-MM-dd");
        break;
      case "Last 30 Days":
        startDate = format(subDays(today, 29), "yyyy-MM-dd");
        endDate = format(today, "yyyy-MM-dd");
        break;
      case "This Month":
        startDate = format(startOfMonth(today), "yyyy-MM-dd");
        endDate = format(today, "yyyy-MM-dd"); // Or end of month depending on preference, but today prevents future dates
        break;
      case "Last Month":
        const lastMonth = subMonths(today, 1);
        startDate = format(startOfMonth(lastMonth), "yyyy-MM-dd");
        endDate = format(endOfMonth(lastMonth), "yyyy-MM-dd");
        break;
      case "Custom Range":
        startDate = customStart;
        endDate = customEnd;
        break;
    }

    if (!error) {
      onExport(startDate, endDate, preset);
    }
  };

  const isExportDisabled = isLoading || (preset === "Custom Range" && !!error) || (preset === "Custom Range" && (!customStart || !customEnd));

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Export Sales History</DialogTitle>
          <DialogDescription>
            Select a date range to export your transaction records.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="date-preset">Date Range</Label>
            <Select
              value={preset}
              onValueChange={(val) => setPreset(val as DatePreset)}
            >
              <SelectTrigger id="date-preset">
                <SelectValue placeholder="Select date range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Today">Today</SelectItem>
                <SelectItem value="Yesterday">Yesterday</SelectItem>
                <SelectItem value="Last 7 Days">Last 7 Days</SelectItem>
                <SelectItem value="Last 30 Days">Last 30 Days</SelectItem>
                <SelectItem value="This Month">This Month</SelectItem>
                <SelectItem value="Last Month">Last Month</SelectItem>
                <SelectItem value="Custom Range">Custom Range</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {preset === "Custom Range" && (
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="start-date">Start Date</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  max={customEnd || undefined}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="end-date">End Date</Label>
                <Input
                  id="end-date"
                  type="date"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  min={customStart || undefined}
                />
              </div>
            </div>
          )}

          {error && (
            <div className="text-sm font-medium text-destructive mt-1">
              {error}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleExportClick} disabled={isExportDisabled}>
            {isLoading ? "Exporting..." : "Export"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
