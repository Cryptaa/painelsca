import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Idea } from "@/pages/Ideas";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { ideaSchema } from "@/lib/validations";
import { z } from "zod";

interface IdeaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  idea: Idea | null;
  onSuccess: () => void;
}

export const IdeaDialog = ({ open, onOpenChange, idea, onSuccess }: IdeaDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    brainstorm: "",
    category: "",
    project_type: "",
    profit_potential: "medium",
    status: "draft",
    main_goal: "",
    target_audience: "",
    estimated_time: "",
    main_risk: "",
    main_difficulty: "",
    personal_motivation: "",
    notes: "",
    is_favorite: false,
    progress: 0,
  });
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [resources, setResources] = useState<string[]>([]);
  const [resourceInput, setResourceInput] = useState("");
  const [checklist, setChecklist] = useState<Array<{ text: string; completed: boolean }>>([]);

  const { toast } = useToast();

  useEffect(() => {
    if (idea) {
      setFormData({
        title: idea.title,
        description: idea.description || "",
        brainstorm: idea.brainstorm || "",
        category: idea.category || "",
        project_type: idea.project_type || "",
        profit_potential: idea.profit_potential,
        status: idea.status,
        main_goal: idea.main_goal || "",
        target_audience: idea.target_audience || "",
        estimated_time: idea.estimated_time || "",
        main_risk: idea.main_risk || "",
        main_difficulty: idea.main_difficulty || "",
        personal_motivation: idea.personal_motivation || "",
        notes: idea.notes || "",
        is_favorite: idea.is_favorite,
        progress: idea.progress,
      });
      setTags(idea.tags || []);
      setResources(idea.required_resources || []);
      setChecklist(idea.checklist || []);
    } else {
      setFormData({
        title: "",
        description: "",
        brainstorm: "",
        category: "",
        project_type: "",
        profit_potential: "medium",
        status: "draft",
        main_goal: "",
        target_audience: "",
        estimated_time: "",
        main_risk: "",
        main_difficulty: "",
        personal_motivation: "",
        notes: "",
        is_favorite: false,
        progress: 0,
      });
      setTags([]);
      setResources([]);
      setChecklist([]);
    }
  }, [idea, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate all fields
      const validatedData = ideaSchema.parse({
        title: formData.title,
        description: formData.description || undefined,
        brainstorm: formData.brainstorm || undefined,
        category: formData.category || undefined,
        project_type: formData.project_type || undefined,
        main_goal: formData.main_goal || undefined,
        target_audience: formData.target_audience || undefined,
        estimated_time: formData.estimated_time || undefined,
        main_risk: formData.main_risk || undefined,
        main_difficulty: formData.main_difficulty || undefined,
        personal_motivation: formData.personal_motivation || undefined,
        notes: formData.notes || undefined,
        tags: tags.length > 0 ? tags : undefined,
        required_resources: resources.length > 0 ? resources : undefined,
      });

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const dataToSave = {
        ...validatedData,
        user_id: user.id,
        progress: formData.progress,
        status: formData.status,
        profit_potential: formData.profit_potential,
        is_favorite: formData.is_favorite,
        checklist,
      };

      if (idea) {
        const { error } = await (supabase as any)
          .from("ideas")
          .update(dataToSave)
          .eq("id", idea.id);

        if (error) {
          toast({
            title: "Erro ao atualizar ideia",
            description: error.message,
            variant: "destructive",
          });
        } else {
          toast({
            title: "Ideia atualizada",
            description: "A ideia foi atualizada com sucesso",
          });
          onSuccess();
          onOpenChange(false);
        }
      } else {
        const { error } = await (supabase as any)
          .from("ideas")
          .insert(dataToSave);

        if (error) {
          toast({
            title: "Erro ao criar ideia",
            description: error.message,
            variant: "destructive",
          });
        } else {
          toast({
            title: "Ideia criada",
            description: "A ideia foi criada com sucesso",
          });
          onSuccess();
          onOpenChange(false);
        }
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Erro de validação",
          description: error.errors[0].message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Erro inesperado",
          description: "Ocorreu um erro ao processar sua solicitação",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const addTag = () => {
    if (tagInput && !tags.includes(tagInput)) {
      setTags([...tags, tagInput]);
      setTagInput("");
    }
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  const addResource = () => {
    if (resourceInput && !resources.includes(resourceInput)) {
      setResources([...resources, resourceInput]);
      setResourceInput("");
    }
  };

  const removeResource = (resource: string) => {
    setResources(resources.filter(r => r !== resource));
  };

  const addChecklistItem = () => {
    setChecklist([...checklist, { text: "", completed: false }]);
  };

  const removeChecklistItem = (index: number) => {
    setChecklist(checklist.filter((_, i) => i !== index));
  };

  const updateChecklistItem = (index: number, text: string) => {
    const updated = [...checklist];
    updated[index].text = text;
    setChecklist(updated);
  };

  const toggleChecklistItem = (index: number) => {
    const updated = [...checklist];
    updated[index].completed = !updated[index].completed;
    setChecklist(updated);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{idea ? "Editar Ideia" : "Nova Ideia"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic">Básico</TabsTrigger>
              <TabsTrigger value="details">Detalhes</TabsTrigger>
              <TabsTrigger value="planning">Planejamento</TabsTrigger>
              <TabsTrigger value="tasks">Afazeres</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="title">Título da Ideia *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="brainstorm">Brainstorm / Anotações Rápidas</Label>
                <Textarea
                  id="brainstorm"
                  value={formData.brainstorm}
                  onChange={(e) => setFormData({ ...formData, brainstorm: e.target.value })}
                  rows={4}
                  placeholder="Use este espaço para anotar ideias, insights, referências..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Categoria</Label>
                  <Input
                    id="category"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="Ex: Tech, Educação, Marketing"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="project_type">Tipo de Projeto</Label>
                  <Input
                    id="project_type"
                    value={formData.project_type}
                    onChange={(e) => setFormData({ ...formData, project_type: e.target.value })}
                    placeholder="Ex: Infoproduto, SaaS, Comunidade"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Rascunho</SelectItem>
                      <SelectItem value="developing">Em Desenvolvimento</SelectItem>
                      <SelectItem value="ready">Pronto para Projeto</SelectItem>
                      <SelectItem value="converted">Convertida</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="profit_potential">Potencial de Lucro</Label>
                  <Select
                    value={formData.profit_potential}
                    onValueChange={(value) => setFormData({ ...formData, profit_potential: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Baixo</SelectItem>
                      <SelectItem value="medium">Médio</SelectItem>
                      <SelectItem value="high">Alto</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="favorite"
                  checked={formData.is_favorite}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_favorite: checked })}
                />
                <Label htmlFor="favorite">Marcar como favorita</Label>
              </div>
            </TabsContent>

            <TabsContent value="details" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="main_goal">Objetivo Principal</Label>
                <Textarea
                  id="main_goal"
                  value={formData.main_goal}
                  onChange={(e) => setFormData({ ...formData, main_goal: e.target.value })}
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="target_audience">Público-Alvo</Label>
                <Textarea
                  id="target_audience"
                  value={formData.target_audience}
                  onChange={(e) => setFormData({ ...formData, target_audience: e.target.value })}
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label>Tags</Label>
                <div className="flex gap-2">
                  <Input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    placeholder="Adicionar tag"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  />
                  <Button type="button" onClick={addTag}>Adicionar</Button>
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
                <Label htmlFor="personal_motivation">Motivação Pessoal</Label>
                <Textarea
                  id="personal_motivation"
                  value={formData.personal_motivation}
                  onChange={(e) => setFormData({ ...formData, personal_motivation: e.target.value })}
                  rows={3}
                />
              </div>
            </TabsContent>

            <TabsContent value="planning" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="estimated_time">Tempo Estimado de Desenvolvimento</Label>
                <Input
                  id="estimated_time"
                  value={formData.estimated_time}
                  onChange={(e) => setFormData({ ...formData, estimated_time: e.target.value })}
                  placeholder="Ex: 3 meses, 6 semanas"
                />
              </div>

              <div className="space-y-2">
                <Label>Recursos Necessários</Label>
                <div className="flex gap-2">
                  <Input
                    value={resourceInput}
                    onChange={(e) => setResourceInput(e.target.value)}
                    placeholder="Adicionar recurso"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addResource())}
                  />
                  <Button type="button" onClick={addResource}>Adicionar</Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {resources.map((resource, index) => (
                    <Badge key={index} variant="outline">
                      {resource}
                      <button
                        type="button"
                        onClick={() => removeResource(resource)}
                        className="ml-1"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="main_risk">Principal Risco</Label>
                <Textarea
                  id="main_risk"
                  value={formData.main_risk}
                  onChange={(e) => setFormData({ ...formData, main_risk: e.target.value })}
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="main_difficulty">Maior Dificuldade</Label>
                <Textarea
                  id="main_difficulty"
                  value={formData.main_difficulty}
                  onChange={(e) => setFormData({ ...formData, main_difficulty: e.target.value })}
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label>Progresso da Ideia: {formData.progress}%</Label>
                <Slider
                  value={[formData.progress]}
                  onValueChange={(value) => setFormData({ ...formData, progress: value[0] })}
                  max={100}
                  step={5}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notas Adicionais</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                />
              </div>
            </TabsContent>

            <TabsContent value="tasks" className="space-y-4 mt-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Lista de Afazeres</Label>
                  <div className="space-y-2">
                    {checklist.map((item, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 border rounded-lg">
                        <input
                          type="checkbox"
                          checked={item.completed}
                          onChange={() => toggleChecklistItem(index)}
                          className="h-4 w-4"
                        />
                        <Input
                          value={item.text}
                          onChange={(e) => updateChecklistItem(index, e.target.value)}
                          className="flex-1"
                          placeholder="Descrição da tarefa"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeChecklistItem(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={addChecklistItem}
                      className="w-full"
                    >
                      + Adicionar Tarefa
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Salvando..." : idea ? "Atualizar" : "Criar Ideia"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};