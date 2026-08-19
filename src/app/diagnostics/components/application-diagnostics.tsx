import { DiagnosticCard } from "./ui/diagnostic-card";
import { AppWindow } from "lucide-react";

interface ApplicationDiagnosticsProps {
  details: Record<string, string>;
}

export function ApplicationDiagnostics({ details }: ApplicationDiagnosticsProps) {
  return (
    <DiagnosticCard
      className="!h-auto"
      title="Application Details"
      icon={<AppWindow className="w-4 h-4" />}
      description="Technical environment information"
    >
      <div className="grid grid-cols-1 gap-y-3">
        {Object.entries(details).map(([key, value]) => (
          <div
            key={key}
            className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-1 border-b border-[#C2456A]/5 last:border-0"
          >
            <span className="text-xs text-muted-foreground capitalize">
              {key.replace(/([A-Z])/g, " $1").trim()}
            </span>
            <span className="text-sm font-medium text-foreground sm:text-right">
              {value}
            </span>
          </div>
        ))}
      </div>
    </DiagnosticCard>
  );
}
