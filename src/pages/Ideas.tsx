import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Filter, ArrowLeft } from "lucide-react";
import { IdeaCard } from "@/components/IdeaCard";
import { IdeaDialog } from "@/components/IdeaDialog";
import { useToast } from "@/hooks/use-toast";
import { User } from "@supabase/supabase-js";

export interface Idea {
  id: string;
  title: string;
  description: string | null;
  brainstorm: string | null;
  category: string | null;
  project_type: string | null;
  profit_potential: string;
  status: string;
  main_goal: string | null;
  target_audience: string | null;
  estimated_time: string | null;
  required_resources: string[] | null;
  main_risk: string | null;
  main_difficulty: string | null;
  personal_motivation: string | null;
  tags: string[] | null;
  is_favorite: boolean;
  progress: number;
  checklist: any;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

const Ideas = () => {
  const [user, setUser] = useState<User | null>(null);
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [filteredIdeas, setFilteredIdeas] = useState<Idea[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedIdea, setSelectedIdea] = useState<Idea | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session?.user) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (user) {
      loadIdeas();
    }
  }, [user]);

  useEffect(() => {
    if (searchTerm) {
      const filtered = ideas.filter((idea) =>
        idea.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        idea.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        idea.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredIdeas(filtered);
    } else {
      setFilteredIdeas(ideas);
    }
  }, [searchTerm, ideas]);

  const loadIdeas = async () => {
    const { data, error } = await (supabase as any)
      .from("ideas")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        title: "Erro ao carregar ideias",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setIdeas(data || []);
    }
  };

  const handleNewIdea = () => {
    setSelectedIdea(null);
    setIsDialogOpen(true);
  };

  const handleEditIdea = (idea: Idea) => {
    setSelectedIdea(idea);
    setIsDialogOpen(true);
  };

  const handleDeleteIdea = async (id: string) => {
    const { error } = await (supabase as any)
      .from("ideas")
      .delete()
      .eq("id", id);

    if (error) {
      toast({
        title: "Erro ao excluir ideia",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Ideia excluída",
        description: "A ideia foi excluída com sucesso",
      });
      loadIdeas();
    }
  };

  const stats = {
    total: ideas.length,
    draft: ideas.filter(i => i.status === 'draft').length,
    developing: ideas.filter(i => i.status === 'developing').length,
    ready: ideas.filter(i => i.status === 'ready').length,
    converted: ideas.filter(i => i.status === 'converted').length,
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-4xl font-bold">💡 Laboratório de Ideias</h1>
              <p className="text-muted-foreground mt-2">
                Registre e desenvolva suas ideias antes de transformá-las em projetos
              </p>
            </div>
          </div>
          <Button onClick={handleNewIdea} size="lg">
            <Plus className="mr-2 h-5 w-5" />
            Nova Ideia
          </Button>
        </div>

        <div className="grid grid-cols-5 gap-4 mb-8">
          <div className="bg-card border rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Total</p>
            <p className="text-2xl font-bold">{stats.total}</p>
          </div>
          <div className="bg-card border rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Rascunho</p>
            <p className="text-2xl font-bold text-gray-500">{stats.draft}</p>
          </div>
          <div className="bg-card border rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Desenvolvimento</p>
            <p className="text-2xl font-bold text-blue-500">{stats.developing}</p>
          </div>
          <div className="bg-card border rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Pronto</p>
            <p className="text-2xl font-bold text-green-500">{stats.ready}</p>
          </div>
          <div className="bg-card border rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Convertidas</p>
            <p className="text-2xl font-bold text-purple-500">{stats.converted}</p>
          </div>
        </div>

        <div className="flex gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Buscar ideias..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline">
            <Filter className="mr-2 h-4 w-4" />
            Filtros
          </Button>
        </div>

        {filteredIdeas.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground text-lg mb-4">
              {searchTerm ? "Nenhuma ideia encontrada" : "Nenhuma ideia cadastrada ainda"}
            </p>
            {!searchTerm && (
              <Button onClick={handleNewIdea}>
                <Plus className="mr-2 h-4 w-4" />
                Criar Primeira Ideia
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredIdeas.map((idea) => (
              <IdeaCard
                key={idea.id}
                idea={idea}
                onEdit={handleEditIdea}
                onDelete={handleDeleteIdea}
              />
            ))}
          </div>
        )}

        <IdeaDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          idea={selectedIdea}
          onSuccess={loadIdeas}
        />
      </div>
    </div>
  );
};

export default Ideas;