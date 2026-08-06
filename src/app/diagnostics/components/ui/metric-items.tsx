import { CheckCircle2, AlertTriangle, XCircle } from "lucide-react";

export function ProgressMetric({
  label,
  value,
  max,
  valueLabel,
  colorClass = "bg-[#C2456A]",
}: {
  label: string;
  value: number;
  max: number;
  valueLabel?: string;
  colorClass?: string;
}) {
  const percent = Math.min((value / max) * 100, 100);

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">{valueLabel || `${value} / ${max}`}</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
        <div
          className={`h-full flex-1 transition-all ${colorClass}`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

export function TimelineItem({
  name,
  timestamp,
}: {
  name: string;
  timestamp: string;
}) {
  return (
    <div className="flex items-start gap-3 relative before:absolute before:left-[7px] before:top-5 before:bottom-[-16px] last:before:hidden before:w-[2px] before:bg-border">
      <div className="w-4 h-4 rounded-full bg-primary/20 border-2 border-primary shrink-0 mt-0.5 z-10" />
      <div className="flex flex-col gap-0.5 pb-3">
        <span className="text-sm font-medium text-foreground leading-none">
          {name}
        </span>
        <span className="text-xs text-muted-foreground">{timestamp}</span>
      </div>
    </div>
  );
}

export function StatusMetric({
  label,
  value,
  status,
  subtitle,
}: {
  label: string;
  value: string | number;
  status: "Normal" | "Warning" | "Critical";
  subtitle?: string;
}) {
  let StatusIcon = CheckCircle2;
  let statusColor = "text-emerald-500";
  let statusBg = "bg-emerald-50 text-emerald-700 border-emerald-200";

  if (status === "Warning") {
    StatusIcon = AlertTriangle;
    statusColor = "text-amber-500";
    statusBg = "bg-amber-50 text-amber-700 border-amber-200";
  } else if (status === "Critical") {
    StatusIcon = XCircle;
    statusColor = "text-red-500";
    statusBg = "bg-red-50 text-red-700 border-red-200";
  }

  return (
    <div className="flex flex-col gap-1 p-3 rounded-lg border bg-card shadow-sm">
      <div className="flex flex-wrap justify-between items-start gap-1">
        <span className="text-xs font-medium text-muted-foreground">
          {label}
        </span>
        <div
          className={`px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider border ${statusBg}`}
        >
          {status}
        </div>
      </div>
      <div className="flex items-end gap-2">
        <span className="text-xl font-bold tracking-tight">{value}</span>
      </div>
      {subtitle && <span className="text-[10px] text-muted-foreground">{subtitle}</span>}
    </div>
  );
}
