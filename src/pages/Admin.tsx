import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Trash2, ArrowLeft, Plus, Edit, Shield } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  is_admin: boolean;
  created_at: string;
}

interface Subscription {
  id: string;
  user_id: string;
  plan_name: string;
  status: string;
  start_date: string;
  end_date: string | null;
  price: number | null;
  notes: string | null;
  profiles: Profile;
}

const Admin = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [subDialogOpen, setSubDialogOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Form states
  const [subForm, setSubForm] = useState({
    plan_name: "",
    status: "active",
    price: "",
    notes: "",
    end_date: ""
  });

  const [profileForm, setProfileForm] = useState({
    full_name: "",
    phone: "",
    is_admin: false
  });

  useEffect(() => {
    checkAdminAndLoadData();
  }, []);

  // NOTE: This client-side check is for UX only.
  // Actual authorization is enforced by RLS policies on the backend.
  // The RLS policies prevent non-admin users from accessing sensitive data
  // even if they bypass this client-side check.
  const checkAdminAndLoadData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      navigate("/auth");
      return;
    }

    // Verificar se o usuário tem role de admin
    const { data: userRole } = await (supabase as any)
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!userRole) {
      toast({
        title: "Acesso negado",
        description: "Você não tem permissão para acessar esta página",
        variant: "destructive",
      });
      navigate("/");
      return;
    }

    setIsAdmin(true);
    await loadUsers();
    await loadSubscriptions();
  };

  const loadUsers = async () => {
    setLoading(true);
    
    // Buscar todos os profiles
    const { data: profilesData, error: profilesError } = await (supabase as any)
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (profilesError) {
      toast({
        title: "Erro ao carregar usuários",
        description: profilesError.message,
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    // Buscar todas as roles
    const { data: rolesData } = await (supabase as any)
      .from("user_roles")
      .select("user_id, role");

    // Combinar os dados
    const profilesWithRoles = (profilesData || []).map((profile: any) => {
      const userRoles = (rolesData || []).filter((r: any) => r.user_id === profile.id);
      return {
        ...profile,
        is_admin: userRoles.some((r: any) => r.role === 'admin')
      };
    });
    
    setProfiles(profilesWithRoles);
    setLoading(false);
  };

  const loadSubscriptions = async () => {
    const { data, error } = await (supabase as any)
      .from("subscriptions")
      .select(`
        *,
        profiles (*)
      `)
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        title: "Erro ao carregar assinaturas",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setSubscriptions(data || []);
    }
  };

  const handleDeleteUser = async (userId: string, email: string) => {
    if (!confirm(`Tem certeza que deseja excluir o usuário ${email}? Esta ação não pode ser desfeita.`)) {
      return;
    }

    const { error } = await supabase.auth.admin.deleteUser(userId);

    if (error) {
      toast({
        title: "Erro ao excluir usuário",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Usuário excluído",
        description: `O usuário ${email} foi excluído com sucesso`,
      });
      loadUsers();
      loadSubscriptions();
    }
  };

  const handleToggleAdmin = async (userId: string, isCurrentlyAdmin: boolean) => {
    if (isCurrentlyAdmin) {
      // Remover role de admin
      const { error } = await (supabase as any)
        .from("user_roles")
        .delete()
        .eq("user_id", userId)
        .eq("role", "admin");

      if (error) {
        toast({
          title: "Erro ao atualizar permissões",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Permissões atualizadas",
          description: "Usuário removido de administrador",
        });
        loadUsers();
      }
    } else {
      // Adicionar role de admin
      const { error } = await (supabase as any)
        .from("user_roles")
        .insert({ user_id: userId, role: "admin" });

      if (error) {
        toast({
          title: "Erro ao atualizar permissões",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Permissões atualizadas",
          description: "Usuário promovido a administrador",
        });
        loadUsers();
      }
    }
  };

  const handleEditProfile = (profile: Profile) => {
    setEditingProfile(profile);
    setProfileForm({
      full_name: profile.full_name || "",
      phone: profile.phone || "",
      is_admin: profile.is_admin
    });
    setProfileDialogOpen(true);
  };

  const handleSaveProfile = async () => {
    if (!editingProfile) return;

    // Validate inputs
    if (profileForm.full_name && profileForm.full_name.length > 100) {
      toast({
        title: "Erro de validação",
        description: "Nome muito longo (máximo 100 caracteres)",
        variant: "destructive",
      });
      return;
    }

    if (profileForm.phone && profileForm.phone.trim() && !/^\+?[1-9]\d{0,14}$/.test(profileForm.phone)) {
      toast({
        title: "Erro de validação",
        description: "Formato de telefone inválido",
        variant: "destructive",
      });
      return;
    }

    // Atualizar informações do perfil
    const { error: profileError } = await (supabase as any)
      .from("profiles")
      .update({
        full_name: profileForm.full_name?.trim() || null,
        phone: profileForm.phone?.trim() || null
      })
      .eq("id", editingProfile.id);

    if (profileError) {
      toast({
        title: "Erro ao atualizar perfil",
        description: profileError.message,
        variant: "destructive",
      });
      return;
    }

    // Atualizar role de admin se necessário
    const wasAdmin = editingProfile.is_admin;
    const willBeAdmin = profileForm.is_admin;

    if (wasAdmin !== willBeAdmin) {
      if (willBeAdmin) {
        // Adicionar role de admin
        const { error: roleError } = await (supabase as any)
          .from("user_roles")
          .insert({ user_id: editingProfile.id, role: "admin" });

        if (roleError) {
          toast({
            title: "Erro ao atualizar permissões",
            description: roleError.message,
            variant: "destructive",
          });
          return;
        }
      } else {
        // Remover role de admin
        const { error: roleError } = await (supabase as any)
          .from("user_roles")
          .delete()
          .eq("user_id", editingProfile.id)
          .eq("role", "admin");

        if (roleError) {
          toast({
            title: "Erro ao atualizar permissões",
            description: roleError.message,
            variant: "destructive",
          });
          return;
        }
      }
    }

    toast({
      title: "Perfil atualizado",
      description: "As informações foram atualizadas com sucesso",
    });
    setProfileDialogOpen(false);
    setEditingProfile(null);
    loadUsers();
  };

  const handleAddSubscription = async () => {
    if (!selectedUser) {
      toast({
        title: "Erro",
        description: "Selecione um usuário",
        variant: "destructive",
      });
      return;
    }

    // Validate inputs
    if (!subForm.plan_name?.trim()) {
      toast({
        title: "Erro de validação",
        description: "Nome do plano é obrigatório",
        variant: "destructive",
      });
      return;
    }

    if (subForm.plan_name.trim().length > 100) {
      toast({
        title: "Erro de validação",
        description: "Nome do plano deve ter no máximo 100 caracteres",
        variant: "destructive",
      });
      return;
    }

    const price = subForm.price ? parseFloat(subForm.price) : null;
    if (price !== null && (price < 0 || price > 999999.99)) {
      toast({
        title: "Erro de validação",
        description: "Preço inválido (deve estar entre 0 e 999999.99)",
        variant: "destructive",
      });
      return;
    }

    if (subForm.notes && subForm.notes.length > 1000) {
      toast({
        title: "Erro de validação",
        description: "Notas devem ter no máximo 1000 caracteres",
        variant: "destructive",
      });
      return;
    }

    const { error } = await (supabase as any)
      .from("subscriptions")
      .insert({
        user_id: selectedUser,
        plan_name: subForm.plan_name.trim(),
        status: subForm.status,
        price: price,
        notes: subForm.notes?.trim() || null,
        end_date: subForm.end_date || null
      });

    if (error) {
      toast({
        title: "Erro ao criar assinatura",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Assinatura criada",
        description: "A assinatura foi criada com sucesso",
      });
      setSubDialogOpen(false);
      setSelectedUser(null);
      setSubForm({
        plan_name: "",
        status: "active",
        price: "",
        notes: "",
        end_date: ""
      });
      loadSubscriptions();
    }
  };

  const handleDeleteSubscription = async (subId: string) => {
    if (!confirm("Tem certeza que deseja excluir esta assinatura?")) {
      return;
    }

    const { error } = await (supabase as any)
      .from("subscriptions")
      .delete()
      .eq("id", subId);

    if (error) {
      toast({
        title: "Erro ao excluir assinatura",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Assinatura excluída",
        description: "A assinatura foi excluída com sucesso",
      });
      loadSubscriptions();
    }
  };

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-4xl font-bold">Painel de Administração</h1>
            <p className="text-muted-foreground mt-2">Gerencie usuários e assinaturas</p>
          </div>
        </div>

        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="users">Usuários</TabsTrigger>
            <TabsTrigger value="subscriptions">Assinaturas</TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Usuários Cadastrados</CardTitle>
                <CardDescription>
                  Total de {profiles.length} usuário(s) no sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <p className="text-center py-8 text-muted-foreground">Carregando...</p>
                ) : profiles.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">Nenhum usuário encontrado</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Telefone</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Data de Criação</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {profiles.map((profile) => (
                        <TableRow key={profile.id}>
                          <TableCell className="font-medium">
                            {profile.full_name || "Sem nome"}
                          </TableCell>
                          <TableCell>{profile.email}</TableCell>
                          <TableCell>{profile.phone || "-"}</TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              profile.is_admin 
                                ? "bg-primary/20 text-primary" 
                                : "bg-muted text-muted-foreground"
                            }`}>
                              {profile.is_admin ? "Admin" : "Usuário"}
                            </span>
                          </TableCell>
                          <TableCell>
                            {format(new Date(profile.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex gap-2 justify-end">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEditProfile(profile)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleToggleAdmin(profile.id, profile.is_admin)}
                              >
                                <Shield className={`h-4 w-4 ${profile.is_admin ? 'text-primary' : 'text-muted-foreground'}`} />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteUser(profile.id, profile.email)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="subscriptions" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Assinaturas</CardTitle>
                  <CardDescription>
                    Gerencie as assinaturas dos usuários
                  </CardDescription>
                </div>
                <Dialog open={subDialogOpen} onOpenChange={setSubDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Nova Assinatura
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Nova Assinatura</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>Usuário</Label>
                        <Select value={selectedUser || ""} onValueChange={setSelectedUser}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione um usuário" />
                          </SelectTrigger>
                          <SelectContent>
                            {profiles.map(p => (
                              <SelectItem key={p.id} value={p.id}>
                                {p.email} - {p.full_name || "Sem nome"}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Nome do Plano</Label>
                        <Input
                          value={subForm.plan_name}
                          onChange={(e) => setSubForm({...subForm, plan_name: e.target.value})}
                          placeholder="Ex: Premium Mensal"
                        />
                      </div>
                      <div>
                        <Label>Status</Label>
                        <Select value={subForm.status} onValueChange={(v) => setSubForm({...subForm, status: v})}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">Ativo</SelectItem>
                            <SelectItem value="inactive">Inativo</SelectItem>
                            <SelectItem value="suspended">Suspenso</SelectItem>
                            <SelectItem value="cancelled">Cancelado</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Preço (R$)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={subForm.price}
                          onChange={(e) => setSubForm({...subForm, price: e.target.value})}
                          placeholder="99.90"
                        />
                      </div>
                      <div>
                        <Label>Data de Vencimento</Label>
                        <Input
                          type="date"
                          value={subForm.end_date}
                          onChange={(e) => setSubForm({...subForm, end_date: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label>Notas</Label>
                        <Input
                          value={subForm.notes}
                          onChange={(e) => setSubForm({...subForm, notes: e.target.value})}
                          placeholder="Observações sobre a assinatura"
                        />
                      </div>
                      <Button onClick={handleAddSubscription} className="w-full">
                        Criar Assinatura
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {subscriptions.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">Nenhuma assinatura encontrada</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Usuário</TableHead>
                        <TableHead>Plano</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Preço</TableHead>
                        <TableHead>Início</TableHead>
                        <TableHead>Vencimento</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {subscriptions.map((sub) => (
                        <TableRow key={sub.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{sub.profiles.email}</p>
                              <p className="text-sm text-muted-foreground">{sub.profiles.full_name}</p>
                            </div>
                          </TableCell>
                          <TableCell>{sub.plan_name}</TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              sub.status === 'active' ? 'bg-green-500/20 text-green-500' :
                              sub.status === 'suspended' ? 'bg-yellow-500/20 text-yellow-500' :
                              'bg-red-500/20 text-red-500'
                            }`}>
                              {sub.status === 'active' ? 'Ativo' :
                               sub.status === 'inactive' ? 'Inativo' :
                               sub.status === 'suspended' ? 'Suspenso' : 'Cancelado'}
                            </span>
                          </TableCell>
                          <TableCell>
                            {sub.price ? `R$ ${sub.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '-'}
                          </TableCell>
                          <TableCell>
                            {format(new Date(sub.start_date), "dd/MM/yyyy", { locale: ptBR })}
                          </TableCell>
                          <TableCell>
                            {sub.end_date ? format(new Date(sub.end_date), "dd/MM/yyyy", { locale: ptBR }) : '-'}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteSubscription(sub.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Dialog open={profileDialogOpen} onOpenChange={setProfileDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Perfil</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Nome Completo</Label>
                <Input
                  value={profileForm.full_name}
                  onChange={(e) => setProfileForm({...profileForm, full_name: e.target.value})}
                />
              </div>
              <div>
                <Label>Telefone</Label>
                <Input
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm({...profileForm, phone: e.target.value})}
                  placeholder="(00) 00000-0000"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={profileForm.is_admin}
                  onChange={(e) => setProfileForm({...profileForm, is_admin: e.target.checked})}
                  className="h-4 w-4"
                />
                <Label>Administrador</Label>
              </div>
              <Button onClick={handleSaveProfile} className="w-full">
                Salvar Alterações
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Admin;