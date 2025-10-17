import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge } from "@/components/StatusBadge";
import { ArrowLeft, Plus, CheckCircle2, Circle, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";

interface ProjectData {
  id: string;
  name: string;
  description?: string;
  status: 'active' | 'paused' | 'completed';
  totalInvestment: number;
  totalRevenue: number;
}

interface Task {
  id: string;
  title: string;
  completed: boolean;
}

const ProjectDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState<ProjectData | null>(null);
  const [notes, setNotes] = useState("");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState("");

  useEffect(() => {
    if (id) {
      loadProjectData();
    }
  }, [id]);

  // Real-time updates for tasks
  useEffect(() => {
    if (!id) return;

    const channel = supabase
      .channel('project-tasks-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks', filter: `project_id=eq.${id}` },
        () => loadProjectData()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notes', filter: `project_id=eq.${id}` },
        () => loadProjectData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

  const loadProjectData = async () => {
    if (!id) return;

    // Carregar projeto
    const { data: projectData } = await (supabase as any)
      .from('projects')
      .select('*')
      .eq('id', id)
      .single();

    if (!projectData) {
      toast.error('Projeto não encontrado');
      navigate('/');
      return;
    }

    // Calcular totais
    const { data: investments } = await (supabase as any)
      .from('investments')
      .select('amount')
      .eq('project_id', id);
    
    const totalInvestment = investments?.reduce((sum, inv) => sum + Number(inv.amount), 0) || 0;

    const { data: revenues } = await (supabase as any)
      .from('revenues')
      .select('net_amount')
      .eq('project_id', id);
    
    const totalRevenue = revenues?.reduce((sum, rev) => sum + Number(rev.net_amount), 0) || 0;

    setProject({
      ...projectData,
      totalInvestment,
      totalRevenue
    } as ProjectData);

    // Carregar notas
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: notesData } = await (supabase as any)
      .from('notes')
      .select('content')
      .eq('project_id', id)
      .eq('user_id', user.id)
      .maybeSingle();

    if (notesData) {
      setNotes(notesData.content);
    } else {
      // Criar nota vazia se não existir
      await (supabase as any).from('notes').insert({ 
        project_id: id, 
        content: '',
        user_id: user.id 
      });
    }

    // Carregar tarefas
    const { data: tasksData } = await (supabase as any)
      .from('tasks')
      .select('*')
      .eq('project_id', id)
      .order('created_at', { ascending: false });

    setTasks(tasksData || []);
  };

  const updateStatus = async (newStatus: 'active' | 'paused' | 'completed') => {
    if (!id) return;

    const { error } = await (supabase as any)
      .from('projects')
      .update({ status: newStatus })
      .eq('id', id);

    if (error) {
      toast.error('Erro ao atualizar status');
      return;
    }

    toast.success('Status atualizado!');
    loadProjectData();
  };

  const saveNotes = async () => {
    if (!id) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await (supabase as any)
      .from('notes')
      .update({ content: notes })
      .eq('project_id', id)
      .eq('user_id', user.id);

    if (error) {
      toast.error('Erro ao salvar notas');
      console.error('Erro ao salvar notas:', error);
      return;
    }

    toast.success('Notas salvas!');
  };

  const addTask = async () => {
    if (!id || !newTaskTitle.trim()) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error('Você precisa estar autenticado');
      return;
    }

    const { error } = await (supabase as any)
      .from('tasks')
      .insert({ 
        project_id: id, 
        title: newTaskTitle, 
        completed: false,
        user_id: user.id 
      });

    if (error) {
      toast.error('Erro ao adicionar tarefa');
      console.error('Erro ao adicionar tarefa:', error);
      return;
    }

    setNewTaskTitle("");
    loadProjectData();
    toast.success('Tarefa adicionada!');
  };

  const toggleTask = async (taskId: string, completed: boolean) => {
    const { error } = await (supabase as any)
      .from('tasks')
      .update({ completed })
      .eq('id', taskId);

    if (error) {
      toast.error('Erro ao atualizar tarefa');
      return;
    }

    loadProjectData();
  };

  const deleteTask = async (taskId: string) => {
    const { error } = await (supabase as any)
      .from('tasks')
      .delete()
      .eq('id', taskId);

    if (error) {
      toast.error('Erro ao deletar tarefa');
      return;
    }

    loadProjectData();
    toast.success('Tarefa removida!');
  };

  if (!project) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  const completedTasks = tasks.filter(t => t.completed).length;
  const progressPercentage = tasks.length > 0 ? (completedTasks / tasks.length) * 100 : 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-primary/20 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="mb-4 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar ao Dashboard
          </Button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">{project.name}</h1>
              {project.description && (
                <p className="text-muted-foreground">{project.description}</p>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8 space-y-8">
        {/* Status Section */}
        <Card className="p-6 border-primary/20 bg-card/50 backdrop-blur-sm">
          <h2 className="text-xl font-bold text-foreground mb-4">Status do Projeto</h2>
          <div className="flex items-center gap-4">
            <StatusBadge status={project.status} />
            <Select value={project.status} onValueChange={(value: any) => updateStatus(value)}>
              <SelectTrigger className="w-48 bg-background border-primary/20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover border-primary/20">
                <SelectItem value="active">Ativo</SelectItem>
                <SelectItem value="paused">Pausado</SelectItem>
                <SelectItem value="completed">Concluído</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Financial Summary */}
          <Card className="p-6 border-primary/20 bg-card/50 backdrop-blur-sm">
            <h2 className="text-xl font-bold text-foreground mb-6">Resumo Financeiro</h2>
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                <p className="text-sm text-muted-foreground mb-1">Investimento Total</p>
                <p className="text-2xl font-bold text-foreground">
                  R$ {project.totalInvestment.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                <p className="text-sm text-muted-foreground mb-1">Faturamento Total</p>
                <p className="text-2xl font-bold text-foreground">
                  R$ {project.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                <p className="text-sm text-muted-foreground mb-1">Lucro Líquido</p>
                <p className={`text-2xl font-bold ${(project.totalRevenue - project.totalInvestment) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  R$ {(project.totalRevenue - project.totalInvestment).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </Card>

          {/* Tasks */}
          <Card className="p-6 border-primary/20 bg-card/50 backdrop-blur-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-foreground">Afazeres</h2>
              <span className="text-sm text-muted-foreground">
                {completedTasks}/{tasks.length} - {progressPercentage.toFixed(0)}%
              </span>
            </div>
            
            <div className="flex gap-2 mb-6">
              <Input
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder="Nova tarefa..."
                className="bg-background border-primary/20"
                onKeyPress={(e) => e.key === 'Enter' && addTask()}
              />
              <Button onClick={addTask} className="bg-primary text-primary-foreground">
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-background border border-primary/10 hover:border-primary/20 transition-colors"
                >
                  <Checkbox
                    checked={task.completed}
                    onCheckedChange={(checked) => toggleTask(task.id, checked as boolean)}
                  />
                  <span className={`flex-1 ${task.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                    {task.title}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteTask(task.id)}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {tasks.length === 0 && (
                <p className="text-center text-muted-foreground py-8">
                  Nenhuma tarefa criada ainda
                </p>
              )}
            </div>
          </Card>
        </div>

        {/* Notes */}
        <Card className="p-6 border-primary/20 bg-card/50 backdrop-blur-sm">
          <h2 className="text-xl font-bold text-foreground mb-4">Notas</h2>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Escreva suas anotações aqui..."
            className="min-h-[200px] bg-background border-primary/20 mb-4"
          />
          <Button onClick={saveNotes} className="bg-primary text-primary-foreground hover:bg-primary/90">
            Salvar Notas
          </Button>
        </Card>
      </main>
    </div>
  );
};

export default ProjectDetail;
