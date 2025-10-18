import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardCard } from "@/components/DashboardCard";
import { ProjectCard } from "@/components/ProjectCard";
import { PersonalNoteCard } from "@/components/PersonalNoteCard";
import { PersonalNoteDialog } from "@/components/PersonalNoteDialog";
import { LearningCard } from "@/components/LearningCard";
import { LearningDialog } from "@/components/LearningDialog";
import { AddRevenueDialog } from "@/components/AddRevenueDialog";
import { AddInvestmentDialog } from "@/components/AddInvestmentDialog";
import { CreateProjectDialog } from "@/components/CreateProjectDialog";
import { GlobalTasksSection } from "@/components/GlobalTasksSection";
import { Navbar } from "@/components/Navbar";
import { Wallet, TrendingUp, DollarSign, LogOut, Lightbulb, Settings, Calendar, FileText, Plus, Search, Tag, SortAsc, BookOpen, Filter, TrendingUpIcon, Star, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { User, Session } from "@supabase/supabase-js";
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { fromZonedTime, toZonedTime } from "date-fns-tz";
import { toast } from "sonner";

interface ProjectData {
  id: string;
  name: string;
  description?: string;
  status: 'active' | 'paused' | 'completed';
  totalInvestment: number;
  totalRevenue: number;
}

interface PersonalNote {
  id: string;
  title: string;
  content: string;
  tags?: string[];
  is_pinned: boolean;
  linked_project_id?: string;
  linked_idea_id?: string;
  reminder_date?: string;
  created_at: string;
  updated_at: string;
}

interface Learning {
  id: string;
  title: string;
  description: string;
  category: 'erro' | 'vitoria' | 'licao' | 'reflexao';
  tags?: string[];
  is_favorite: boolean;
  is_public: boolean;
  date: string;
  linked_project_id?: string;
  linked_idea_id?: string;
  created_at: string;
  updated_at: string;
}

const Index = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [dateFilter, setDateFilter] = useState<'today' | 'week' | 'month' | 'custom'>('today');
  const [customStartDate, setCustomStartDate] = useState<Date>();
  const [customEndDate, setCustomEndDate] = useState<Date>();
  const [tempStartDate, setTempStartDate] = useState<Date>();
  const [tempEndDate, setTempEndDate] = useState<Date>();
  const [totalStats, setTotalStats] = useState({
    totalInvestment: 0,
    totalRevenue: 0,
    totalProfit: 0
  });
  const [filteredStats, setFilteredStats] = useState({
    totalInvestment: 0,
    totalRevenue: 0,
    totalProfit: 0
  });
  
  // Personal Notes state
  const [personalNotes, setPersonalNotes] = useState<PersonalNote[]>([]);
  const [filteredNotes, setFilteredNotes] = useState<PersonalNote[]>([]);
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState<PersonalNote | null>(null);
  const [noteSearchQuery, setNoteSearchQuery] = useState("");
  const [noteTagFilter, setNoteTagFilter] = useState<string>("");
  const [noteSortBy, setNoteSortBy] = useState<'date' | 'title' | 'tag'>('date');
  const [allNoteTags, setAllNoteTags] = useState<string[]>([]);

  // Learnings state
  const [learnings, setLearnings] = useState<Learning[]>([]);
  const [filteredLearnings, setFilteredLearnings] = useState<Learning[]>([]);
  const [learningDialogOpen, setLearningDialogOpen] = useState(false);
  const [selectedLearning, setSelectedLearning] = useState<Learning | null>(null);
  const [learningSearchQuery, setLearningSearchQuery] = useState("");
  const [learningCategoryFilter, setLearningCategoryFilter] = useState<string>("");
  const [learningTagFilter, setLearningTagFilter] = useState<string>("");
  const [learningSortBy, setLearningSortBy] = useState<'date' | 'category' | 'favorite'>('date');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [allLearningTags, setAllLearningTags] = useState<string[]>([]);
  const [learningStats, setLearningStats] = useState({
    total: 0,
    erro: 0,
    vitoria: 0,
    licao: 0,
    reflexao: 0
  });

  // Refs for sections
  const financialSummaryRef = useRef<HTMLDivElement>(null);
  const projectsRef = useRef<HTMLDivElement>(null);
  const tasksRef = useRef<HTMLDivElement>(null);
  const notesRef = useRef<HTMLDivElement>(null);
  const learningsRef = useRef<HTMLDivElement>(null);

  const handleNavigate = (section: string) => {
    const refs = {
      'financial-summary': financialSummaryRef,
      'projects': projectsRef,
      'tasks': tasksRef,
      'notes': notesRef,
      'learnings': learningsRef
    };
    refs[section as keyof typeof refs]?.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session?.user) {
        navigate("/auth");
      } else {
        setUser(session.user);
        setSession(session);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) {
        navigate("/auth");
      } else {
        setUser(session.user);
        setSession(session);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  // Real-time updates
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'projects' },
        () => loadData()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'investments' },
        () => { loadData(); loadFilteredStats(); }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'revenues' },
        () => { loadData(); loadFilteredStats(); }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'personal_notes' },
        () => loadPersonalNotes()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'learnings' },
        () => loadLearnings()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  useEffect(() => {
    if (user) {
      checkAdmin();
      loadData();
      loadPersonalNotes();
      loadLearnings();
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadFilteredStats();
    }
  }, [user, dateFilter, customStartDate, customEndDate]);

  const checkAdmin = async () => {
    if (!user) return;
    
    const { data: userRole } = await (supabase as any)
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();
    
    if (userRole) {
      setIsAdmin(true);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const loadData = async () => {
    // Carregar projetos
    const { data: projectsData } = await (supabase as any)
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });

    if (!projectsData) return;

    // Calcular totais para cada projeto
    const projectsWithStats = await Promise.all(
      projectsData.map(async (project) => {
        // Total de investimentos
        const { data: investments } = await (supabase as any)
          .from('investments')
          .select('amount')
          .eq('project_id', project.id);
        
        const totalInvestment = investments?.reduce((sum, inv) => sum + Number(inv.amount), 0) || 0;

        // Total de faturamento (valor líquido)
        const { data: revenues } = await (supabase as any)
          .from('revenues')
          .select('net_amount')
          .eq('project_id', project.id);
        
        const totalRevenue = revenues?.reduce((sum, rev) => sum + Number(rev.net_amount), 0) || 0;

        return {
          ...project,
          totalInvestment,
          totalRevenue
        };
      })
    );

    setProjects(projectsWithStats as ProjectData[]);

    // Calcular totais gerais de TODOS OS TEMPOS
    const totalInv = projectsWithStats.reduce((sum, p) => sum + p.totalInvestment, 0);
    const totalRev = projectsWithStats.reduce((sum, p) => sum + p.totalRevenue, 0);
    
    setTotalStats({
      totalInvestment: totalInv,
      totalRevenue: totalRev,
      totalProfit: totalRev - totalInv
    });
  };

  const loadFilteredStats = async () => {
    const tz = 'America/Sao_Paulo';
    let startIso: string;
    let endIso: string;

    if (dateFilter === 'custom' && customStartDate && customEndDate) {
      const startStr = format(customStartDate, 'yyyy-MM-dd');
      const endStr = format(customEndDate, 'yyyy-MM-dd');
      startIso = fromZonedTime(`${startStr}T00:00:00`, tz).toISOString();
      endIso = fromZonedTime(`${endStr}T23:59:59.999`, tz).toISOString();
    } else {
      const now = new Date();
      const zoned = toZonedTime(now, tz);
      const startLocal = dateFilter === 'week'
        ? startOfWeek(zoned, { locale: ptBR })
        : dateFilter === 'month'
          ? startOfMonth(zoned)
          : startOfDay(zoned);
      const endLocal = dateFilter === 'week'
        ? endOfWeek(zoned, { locale: ptBR })
        : dateFilter === 'month'
          ? endOfMonth(zoned)
          : endOfDay(zoned);
      startIso = fromZonedTime(startLocal, tz).toISOString();
      endIso = fromZonedTime(endLocal, tz).toISOString();
    }

    const { data: revenues } = await (supabase as any)
      .from('revenues')
      .select('net_amount')
      .gte('date', startIso)
      .lte('date', endIso);

    const { data: investments } = await (supabase as any)
      .from('investments')
      .select('amount')
      .gte('date', startIso)
      .lte('date', endIso);

    const filteredRevenue = revenues?.reduce((sum, rev) => sum + Number(rev.net_amount), 0) || 0;
    const filteredInvestment = investments?.reduce((sum, inv) => sum + Number(inv.amount), 0) || 0;

    setFilteredStats({
      totalInvestment: filteredInvestment,
      totalRevenue: filteredRevenue,
      totalProfit: filteredRevenue - filteredInvestment
    });
  };

  // Personal Notes functions
  const loadPersonalNotes = async () => {
    const { data } = await (supabase as any)
      .from('personal_notes')
      .select('*')
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false });

    if (data) {
      setPersonalNotes(data);
      
      // Extract all unique tags
      const tags = new Set<string>();
      data.forEach((note: PersonalNote) => {
        note.tags?.forEach(tag => tags.add(tag));
      });
      setAllNoteTags(Array.from(tags).sort());
    }
  };

  const handleNoteEdit = (id: string) => {
    const note = personalNotes.find(n => n.id === id);
    setSelectedNote(note || null);
    setNoteDialogOpen(true);
  };

  const handleNoteDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta anotação?')) return;

    const { error } = await (supabase as any)
      .from('personal_notes')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Erro ao excluir anotação');
    } else {
      toast.success('Anotação excluída!');
      loadPersonalNotes();
    }
  };

  const handleNoteDuplicate = async (id: string) => {
    const note = personalNotes.find(n => n.id === id);
    if (!note) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await (supabase as any)
      .from('personal_notes')
      .insert({
        title: `${note.title} (cópia)`,
        content: note.content,
        tags: note.tags,
        user_id: user.id,
        linked_project_id: note.linked_project_id,
        linked_idea_id: note.linked_idea_id,
      });

    if (error) {
      toast.error('Erro ao duplicar anotação');
    } else {
      toast.success('Anotação duplicada!');
      loadPersonalNotes();
    }
  };

  const handleNoteTogglePin = async (id: string, isPinned: boolean) => {
    const { error } = await (supabase as any)
      .from('personal_notes')
      .update({ is_pinned: isPinned })
      .eq('id', id);

    if (error) {
      toast.error('Erro ao fixar anotação');
    } else {
      loadPersonalNotes();
    }
  };

  // Learnings functions
  const loadLearnings = async () => {
    const { data } = await (supabase as any)
      .from('learnings')
      .select('*')
      .order('date', { ascending: false });

    if (data) {
      setLearnings(data);
      
      // Extract all unique tags
      const tags = new Set<string>();
      data.forEach((learning: Learning) => {
        learning.tags?.forEach(tag => tags.add(tag));
      });
      setAllLearningTags(Array.from(tags).sort());

      // Calculate stats
      const stats = {
        total: data.length,
        erro: data.filter((l: Learning) => l.category === 'erro').length,
        vitoria: data.filter((l: Learning) => l.category === 'vitoria').length,
        licao: data.filter((l: Learning) => l.category === 'licao').length,
        reflexao: data.filter((l: Learning) => l.category === 'reflexao').length
      };
      setLearningStats(stats);
    }
  };

  const handleLearningEdit = (id: string) => {
    const learning = learnings.find(l => l.id === id);
    setSelectedLearning(learning || null);
    setLearningDialogOpen(true);
  };

  const handleLearningDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este aprendizado?')) return;

    const { error } = await (supabase as any)
      .from('learnings')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Erro ao excluir aprendizado');
    } else {
      toast.success('Aprendizado excluído!');
      loadLearnings();
    }
  };

  const handleLearningDuplicate = async (id: string) => {
    const learning = learnings.find(l => l.id === id);
    if (!learning) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await (supabase as any)
      .from('learnings')
      .insert({
        title: `${learning.title} (cópia)`,
        description: learning.description,
        category: learning.category,
        tags: learning.tags,
        is_public: learning.is_public,
        is_favorite: false,
        date: new Date().toISOString(),
        user_id: user.id,
        linked_project_id: learning.linked_project_id,
        linked_idea_id: learning.linked_idea_id,
      });

    if (error) {
      toast.error('Erro ao duplicar aprendizado');
    } else {
      toast.success('Aprendizado duplicado!');
      loadLearnings();
    }
  };

  const handleLearningToggleFavorite = async (id: string, isFavorite: boolean) => {
    const { error } = await (supabase as any)
      .from('learnings')
      .update({ is_favorite: isFavorite })
      .eq('id', id);

    if (error) {
      toast.error('Erro ao favoritar aprendizado');
    } else {
      loadLearnings();
    }
  };

  // Filter and sort learnings
  useEffect(() => {
    let filtered = [...learnings];

    // Favorites filter
    if (showFavoritesOnly) {
      filtered = filtered.filter(learning => learning.is_favorite);
    }

    // Search filter
    if (learningSearchQuery) {
      const query = learningSearchQuery.toLowerCase();
      filtered = filtered.filter(learning =>
        learning.title.toLowerCase().includes(query) ||
        learning.description.toLowerCase().includes(query) ||
        learning.tags?.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Category filter
    if (learningCategoryFilter) {
      filtered = filtered.filter(learning =>
        learning.category === learningCategoryFilter
      );
    }

    // Tag filter
    if (learningTagFilter) {
      filtered = filtered.filter(learning =>
        learning.tags?.includes(learningTagFilter)
      );
    }

    // Sort
    filtered.sort((a, b) => {
      switch (learningSortBy) {
        case 'favorite':
          if (a.is_favorite !== b.is_favorite) {
            return a.is_favorite ? -1 : 1;
          }
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        case 'category':
          return a.category.localeCompare(b.category);
        case 'date':
        default:
          return new Date(b.date).getTime() - new Date(a.date).getTime();
      }
    });

    setFilteredLearnings(filtered);
  }, [learnings, learningSearchQuery, learningCategoryFilter, learningTagFilter, learningSortBy, showFavoritesOnly]);

  // Filter and sort notes
  useEffect(() => {
    let filtered = [...personalNotes];

    // Search filter
    if (noteSearchQuery) {
      const query = noteSearchQuery.toLowerCase();
      filtered = filtered.filter(note =>
        note.title.toLowerCase().includes(query) ||
        note.content.toLowerCase().includes(query) ||
        note.tags?.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Tag filter
    if (noteTagFilter) {
      filtered = filtered.filter(note =>
        note.tags?.includes(noteTagFilter)
      );
    }

    // Sort
    filtered.sort((a, b) => {
      // Pinned notes always first
      if (a.is_pinned !== b.is_pinned) {
        return a.is_pinned ? -1 : 1;
      }

      switch (noteSortBy) {
        case 'title':
          return a.title.localeCompare(b.title);
        case 'tag':
          const aTag = a.tags?.[0] || '';
          const bTag = b.tags?.[0] || '';
          return aTag.localeCompare(bTag);
        case 'date':
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

    setFilteredNotes(filtered);
  }, [personalNotes, noteSearchQuery, noteTagFilter, noteSortBy]);

  const handleDeleteProject = async (projectId: string) => {
    if (!confirm("Tem certeza que deseja excluir este projeto? Esta ação não pode ser desfeita.")) {
      return;
    }

    const { error } = await (supabase as any)
      .from("projects")
      .delete()
      .eq("id", projectId);

    if (error) {
      console.error("Erro ao excluir projeto:", error);
      alert("Erro ao excluir projeto");
    } else {
      loadData();
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-primary/20 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <h1 className="text-xl sm:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
              Gestão SCA
            </h1>
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() => navigate("/personal-finances")}
                variant="outline"
                className="border-primary/20 text-xs sm:text-sm"
              >
                Mudar para Gestão de Finanças Pessoais
              </Button>
              {isAdmin && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate("/admin")}
                  className="border-primary/20"
                >
                  <Shield className="mr-2 h-4 w-4" />
                  Admin
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/ideas")}
                className="border-primary/20"
              >
                <Lightbulb className="mr-2 h-4 w-4" />
                Ideias
              </Button>
              <AddRevenueDialog onSuccess={loadData} />
              <AddInvestmentDialog onSuccess={loadData} />
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="border-primary/20"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      <Navbar onNavigate={handleNavigate} />

      <main className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8">
        {/* Dashboard Cards */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 animate-fade-in">
          <DashboardCard
            title="Investimento Total"
            value={`R$ ${totalStats.totalInvestment.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
            icon={Wallet}
          />
          <DashboardCard
            title="Faturamento Bruto Total"
            value={`R$ ${totalStats.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
            icon={TrendingUp}
          />
          <DashboardCard
            title="Lucro Líquido Total"
            value={`R$ ${totalStats.totalProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
            icon={DollarSign}
            valueClassName={totalStats.totalProfit >= 0 ? "text-green-500" : "text-red-500"}
          />
        </section>

        {/* Visualization Section */}
        <section ref={financialSummaryRef} className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h2 className="text-2xl font-bold text-foreground">Resumo Financeiro</h2>
            <div className="flex flex-col sm:flex-row gap-2">
              <Select value={dateFilter} onValueChange={(value: any) => setDateFilter(value)}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Hoje</SelectItem>
                  <SelectItem value="week">Esta Semana</SelectItem>
                  <SelectItem value="month">Este Mês</SelectItem>
                  <SelectItem value="custom">Personalizado</SelectItem>
                </SelectContent>
              </Select>
              {dateFilter === 'custom' && (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="border-primary/20 w-full sm:w-auto">
                      <Calendar className="mr-2 h-4 w-4" />
                      <span className="truncate">
                        {customStartDate && customEndDate 
                          ? `${format(customStartDate, 'dd/MM/yy')} - ${format(customEndDate, 'dd/MM/yy')}`
                          : "Selecionar datas"}
                      </span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-4" align="end">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Data Inicial</label>
                        <CalendarComponent
                          mode="single"
                          selected={tempStartDate}
                          onSelect={setTempStartDate}
                          locale={ptBR}
                          className="rounded-md border"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Data Final</label>
                        <CalendarComponent
                          mode="single"
                          selected={tempEndDate}
                          onSelect={setTempEndDate}
                          locale={ptBR}
                          className="rounded-md border"
                          disabled={(date) => tempStartDate ? date < tempStartDate : false}
                        />
                      </div>
                      <Button 
                        onClick={() => {
                          if (tempStartDate && tempEndDate) {
                            setCustomStartDate(tempStartDate);
                            setCustomEndDate(tempEndDate);
                          }
                        }}
                        className="w-full"
                        disabled={!tempStartDate || !tempEndDate}
                      >
                        Confirmar
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>
              )}
            </div>
          </div>

          <Card className="p-6 border-primary/20 bg-card/50 backdrop-blur-sm">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-6 rounded-lg bg-primary/5 border border-primary/20">
                <p className="text-sm text-muted-foreground mb-2">Total Investido</p>
                <p className="text-3xl font-bold text-primary">
                  R$ {filteredStats.totalInvestment.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="text-center p-6 rounded-lg bg-primary/5 border border-primary/20">
                <p className="text-sm text-muted-foreground mb-2">Total Faturado</p>
                <p className="text-3xl font-bold text-primary">
                  R$ {filteredStats.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="text-center p-6 rounded-lg bg-primary/5 border border-primary/20">
                <p className="text-sm text-muted-foreground mb-2">Lucro Líquido</p>
                <p className={`text-3xl font-bold ${filteredStats.totalProfit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  R$ {filteredStats.totalProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </Card>
        </section>

        {/* Projects Section */}
        <section ref={projectsRef} className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-foreground">Projetos</h2>
            <CreateProjectDialog onSuccess={loadData} />
          </div>

          {projects.length === 0 ? (
            <Card className="p-12 border-primary/20 bg-card/50 backdrop-blur-sm">
              <div className="text-center text-muted-foreground">
                <p>Nenhum projeto criado ainda.</p>
                <p className="text-sm mt-2">Crie seu primeiro projeto para começar!</p>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {projects.map((project) => (
                <ProjectCard
                  key={project.id}
                  id={project.id}
                  name={project.name}
                  description={project.description}
                  status={project.status}
                  totalInvestment={project.totalInvestment}
                  totalRevenue={project.totalRevenue}
                  profit={project.totalRevenue - project.totalInvestment}
                  onDelete={handleDeleteProject}
                />
              ))}
            </div>
          )}
        </section>

        {/* Tasks Section */}
        <div ref={tasksRef}>
          <GlobalTasksSection />
        </div>

        {/* Personal Notes Section */}
        <section ref={notesRef} className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <FileText className="h-6 w-6" />
              Anotações
            </h2>
            <Button
              onClick={() => {
                setSelectedNote(null);
                setNoteDialogOpen(true);
              }}
              className="bg-primary text-primary-foreground"
            >
              <Plus className="mr-2 h-4 w-4" />
              Nova Anotação
            </Button>
          </div>

          {/* Search and Filters */}
          <Card className="p-4 border-primary/20 bg-card/50 backdrop-blur-sm">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por título, conteúdo ou tag..."
                  value={noteSearchQuery}
                  onChange={(e) => setNoteSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              
              <Select value={noteTagFilter} onValueChange={(v) => setNoteTagFilter(v === '__all__' ? '' : v)}>
                <SelectTrigger>
                  <Tag className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Filtrar por tag" />
                </SelectTrigger>
                <SelectContent className="bg-popover z-[60]">
                  <SelectItem value="__all__">Todas as tags</SelectItem>
                  {allNoteTags.map((tag) => (
                    <SelectItem key={tag} value={tag}>
                      {tag}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={noteSortBy} onValueChange={(value: any) => setNoteSortBy(value)}>
                <SelectTrigger>
                  <SortAsc className="mr-2 h-4 w-4" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">Data de criação</SelectItem>
                  <SelectItem value="title">Título</SelectItem>
                  <SelectItem value="tag">Tag</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </Card>

          {/* Notes Grid */}
          {filteredNotes.length === 0 ? (
            <Card className="p-12 border-primary/20 bg-card/50 backdrop-blur-sm">
              <div className="text-center text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">
                  {noteSearchQuery || noteTagFilter
                    ? 'Nenhuma anotação encontrada'
                    : 'Nenhuma anotação criada ainda'}
                </p>
                <p className="text-sm mt-2">
                  {noteSearchQuery || noteTagFilter
                    ? 'Tente ajustar os filtros de busca'
                    : 'Crie sua primeira anotação para começar!'}
                </p>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredNotes.map((note) => (
                <PersonalNoteCard
                  key={note.id}
                  id={note.id}
                  title={note.title}
                  content={note.content}
                  tags={note.tags}
                  isPinned={note.is_pinned}
                  reminderDate={note.reminder_date}
                  createdAt={note.created_at}
                  updatedAt={note.updated_at}
                  linkedProjectId={note.linked_project_id}
                  linkedIdeaId={note.linked_idea_id}
                  onEdit={handleNoteEdit}
                  onDelete={handleNoteDelete}
                  onDuplicate={handleNoteDuplicate}
                  onTogglePin={handleNoteTogglePin}
                />
              ))}
            </div>
          )}
        </section>

        {/* Learnings Section - Diário de Aprendizados */}
        <section ref={learningsRef} className="space-y-4 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <BookOpen className="h-6 w-6" />
              Diário de Aprendizados
            </h2>
            <div className="flex gap-2">
              <Button
                onClick={() => {
                  setSelectedLearning(null);
                  setLearningDialogOpen(true);
                }}
                className="bg-primary text-primary-foreground"
              >
                <Plus className="mr-2 h-4 w-4" />
                Novo Aprendizado
              </Button>
            </div>
          </div>

          {/* Statistics Cards */}
          {learningStats.total > 0 && (
            <Card className="p-6 border-primary/20 bg-card/50 backdrop-blur-sm">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="text-center p-4 rounded-lg bg-primary/5 border border-primary/20">
                  <p className="text-2xl font-bold text-primary">{learningStats.total}</p>
                  <p className="text-xs text-muted-foreground mt-1">Total</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-green-500/5 border border-green-500/20">
                  <p className="text-2xl font-bold text-green-500">{learningStats.vitoria}</p>
                  <p className="text-xs text-muted-foreground mt-1">🏆 Vitórias</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-blue-500/5 border border-blue-500/20">
                  <p className="text-2xl font-bold text-blue-500">{learningStats.licao}</p>
                  <p className="text-xs text-muted-foreground mt-1">📚 Lições</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-red-500/5 border border-red-500/20">
                  <p className="text-2xl font-bold text-red-500">{learningStats.erro}</p>
                  <p className="text-xs text-muted-foreground mt-1">❌ Erros</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-purple-500/5 border border-purple-500/20">
                  <p className="text-2xl font-bold text-purple-500">{learningStats.reflexao}</p>
                  <p className="text-xs text-muted-foreground mt-1">💭 Reflexões</p>
                </div>
              </div>
            </Card>
          )}

          {/* Search and Filters */}
          <Card className="p-4 border-primary/20 bg-card/50 backdrop-blur-sm">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar aprendizados..."
                  value={learningSearchQuery}
                  onChange={(e) => setLearningSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              
              <Select value={learningCategoryFilter} onValueChange={(v) => setLearningCategoryFilter(v === '__all__' ? '' : v)}>
                <SelectTrigger>
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent className="bg-popover z-[60]">
                  <SelectItem value="__all__">Todas</SelectItem>
                  <SelectItem value="erro">❌ Erros</SelectItem>
                  <SelectItem value="vitoria">🏆 Vitórias</SelectItem>
                  <SelectItem value="licao">📚 Lições</SelectItem>
                  <SelectItem value="reflexao">💭 Reflexões</SelectItem>
                </SelectContent>
              </Select>

              <Select value={learningTagFilter} onValueChange={(v) => setLearningTagFilter(v === '__all__' ? '' : v)}>
                <SelectTrigger>
                  <Tag className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Tag" />
                </SelectTrigger>
                <SelectContent className="bg-popover z-[60]">
                  <SelectItem value="__all__">Todas as tags</SelectItem>
                  {allLearningTags.map((tag) => (
                    <SelectItem key={tag} value={tag}>
                      {tag}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={learningSortBy} onValueChange={(value: any) => setLearningSortBy(value)}>
                <SelectTrigger>
                  <SortAsc className="mr-2 h-4 w-4" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover z-[60]">
                  <SelectItem value="date">Data</SelectItem>
                  <SelectItem value="category">Categoria</SelectItem>
                  <SelectItem value="favorite">Favoritos</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2 mt-3">
              <Button
                variant={showFavoritesOnly ? "default" : "outline"}
                size="sm"
                onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                className="border-primary/20"
              >
                <Star className={`mr-2 h-4 w-4 ${showFavoritesOnly ? 'fill-current' : ''}`} />
                {showFavoritesOnly ? 'Mostrando Favoritos' : 'Mostrar Favoritos'}
              </Button>
            </div>
          </Card>

          {/* Learnings Grid */}
          {filteredLearnings.length === 0 ? (
            <Card className="p-12 border-primary/20 bg-card/50 backdrop-blur-sm">
              <div className="text-center text-muted-foreground">
                <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">
                  {learningSearchQuery || learningCategoryFilter || learningTagFilter || showFavoritesOnly
                    ? 'Nenhum aprendizado encontrado'
                    : 'Nenhum aprendizado registrado ainda'}
                </p>
                <p className="text-sm mt-2">
                  {learningSearchQuery || learningCategoryFilter || learningTagFilter || showFavoritesOnly
                    ? 'Tente ajustar os filtros de busca'
                    : 'Comece a registrar seus aprendizados e acompanhe sua evolução!'}
                </p>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredLearnings.map((learning) => (
                <LearningCard
                  key={learning.id}
                  id={learning.id}
                  title={learning.title}
                  description={learning.description}
                  category={learning.category}
                  tags={learning.tags}
                  isFavorite={learning.is_favorite}
                  isPublic={learning.is_public}
                  date={learning.date}
                  linkedProjectId={learning.linked_project_id}
                  linkedIdeaId={learning.linked_idea_id}
                  onEdit={handleLearningEdit}
                  onDelete={handleLearningDelete}
                  onDuplicate={handleLearningDuplicate}
                  onToggleFavorite={handleLearningToggleFavorite}
                />
              ))}
            </div>
          )}
        </section>

        {/* Personal Note Dialog */}
        <PersonalNoteDialog
          open={noteDialogOpen}
          onOpenChange={setNoteDialogOpen}
          note={selectedNote}
          onSuccess={loadPersonalNotes}
        />

        {/* Learning Dialog */}
        <LearningDialog
          open={learningDialogOpen}
          onOpenChange={setLearningDialogOpen}
          learning={selectedLearning}
          onSuccess={loadLearnings}
        />

      </main>
    </div>
  );
};

export default Index;
