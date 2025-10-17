import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const CreateProjectDialog = ({ onSuccess }: { onSuccess?: () => void }) => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate inputs
    if (!name.trim()) {
      toast.error('Nome do projeto é obrigatório');
      return;
    }

    if (name.trim().length > 100) {
      toast.error('Nome deve ter no máximo 100 caracteres');
      return;
    }

    if (description && description.length > 1000) {
      toast.error('Descrição deve ter no máximo 1000 caracteres');
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error('Usuário não autenticado');
      return;
    }

    const { error } = await (supabase as any).from('projects').insert({
      name: name.trim(),
      description: description?.trim() || null,
      status: 'active',
      user_id: user.id
    });

    if (error) {
      console.error('Erro ao criar projeto:', error);
      toast.error('Erro ao criar projeto: ' + error.message);
      return;
    }

    toast.success('Projeto criado com sucesso!');
    setOpen(false);
    resetForm();
    onSuccess?.();
  };

  const resetForm = () => {
    setName("");
    setDescription("");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus className="mr-2 h-4 w-4" />
          Criar Projeto
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card border-primary/20">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-foreground">Criar Novo Projeto</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Nome do Projeto</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-background border-primary/20"
              required
            />
          </div>
          
          <div>
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-background border-primary/20 min-h-[100px]"
            />
          </div>

          <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
            Criar
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
