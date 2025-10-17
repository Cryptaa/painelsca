import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Pin, Calendar, Trash2, Copy } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface PersonalNoteCardProps {
  id: string;
  title: string;
  content: string;
  tags?: string[];
  isPinned: boolean;
  reminderDate?: string;
  createdAt: string;
  updatedAt: string;
  linkedProjectId?: string;
  linkedIdeaId?: string;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onTogglePin: (id: string, isPinned: boolean) => void;
}

export const PersonalNoteCard = ({
  id,
  title,
  content,
  tags = [],
  isPinned,
  reminderDate,
  createdAt,
  updatedAt,
  onEdit,
  onDelete,
  onDuplicate,
  onTogglePin,
}: PersonalNoteCardProps) => {
  const getPreview = (text: string) => {
    const lines = text.split('\n').filter(line => line.trim());
    return lines.slice(0, 2).join(' ').substring(0, 150) + (text.length > 150 ? '...' : '');
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Card 
            className={`relative overflow-hidden border-primary/20 bg-card/50 backdrop-blur-sm transition-all hover:border-primary/40 hover:shadow-neon group cursor-pointer ${
              isPinned ? 'border-primary/60 bg-primary/5' : ''
            }`}
            onClick={() => onEdit(id)}
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
            
            <div className="relative p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="h-4 w-4 text-primary" />
                    <h3 className="text-lg font-semibold text-foreground line-clamp-1">
                      {title}
                    </h3>
                    {isPinned && (
                      <Pin className="h-4 w-4 text-primary fill-primary" />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                    {getPreview(content)}
                  </p>
                </div>
              </div>

              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {tags.slice(0, 3).map((tag, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
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

              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-3">
                  <span>
                    Criado: {format(new Date(createdAt), 'dd/MM/yy', { locale: ptBR })}
                  </span>
                  {reminderDate && (
                    <div className="flex items-center gap-1 text-primary">
                      <Calendar className="h-3 w-3" />
                      <span>{format(new Date(reminderDate), 'dd/MM/yy', { locale: ptBR })}</span>
                    </div>
                  )}
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onTogglePin(id, !isPinned);
                    }}
                    className="h-7 w-7 p-0"
                  >
                    <Pin className={`h-3 w-3 ${isPinned ? 'fill-primary text-primary' : ''}`} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDuplicate(id);
                    }}
                    className="h-7 w-7 p-0"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(id);
                    }}
                    className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-md">
          <div className="space-y-2">
            <p className="font-semibold">{title}</p>
            <p className="text-sm text-muted-foreground">{getPreview(content)}</p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
