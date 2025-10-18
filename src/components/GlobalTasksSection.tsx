import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

interface GlobalTask {
  id: string;
  title: string;
  completed: boolean;
}

export const GlobalTasksSection = () => {
  const [tasks, setTasks] = useState<GlobalTask[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState("");

  useEffect(() => {
    loadTasks();

    const channel = supabase
      .channel('global-tasks-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'global_tasks' },
        () => loadTasks()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadTasks = async () => {
    const { data } = await (supabase as any)
      .from('global_tasks')
      .select('*')
      .order('created_at', { ascending: false });

    setTasks(data || []);
  };

  const addTask = async () => {
    if (!newTaskTitle.trim()) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error('Você precisa estar autenticado');
      return;
    }

    const { error } = await (supabase as any)
      .from('global_tasks')
      .insert({ 
        title: newTaskTitle, 
        completed: false,
        user_id: user.id 
      });

    if (error) {
      toast.error('Erro ao adicionar tarefa');
      return;
    }

    setNewTaskTitle("");
    toast.success('Tarefa adicionada!');
  };

  const toggleTask = async (taskId: string, completed: boolean) => {
    const { error } = await (supabase as any)
      .from('global_tasks')
      .update({ completed })
      .eq('id', taskId);

    if (error) {
      toast.error('Erro ao atualizar tarefa');
    }
  };

  const deleteTask = async (taskId: string) => {
    const { error } = await (supabase as any)
      .from('global_tasks')
      .delete()
      .eq('id', taskId);

    if (error) {
      toast.error('Erro ao deletar tarefa');
      return;
    }

    toast.success('Tarefa removida!');
  };

  const completedTasks = tasks.filter(t => t.completed).length;
  const progressPercentage = tasks.length > 0 ? (completedTasks / tasks.length) * 100 : 0;

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <CheckCircle2 className="h-6 w-6" />
            Tarefas
          </h2>
          {tasks.length > 0 && (
            <p className="text-sm text-muted-foreground mt-1">
              {completedTasks}/{tasks.length} concluídas ({progressPercentage.toFixed(0)}%)
            </p>
          )}
        </div>
      </div>

      <Card className="p-6 border-primary/20 bg-card/50 backdrop-blur-sm">
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
    </section>
  );
};