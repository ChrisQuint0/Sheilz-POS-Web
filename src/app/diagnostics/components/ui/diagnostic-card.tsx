import { ReactNode } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface DiagnosticCardProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  children: ReactNode;
  action?: ReactNode;
  className?: string;
}

export function DiagnosticCard({
  title,
  description,
  icon,
  children,
  action,
  className = "",
}: DiagnosticCardProps) {
  return (
    <Card
      className={`shadow-sm border border-[#C2456A]/10 h-full flex flex-col pt-0 gap-0 ${className}`}
    >
      <CardHeader className="pt-4 pb-3 bg-muted/20 border-b border-[#C2456A]/5 flex flex-row items-start justify-between">
        <div className="flex flex-col gap-1">
          <CardTitle className="text-sm font-semibold text-foreground flex items-center gap-2">
            {icon && <span className="text-muted-foreground">{icon}</span>}
            {title}
          </CardTitle>
          {description && (
            <CardDescription className="text-xs">{description}</CardDescription>
          )}
        </div>
        {action && <div>{action}</div>}
      </CardHeader>
      <CardContent className="pt-4 flex-1 flex flex-col">{children}</CardContent>
    </Card>
  );
}
