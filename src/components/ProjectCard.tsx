import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "./StatusBadge";
import { ArrowRight, TrendingUp, TrendingDown, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ProjectCardProps {
  id: string;
  name: string;
  description?: string;
  status: 'active' | 'paused' | 'completed';
  totalInvestment: number;
  totalRevenue: number;
  profit: number;
  onDelete?: (id: string) => void;
}

export const ProjectCard = ({
  id,
  name,
  description,
  status,
  totalInvestment,
  totalRevenue,
  profit,
  onDelete
}: ProjectCardProps) => {
  const navigate = useNavigate();
  const profitPercentage = totalInvestment > 0 ? ((profit / totalInvestment) * 100).toFixed(1) : '0';

  return (
    <Card className="relative overflow-hidden border-primary/20 bg-card/50 backdrop-blur-sm transition-all hover:border-primary/40 hover:shadow-neon group">
      <div className="absolute top-0 right-0 w-40 h-40 bg-primary/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="relative p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-xl font-bold text-foreground">{name}</h3>
              <StatusBadge status={status} />
            </div>
            {description && (
              <p className="text-sm text-muted-foreground">{description}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Investimento</p>
            <p className="text-lg font-semibold text-foreground">
              R$ {totalInvestment.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Faturamento</p>
            <p className="text-lg font-semibold text-foreground">
              R$ {totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Lucro</p>
            <div className="flex items-center gap-2">
              <p className={`text-lg font-semibold ${profit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                R$ {profit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
              {profit >= 0 ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500" />
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {profitPercentage}% ROI
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={() => navigate(`/projeto/${id}`)}
            className="flex-1 bg-primary/10 border border-primary/20 text-primary hover:bg-primary/20"
            variant="outline"
          >
            Ver Projeto
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          {onDelete && (
            <Button
              onClick={() => onDelete(id)}
              variant="outline"
              size="icon"
              className="border-destructive/20 text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};
