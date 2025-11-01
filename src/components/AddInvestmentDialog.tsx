import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { fromZonedTime } from "date-fns-tz";

interface Project {
  id: string;
  name: string;
}

export const AddInvestmentDialog = ({ onSuccess }: { onSuccess?: () => void }) => {
  const [open, setOpen] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    const { data, error } = await (supabase as any).from('projects').select('id, name').order('name');
    if (error) {
      toast.error('Erro ao carregar projetos');
      return;
    }
    setProjects(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedProject) {
      toast.error('Selecione um projeto');
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error('Usuário não autenticado');
      return;
    }

    const tz = 'America/Sao_Paulo';
    const { error } = await (supabase as any).from('investments').insert({
      project_id: selectedProject,
      amount: parseFloat(amount),
      date: fromZonedTime(`${date}T00:00:00`, tz).toISOString(),
      user_id: user.id
    });

    if (error) {
      console.error('Erro ao adicionar investimento:', error);
      toast.error('Erro ao adicionar investimento: ' + error.message);
      return;
    }

    // Update financial history for the day
    const { data: dayInv } = await (supabase as any).from('investments').select('amount').eq('project_id', selectedProject).gte('date', `${date}T00:00:00`).lte('date', `${date}T23:59:59`);
    const { data: dayRev } = await (supabase as any).from('revenues').select('net_amount').eq('project_id', selectedProject).gte('date', `${date}T00:00:00`).lte('date', `${date}T23:59:59`);
    const totalInv = dayInv?.reduce((s: number, i: any) => s + Number(i.amount), 0) || 0;
    const totalRev = dayRev?.reduce((s: number, r: any) => s + Number(r.net_amount), 0) || 0;
    const netProfit = totalRev - totalInv;
    const roi = totalInv > 0 ? (netProfit / totalInv) * 100 : 0;
    await (supabase as any).from('project_financial_history').upsert({ project_id: selectedProject, user_id: user.id, date, investment_amount: totalInv, revenue_amount: totalRev, net_profit: netProfit, roi }, { onConflict: 'project_id,date' });

    toast.success('Investimento adicionado com sucesso!');
    setOpen(false);
    resetForm();
    onSuccess?.();
  };

  const resetForm = () => {
    setSelectedProject("");
    setAmount("");
    setDate(new Date().toISOString().split('T')[0]);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="border-primary/20 text-primary hover:bg-primary/10">
          <Plus className="mr-2 h-4 w-4" />
          Adicionar Investimento
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card border-primary/20">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-foreground">Adicionar Investimento</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="project">Projeto</Label>
            <Select value={selectedProject} onValueChange={setSelectedProject}>
              <SelectTrigger className="bg-background border-primary/20">
                <SelectValue placeholder="Selecione um projeto" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-primary/20">
                {projects.filter(p => p.id && p.id !== '').map(project => (
                  <SelectItem key={project.id} value={project.id}>{project.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="amount">Valor Investido (R$)</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="bg-background border-primary/20"
              required
            />
          </div>

          <div>
            <Label htmlFor="date">Data</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="bg-background border-primary/20"
              required
            />
          </div>

          <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
            Salvar
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
