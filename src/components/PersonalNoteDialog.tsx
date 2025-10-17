import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarIcon, X, Save, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface PersonalNote {
  id: string;
  title: string;
  content: string;
  tags?: string[];
  is_pinned: boolean;
  linked_project_id?: string;
  linked_idea_id?: string;
  reminder_date?: string;
}

interface PersonalNoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  note: PersonalNote | null;
  onSuccess: () => void;
}

export const PersonalNoteDialog = ({ open, onOpenChange, note, onSuccess }: PersonalNoteDialogProps) => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [reminderDate, setReminderDate] = useState<Date>();
  const [linkedProjectId, setLinkedProjectId] = useState<string>("");
  const [linkedIdeaId, setLinkedIdeaId] = useState<string>("");
  const [projects, setProjects] = useState<any[]>([]);
  const [ideas, setIdeas] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setContent(note.content);
      setTags(note.tags || []);
      setLinkedProjectId(note.linked_project_id || "");
      setLinkedIdeaId(note.linked_idea_id || "");
      setReminderDate(note.reminder_date ? new Date(note.reminder_date) : undefined);
    } else {
      resetForm();
    }
  }, [note, open]);

  useEffect(() => {
    if (open) {
      loadProjects();
      loadIdeas();
    }
  }, [open]);

  // Autosave a cada 3 segundos
  useEffect(() => {
    if (!note || !open) return;

    const timer = setTimeout(() => {
      handleAutoSave();
    }, 3000);

    return () => clearTimeout(timer);
  }, [title, content, tags, linkedProjectId, linkedIdeaId, reminderDate, note, open]);

  const resetForm = () => {
    setTitle("");
    setContent("");
    setTags([]);
    setTagInput("");
    setReminderDate(undefined);
    setLinkedProjectId("");
    setLinkedIdeaId("");
    setLastSaved(null);
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

  const handleAutoSave = async () => {
    if (!note || !title.trim()) return;
    await handleSave(true);
  };

  const handleSave = async (isAutoSave = false) => {
    if (!title.trim()) {
      if (!isAutoSave) toast.error('O título é obrigatório');
      return;
    }

    setIsSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const noteData = {
      title: title.trim(),
      content: content.trim(),
      tags,
      linked_project_id: linkedProjectId || null,
      linked_idea_id: linkedIdeaId || null,
      reminder_date: reminderDate?.toISOString() || null,
      user_id: user.id,
    };

    if (note) {
      const { error } = await (supabase as any)
        .from('personal_notes')
        .update(noteData)
        .eq('id', note.id);

      if (error) {
        if (!isAutoSave) toast.error('Erro ao atualizar anotação');
        console.error('Erro:', error);
      } else {
        setLastSaved(new Date());
        if (!isAutoSave) {
          toast.success('Anotação atualizada!');
          onSuccess();
          onOpenChange(false);
        }
      }
    } else {
      const { error } = await (supabase as any)
        .from('personal_notes')
        .insert(noteData);

      if (error) {
        toast.error('Erro ao criar anotação');
        console.error('Erro:', error);
      } else {
        toast.success('Anotação criada!');
        onSuccess();
        onOpenChange(false);
        resetForm();
      }
    }

    setIsSaving(false);
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
          <DialogTitle>{note ? 'Editar Anotação' : 'Nova Anotação'}</DialogTitle>
          <DialogDescription>
            {note && lastSaved && (
              <span className="text-xs text-muted-foreground">
                Salvo automaticamente às {format(lastSaved, 'HH:mm:ss')}
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Título *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Título da anotação..."
              className="text-lg font-semibold"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Conteúdo</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Escreva sua anotação aqui...&#10;&#10;Você pode usar múltiplas linhas,&#10;criar listas,&#10;adicionar links e muito mais!"
              className="min-h-[300px] font-mono"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tags</Label>
              <div className="flex gap-2">
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  placeholder="Adicionar tag"
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

            <div className="space-y-2">
              <Label>Lembrete</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !reminderDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {reminderDate ? format(reminderDate, 'PPP', { locale: ptBR }) : "Selecionar data"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={reminderDate}
                    onSelect={setReminderDate}
                    initialFocus
                    locale={ptBR}
                    className="rounded-md border pointer-events-auto"
                  />
                  {reminderDate && (
                    <div className="p-3 border-t">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setReminderDate(undefined)}
                        className="w-full"
                      >
                        Limpar data
                      </Button>
                    </div>
                  )}
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Vincular a Projeto</Label>
              <Select value={linkedProjectId} onValueChange={(v) => setLinkedProjectId(v === 'none' ? '' : v)}>
                <SelectTrigger>
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
                <SelectTrigger>
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
              onClick={() => handleSave(false)}
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
