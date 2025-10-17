import { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";

interface DashboardCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  trend?: string;
  valueClassName?: string;
}

export const DashboardCard = ({ title, value, icon: Icon, trend, valueClassName }: DashboardCardProps) => {
  return (
    <Card className="relative overflow-hidden border-primary/20 bg-card/50 backdrop-blur-sm transition-all hover:border-primary/40 hover:shadow-neon">
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl" />
      <div className="relative p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
            <Icon className="h-6 w-6 text-primary" />
          </div>
          {trend && (
            <span className="text-sm text-muted-foreground">{trend}</span>
          )}
        </div>
        <h3 className="text-sm font-medium text-muted-foreground mb-1">{title}</h3>
        <p className={`text-3xl font-bold ${valueClassName || 'text-foreground'}`}>{value}</p>
      </div>
    </Card>
  );
};
