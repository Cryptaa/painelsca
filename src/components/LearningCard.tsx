import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, Copy, Star, Eye, EyeOff, Link as LinkIcon } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface LearningCardProps {
  id: string;
  title: string;
  description: string;
  category: 'erro' | 'vitoria' | 'licao' | 'reflexao';
  tags?: string[];
  isFavorite: boolean;
  isPublic: boolean;
  date: string;
  linkedProjectId?: string;
  linkedIdeaId?: string;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onToggleFavorite: (id: string, isFavorite: boolean) => void;
}

const categoryConfig = {
  erro: { label: 'Erro', color: 'bg-red-500/10 text-red-500 border-red-500/20', emoji: '❌' },
  vitoria: { label: 'Vitória', color: 'bg-green-500/10 text-green-500 border-green-500/20', emoji: '🏆' },
  licao: { label: 'Lição', color: 'bg-blue-500/10 text-blue-500 border-blue-500/20', emoji: '📚' },
  reflexao: { label: 'Reflexão', color: 'bg-purple-500/10 text-purple-500 border-purple-500/20', emoji: '💭' }
};

export const LearningCard = ({
  id,
  title,
  description,
  category,
  tags,
  isFavorite,
  isPublic,
  date,
  linkedProjectId,
  linkedIdeaId,
  onEdit,
  onDelete,
  onDuplicate,
  onToggleFavorite,
}: LearningCardProps) => {
  const config = categoryConfig[category];
  const truncatedDescription = description.length > 150 
    ? description.substring(0, 150) + '...' 
    : description;

  return (
    <Card className={`group relative overflow-hidden border-primary/20 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300 ${isFavorite ? 'ring-2 ring-primary/30' : ''}`}>
      <div className="p-6 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-1">
            <span className="text-2xl">{config.emoji}</span>
            <Badge className={`${config.color} border`}>
              {config.label}
            </Badge>
            {isFavorite && (
              <Star className="h-4 w-4 fill-primary text-primary" />
            )}
          </div>
          <div className="flex items-center gap-1">
            {isPublic ? (
              <Eye className="h-4 w-4 text-muted-foreground" />
            ) : (
              <EyeOff className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
        </div>

        {/* Title */}
        <h3 className="text-xl font-bold text-foreground line-clamp-2 hover:text-primary transition-colors">
          {title}
        </h3>

        {/* Description */}
        <p className="text-sm text-muted-foreground line-clamp-3">
          {truncatedDescription}
        </p>

        {/* Tags */}
        {tags && tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {tags.slice(0, 3).map((tag, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
            {tags.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{tags.length - 3}
              </Badge>
            )}
          </div>
        )}

        {/* Links */}
        {(linkedProjectId || linkedIdeaId) && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <LinkIcon className="h-3 w-3" />
            <span>
              {linkedProjectId && "Vinculado a projeto"}
              {linkedProjectId && linkedIdeaId && " • "}
              {linkedIdeaId && "Vinculado a ideia"}
            </span>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-primary/10">
          <span className="text-xs text-muted-foreground">
            {format(new Date(date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </span>

          {/* Actions */}
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onToggleFavorite(id, !isFavorite)}
              className="h-8 w-8 p-0"
            >
              <Star className={`h-4 w-4 ${isFavorite ? 'fill-primary text-primary' : ''}`} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(id)}
              className="h-8 w-8 p-0"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDuplicate(id)}
              className="h-8 w-8 p-0"
            >
              <Copy className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(id)}
              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};