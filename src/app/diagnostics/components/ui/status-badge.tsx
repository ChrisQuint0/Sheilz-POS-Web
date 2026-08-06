import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Info,
  ShieldAlert,
  CheckSquare,
  XSquare,
  CloudOff,
} from "lucide-react";

export type DiagnosticStatus =
  | "Healthy"
  | "Warning"
  | "Critical"
  | "Information"
  | "Offline"
  | "Passed"
  | "Failed";

interface StatusBadgeProps {
  status: DiagnosticStatus;
  showIcon?: boolean;
}

export function StatusBadge({ status, showIcon = true }: StatusBadgeProps) {
  let icon = null;
  let styles = "";

  switch (status) {
    case "Healthy":
    case "Passed":
      icon = showIcon ? (
        status === "Passed" ? (
          <CheckSquare className="w-3.5 h-3.5 mr-1" />
        ) : (
          <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
        )
      ) : null;
      styles =
        "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100";
      break;
    case "Warning":
      icon = showIcon ? <AlertTriangle className="w-3.5 h-3.5 mr-1" /> : null;
      styles = "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100";
      break;
    case "Critical":
    case "Failed":
      icon = showIcon ? (
        status === "Failed" ? (
          <XSquare className="w-3.5 h-3.5 mr-1" />
        ) : (
          <XCircle className="w-3.5 h-3.5 mr-1" />
        )
      ) : null;
      styles = "bg-red-50 text-red-700 border-red-200 hover:bg-red-100";
      break;
    case "Information":
      icon = showIcon ? <Info className="w-3.5 h-3.5 mr-1" /> : null;
      styles = "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100";
      break;
    case "Offline":
      icon = showIcon ? <CloudOff className="w-3.5 h-3.5 mr-1" /> : null;
      styles = "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100";
      break;
    default:
      icon = showIcon ? <Info className="w-3.5 h-3.5 mr-1" /> : null;
      styles = "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100";
      break;
  }

  return (
    <Badge variant="outline" className={`font-medium ${styles}`}>
      {icon}
      {status}
    </Badge>
  );
}
