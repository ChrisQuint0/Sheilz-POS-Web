import { Card, CardContent } from "@/components/ui/card";
import { systemHealth } from "../mock-data";
import { StatusBadge, DiagnosticStatus } from "./ui/status-badge";
import {
  Server,
  Database,
  ShieldAlert,
  HardDrive,
  RefreshCw,
  Zap,
  Clock,
} from "lucide-react";
import { ReactNode } from "react";

interface HealthCardProps {
  title: string;
  value?: string;
  status?: DiagnosticStatus;
  icon: ReactNode;
  description: string;
}

function HealthCard({
  title,
  value,
  status,
  icon,
  description,
}: HealthCardProps) {
  return (
    <Card className="shadow-sm border border-[#C2456A]/10 overflow-hidden">
      <CardContent className="p-4 flex items-center gap-4">
        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-muted-foreground truncate">
            {title}
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            {status ? (
              <StatusBadge status={status} />
            ) : (
              <span className="text-lg font-bold text-foreground">{value}</span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1 truncate">
            {description}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export function SystemHealthOverview() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <HealthCard
        title="POS Connection"
        status={systemHealth.posConnection}
        icon={<Server className="w-5 h-5" />}
        description="Terminal connectivity"
      />
      <HealthCard
        title="Database"
        status={systemHealth.database}
        icon={<Database className="w-5 h-5" />}
        description="Read/Write access"
      />
      <HealthCard
        title="Authentication"
        status={systemHealth.auth}
        icon={<ShieldAlert className="w-5 h-5" />}
        description="User session integrity"
      />
      <HealthCard
        title="Storage"
        status={systemHealth.storage}
        icon={<HardDrive className="w-5 h-5" />}
        description="Bucket availability"
      />
      <HealthCard
        title="Last Synchronization"
        value={systemHealth.lastSync}
        icon={<RefreshCw className="w-5 h-5" />}
        description="Offline data sync"
      />
      <HealthCard
        title="API Response"
        value={systemHealth.apiResponse}
        icon={<Zap className="w-5 h-5" />}
        description="Average latency"
      />
      <HealthCard
        title="Server Clock"
        value={new Date(systemHealth.serverClock).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })}
        icon={<Clock className="w-5 h-5" />}
        description="Time synchronization"
      />
    </div>
  );
}
