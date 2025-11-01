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

export const AddRevenueDialog = ({ onSuccess }: { onSuccess?: () => void }) => {
  const [open, setOpen] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState("");
  const [grossAmount, setGrossAmount] = useState("");
  const [gatewayPercentage, setGatewayPercentage] = useState("");
  const [gatewayFixedFee, setGatewayFixedFee] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [netAmount, setNetAmount] = useState(0);

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    calculateNetAmount();
  }, [grossAmount, gatewayPercentage, gatewayFixedFee]);

  const loadProjects = async () => {
    const { data, error } = await (supabase as any).from('projects').select('id, name').order('name');
    if (error) {
      toast.error('Erro ao carregar projetos');
      return;
    }
    setProjects(data || []);
  };

  const calculateNetAmount = () => {
    const gross = parseFloat(grossAmount) || 0;
    const percentage = parseFloat(gatewayPercentage) || 0;
    const fixed = parseFloat(gatewayFixedFee) || 0;
    const percentageFee = (gross * percentage) / 100;
    const net = gross - percentageFee - fixed;
    setNetAmount(net);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedProject) {
      toast.error('Selecione um projeto');
      return;
    }

    const gross = parseFloat(grossAmount);
    const percentage = parseFloat(gatewayPercentage) || 0;
    const fixed = parseFloat(gatewayFixedFee) || 0;

    // Validate inputs
    if (isNaN(gross) || gross <= 0) {
      toast.error('Valor bruto deve ser maior que zero');
      return;
    }

    if (gross > 999999999.99) {
      toast.error('Valor bruto muito alto');
      return;
    }

    if (isNaN(percentage) || percentage < 0 || percentage > 100) {
      toast.error('Taxa percentual deve estar entre 0 e 100');
      return;
    }

    if (isNaN(fixed) || fixed < 0 || fixed > 999999.99) {
      toast.error('Taxa fixa inválida');
      return;
    }

    if (!date) {
      toast.error('Data é obrigatória');
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error('Usuário não autenticado');
      return;
    }

    const tz = 'America/Sao_Paulo';
    const { error } = await (supabase as any).from('revenues').insert({
      project_id: selectedProject,
      gross_amount: gross,
      gateway_percentage: percentage,
      gateway_fixed_fee: fixed,
      net_amount: netAmount,
      date: fromZonedTime(`${date}T00:00:00`, tz).toISOString(),
      user_id: user.id
    });

    if (error) {
      console.error('Erro ao adicionar faturamento:', error);
      toast.error('Erro ao adicionar faturamento: ' + error.message);
      return;
    }

    // Update financial history
    const { data: dayInv } = await (supabase as any).from('investments').select('amount').eq('project_id', selectedProject).gte('date', `${date}T00:00:00`).lte('date', `${date}T23:59:59`);
    const { data: dayRev } = await (supabase as any).from('revenues').select('net_amount').eq('project_id', selectedProject).gte('date', `${date}T00:00:00`).lte('date', `${date}T23:59:59`);
    const totalInv = dayInv?.reduce((s: number, i: any) => s + Number(i.amount), 0) || 0;
    const totalRev = dayRev?.reduce((s: number, r: any) => s + Number(r.net_amount), 0) || 0;
    const netProfit = totalRev - totalInv;
    const roi = totalInv > 0 ? (netProfit / totalInv) * 100 : 0;
    await (supabase as any).from('project_financial_history').upsert({ project_id: selectedProject, user_id: user.id, date, investment_amount: totalInv, revenue_amount: totalRev, net_profit: netProfit, roi }, { onConflict: 'project_id,date' });

    toast.success('Faturamento adicionado com sucesso!');
    setOpen(false);
    resetForm();
    onSuccess?.();
  };

  const resetForm = () => {
    setSelectedProject("");
    setGrossAmount("");
    setGatewayPercentage("");
    setGatewayFixedFee("");
    setDate(new Date().toISOString().split('T')[0]);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus className="mr-2 h-4 w-4" />
          Adicionar Faturamento
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card border-primary/20">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-foreground">Adicionar Faturamento</DialogTitle>
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
            <Label htmlFor="grossAmount">Valor Bruto (R$)</Label>
            <Input
              id="grossAmount"
              type="number"
              step="0.01"
              value={grossAmount}
              onChange={(e) => setGrossAmount(e.target.value)}
              className="bg-background border-primary/20"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="gatewayPercentage">Taxa (%)</Label>
              <Input
                id="gatewayPercentage"
                type="number"
                step="0.01"
                value={gatewayPercentage}
                onChange={(e) => setGatewayPercentage(e.target.value)}
                className="bg-background border-primary/20"
              />
            </div>
            <div>
              <Label htmlFor="gatewayFixedFee">Taxa Fixa (R$)</Label>
              <Input
                id="gatewayFixedFee"
                type="number"
                step="0.01"
                value={gatewayFixedFee}
                onChange={(e) => setGatewayFixedFee(e.target.value)}
                className="bg-background border-primary/20"
              />
            </div>
          </div>

          <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
            <p className="text-sm text-muted-foreground">Valor Líquido</p>
            <p className="text-2xl font-bold text-primary">
              R$ {netAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
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
