import { DiagnosticCard } from "./ui/diagnostic-card";
import { warningCenter } from "../mock-data";
import { AlertTriangle } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

export function WarningCenter() {
  return (
    <DiagnosticCard
      title="Warning Center"
      icon={<AlertTriangle className="w-4 h-4 text-amber-500" />}
      description="Active informational warnings requiring attention"
    >
      <ScrollArea className="h-[375px] pr-4">
        {warningCenter.length === 0 ? (
          <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
            No warnings detected.
          </div>
        ) : (
          <div className="space-y-3">
            {warningCenter.map((warning, index) => (
              <div
                key={index}
                className="flex items-start gap-3 p-3 bg-amber-50/50 border border-amber-100 rounded-lg text-amber-800 text-sm"
              >
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <p>{warning}</p>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </DiagnosticCard>
  );
}
