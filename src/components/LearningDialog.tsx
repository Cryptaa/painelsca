import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarIcon, X, Save, ArrowLeft, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { learningSchema } from "@/lib/validations";
import { z } from "zod";

interface Learning {
  id: string;
  title: string;
  description: string;
  category: 'erro' | 'vitoria' | 'licao' | 'reflexao';
  tags?: string[];
  is_public: boolean;
  is_favorite: boolean;
  date: string;
  linked_project_id?: string;
  linked_idea_id?: string;
}

interface LearningDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  learning: Learning | null;
  onSuccess: () => void;
}

export const LearningDialog = ({ open, onOpenChange, learning, onSuccess }: LearningDialogProps) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<'erro' | 'vitoria' | 'licao' | 'reflexao'>('licao');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [date, setDate] = useState<Date>(new Date());
  const [linkedProjectId, setLinkedProjectId] = useState<string>("");
  const [linkedIdeaId, setLinkedIdeaId] = useState<string>("");
  const [projects, setProjects] = useState<any[]>([]);
  const [ideas, setIdeas] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (learning) {
      setTitle(learning.title);
      setDescription(learning.description);
      setCategory(learning.category);
      setTags(learning.tags || []);
      setIsPublic(learning.is_public);
      setIsFavorite(learning.is_favorite);
      setDate(new Date(learning.date));
      setLinkedProjectId(learning.linked_project_id || "");
      setLinkedIdeaId(learning.linked_idea_id || "");
    } else {
      resetForm();
    }
  }, [learning, open]);

  useEffect(() => {
    if (open) {
      loadProjects();
      loadIdeas();
    }
  }, [open]);

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setCategory('licao');
    setTags([]);
    setTagInput("");
    setIsPublic(false);
    setIsFavorite(false);
    setDate(new Date());
    setLinkedProjectId("");
    setLinkedIdeaId("");
  };

  const loadProjects = async () => {
    const { data } = await (supabase as any)
      .from('projects')
      .select('id, name')
      .order('name');
    setProjects(data || []);
  };

  const loadIdeas = async () => {
    const { data } = await (supabase as any)
      .from('ideas')
      .select('id, title')
      .order('title');
    setIdeas(data || []);
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error('O título é obrigatório');
      return;
    }

    setIsSaving(true);

    try {
      // Validate all fields
      const validatedData = learningSchema.parse({
        title: title.trim(),
        description: description.trim() || undefined,
        category,
        tags: tags.length > 0 ? tags : undefined,
        date: date.toISOString(),
        linked_project_id: linkedProjectId || undefined,
        linked_idea_id: linkedIdeaId || undefined,
      });

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsSaving(false);
        return;
      }

      const learningData = {
        ...validatedData,
        is_public: isPublic,
        is_favorite: isFavorite,
        user_id: user.id,
      };

      if (learning) {
        const { error } = await (supabase as any)
          .from('learnings')
          .update(learningData)
          .eq('id', learning.id);

        if (error) {
          toast.error('Erro ao atualizar aprendizado');
        } else {
          toast.success('Aprendizado atualizado!');
          onSuccess();
          onOpenChange(false);
        }
      } else {
        const { error } = await (supabase as any)
          .from('learnings')
          .insert(learningData);

        if (error) {
          toast.error('Erro ao criar aprendizado');
        } else {
          toast.success('Aprendizado criado!');
          onSuccess();
          onOpenChange(false);
          resetForm();
        }
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(`Erro de validação: ${error.errors[0].message}`);
      } else {
        toast.error('Erro inesperado ao salvar aprendizado');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{learning ? 'Editar Aprendizado' : 'Novo Aprendizado'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Título *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="O que você aprendeu hoje?"
              className="text-lg font-semibold"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Categoria *</Label>
              <Select value={category} onValueChange={(v: any) => setCategory(v)}>
                <SelectTrigger className="bg-background border-primary/20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover z-[60]">
                  <SelectItem value="erro">❌ Erro</SelectItem>
                  <SelectItem value="vitoria">🏆 Vitória</SelectItem>
                  <SelectItem value="licao">📚 Lição</SelectItem>
                  <SelectItem value="reflexao">💭 Reflexão</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Data</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal border-primary/20",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, 'PPP', { locale: ptBR }) : "Selecionar data"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(d) => d && setDate(d)}
                    initialFocus
                    locale={ptBR}
                    className="rounded-md border pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição Detalhada</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva em detalhes o que aprendeu, o contexto, e como isso pode te ajudar no futuro..."
              className="min-h-[200px] font-mono"
            />
          </div>

          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="flex gap-2">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                placeholder="Ex: mindset, marketing, disciplina"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
              />
              <Button type="button" onClick={addTag} size="sm">
                Adicionar
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {tags.map((tag, index) => (
                <Badge key={index} variant="secondary">
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="ml-1"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Vincular a Projeto</Label>
              <Select value={linkedProjectId} onValueChange={(v) => setLinkedProjectId(v === 'none' ? '' : v)}>
                <SelectTrigger className="bg-background border-primary/20">
                  <SelectValue placeholder="Selecionar projeto" />
                </SelectTrigger>
                <SelectContent className="bg-popover z-[60]">
                  <SelectItem value="none">Nenhum</SelectItem>
                  {projects.filter((p) => p.id && p.id !== '').map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Vincular a Ideia</Label>
              <Select value={linkedIdeaId} onValueChange={(v) => setLinkedIdeaId(v === 'none' ? '' : v)}>
                <SelectTrigger className="bg-background border-primary/20">
                  <SelectValue placeholder="Selecionar ideia" />
                </SelectTrigger>
                <SelectContent className="bg-popover z-[60]">
                  <SelectItem value="none">Nenhuma</SelectItem>
                  {ideas.filter((i) => i.id && i.id !== '').map((idea) => (
                    <SelectItem key={idea.id} value={idea.id}>
                      {idea.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col gap-4 p-4 bg-primary/5 rounded-lg border border-primary/20">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Marcar como favorito</Label>
                <p className="text-xs text-muted-foreground">
                  Destacar este aprendizado como importante
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={isFavorite}
                  onCheckedChange={setIsFavorite}
                />
                <Star className={`h-4 w-4 ${isFavorite ? 'fill-primary text-primary' : 'text-muted-foreground'}`} />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Tornar público</Label>
                <p className="text-xs text-muted-foreground">
                  Outros usuários poderão ver este aprendizado
                </p>
              </div>
              <Switch
                checked={isPublic}
                onCheckedChange={setIsPublic}
              />
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              onClick={() => onOpenChange(false)}
              variant="outline"
              className="flex-1"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving || !title.trim()}
              className="flex-1"
            >
              <Save className="mr-2 h-4 w-4" />
              {isSaving ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};