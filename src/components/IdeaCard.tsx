import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, Star, TrendingUp } from "lucide-react";
import { Idea } from "@/pages/Ideas";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface IdeaCardProps {
  idea: Idea;
  onEdit: (idea: Idea) => void;
  onDelete: (id: string) => void;
}

export const IdeaCard = ({ idea, onEdit, onDelete }: IdeaCardProps) => {
  const statusColors = {
    draft: "bg-gray-500",
    developing: "bg-blue-500",
    ready: "bg-green-500",
    converted: "bg-purple-500",
  };

  const statusLabels = {
    draft: "Rascunho",
    developing: "Desenvolvimento",
    ready: "Pronto",
    converted: "Convertida",
  };

  const profitColors = {
    low: "text-yellow-600",
    medium: "text-orange-500",
    high: "text-green-600",
  };

  const profitLabels = {
    low: "Baixo",
    medium: "Médio",
    high: "Alto",
  };

  return (
    <Card className="hover:shadow-lg transition-all duration-300 group">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
                {idea.title}
              </h3>
              {idea.is_favorite && (
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              )}
            </div>
            {idea.description && (
              <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                {idea.description}
              </p>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Badge className={statusColors[idea.status as keyof typeof statusColors]}>
              {statusLabels[idea.status as keyof typeof statusLabels]}
            </Badge>
            {idea.category && (
              <Badge variant="outline">{idea.category}</Badge>
            )}
          </div>

          <div className="flex items-center gap-2 text-sm">
            <TrendingUp className={`h-4 w-4 ${profitColors[idea.profit_potential as keyof typeof profitColors]}`} />
            <span className={profitColors[idea.profit_potential as keyof typeof profitColors]}>
              Potencial {profitLabels[idea.profit_potential as keyof typeof profitLabels]}
            </span>
          </div>

          {idea.tags && idea.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {idea.tags.slice(0, 3).map((tag, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {idea.tags.length > 3 && (
                <Badge variant="secondary" className="text-xs">
                  +{idea.tags.length - 3}
                </Badge>
              )}
            </div>
          )}

          <div className="relative pt-2">
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>Progresso</span>
              <span>{idea.progress}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-primary rounded-full h-2 transition-all"
                style={{ width: `${idea.progress}%` }}
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t">
            <span className="text-xs text-muted-foreground">
              {format(new Date(idea.created_at), "dd/MM/yyyy", { locale: ptBR })}
            </span>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onEdit(idea)}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  if (confirm("Tem certeza que deseja excluir esta ideia?")) {
                    onDelete(idea.id);
                  }
                }}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};