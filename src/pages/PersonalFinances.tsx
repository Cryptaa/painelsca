import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { fromZonedTime, toZonedTime } from "date-fns-tz";
import { ArrowLeft, Plus, TrendingDown, TrendingUp, DollarSign, Calendar, Trash2, Filter } from "lucide-react";
import { toast } from "sonner";
import { User } from "@supabase/supabase-js";

const EXPENSE_CATEGORIES = [
  "Alimentação",
  "Locomoção / Transporte",
  "Gastos Fixos / Contas Mensais",
  "Educação / Cursos",
  "Saúde / Bem-estar",
  "Lazer / Entretenimento",
  "Compras / Roupas / Acessórios",
  "Investimentos / Finanças",
  "Presentes / Doações",
  "Pagamentos de dívidas / Empréstimos",
  "Manutenção / Casa / Carro",
  "Impostos / Taxas",
  "Outras saídas"
];

const INCOME_CATEGORIES = [
  "Salário / Pró-labore",
  "Vendas / Negócios",
  "Freelas / Serviços",
  "Investimentos",
  "Aluguéis / Imóveis",
  "Bônus / Comissões",
  "Reembolsos",
  "Presentes / Doações",
  "Renda extra / Hobbies",
  "Prêmios / Sorteios",
  "Criptomoedas / Digital",
  "Outras entradas"
];

interface Transaction {
  id: string;
  amount: number;
  category: string;
  description: string;
  date: string;
  type: 'expense' | 'income';
}

const PersonalFinances = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [dateFilter, setDateFilter] = useState<'today' | 'week' | 'month' | 'custom'>('today');
  const [customStartDate, setCustomStartDate] = useState<Date>();
  const [customEndDate, setCustomEndDate] = useState<Date>();
  const [tempStartDate, setTempStartDate] = useState<Date>();
  const [tempEndDate, setTempEndDate] = useState<Date>();
  
  const [stats, setStats] = useState({
    totalExpenses: 0,
    totalIncome: 0,
    balance: 0
  });

  const [expenses, setExpenses] = useState<any[]>([]);
  const [incomes, setIncomes] = useState<any[]>([]);
  const [pendingPayments, setPendingPayments] = useState<any[]>([]);
  const [pendingReceipts, setPendingReceipts] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [showAllTransactions, setShowAllTransactions] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>("");

  // Dialog states
  const [expenseDialogOpen, setExpenseDialogOpen] = useState(false);
  const [incomeDialogOpen, setIncomeDialogOpen] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [receiptDialogOpen, setReceiptDialogOpen] = useState(false);

  // Form states
  const [expenseForm, setExpenseForm] = useState({ amount: "", category: "", description: "", date: format(new Date(), 'yyyy-MM-dd') });
  const [incomeForm, setIncomeForm] = useState({ amount: "", category: "", description: "", date: format(new Date(), 'yyyy-MM-dd') });
  const [paymentForm, setPaymentForm] = useState({ amount: "", category: "", description: "", due_date: "" });
  const [receiptForm, setReceiptForm] = useState({ amount: "", category: "", description: "", expected_date: "" });

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user, dateFilter, customStartDate, customEndDate]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      navigate("/auth");
    } else {
      setUser(session.user);
    }
  };

  const loadData = async () => {
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

    // Load expenses
    const { data: expensesData } = await (supabase as any)
      .from('personal_expenses')
      .select('*')
      .gte('date', startIso)
      .lte('date', endIso)
      .order('date', { ascending: false });

    // Load incomes
    const { data: incomesData } = await (supabase as any)
      .from('personal_incomes')
      .select('*')
      .gte('date', startIso)
      .lte('date', endIso)
      .order('date', { ascending: false });

    // Load pending payments
    const { data: paymentsData } = await (supabase as any)
      .from('personal_pending_payments')
      .select('*')
      .eq('completed', false)
      .order('due_date', { ascending: true });

    // Load pending receipts
    const { data: receiptsData } = await (supabase as any)
      .from('personal_pending_receipts')
      .select('*')
      .eq('completed', false)
      .order('expected_date', { ascending: true });

    setExpenses(expensesData || []);
    setIncomes(incomesData || []);
    setPendingPayments(paymentsData || []);
    setPendingReceipts(receiptsData || []);

    const totalExpenses = (expensesData || []).reduce((sum: number, exp: any) => sum + Number(exp.amount), 0);
    const totalIncome = (incomesData || []).reduce((sum: number, inc: any) => sum + Number(inc.amount), 0);

    setStats({
      totalExpenses,
      totalIncome,
      balance: totalIncome - totalExpenses
    });

    // Create transactions list
    const allTransactions: Transaction[] = [
      ...(expensesData || []).map((exp: any) => ({
        id: exp.id,
        amount: Number(exp.amount),
        category: exp.category,
        description: exp.description || '',
        date: exp.date,
        type: 'expense' as const
      })),
      ...(incomesData || []).map((inc: any) => ({
        id: inc.id,
        amount: Number(inc.amount),
        category: inc.category,
        description: inc.description || '',
        date: inc.date,
        type: 'income' as const
      }))
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    setTransactions(allTransactions);
  };

  const handleAddExpense = async () => {
    if (!expenseForm.amount || !expenseForm.category) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    const { error } = await (supabase as any)
      .from('personal_expenses')
      .insert({
        user_id: user?.id,
        amount: parseFloat(expenseForm.amount),
        category: expenseForm.category,
        description: expenseForm.description,
        date: new Date(expenseForm.date).toISOString()
      });

    if (error) {
      toast.error('Erro ao adicionar gasto');
    } else {
      toast.success('Gasto adicionado!');
      setExpenseDialogOpen(false);
      setExpenseForm({ amount: "", category: "", description: "", date: format(new Date(), 'yyyy-MM-dd') });
      loadData();
    }
  };

  const handleAddIncome = async () => {
    if (!incomeForm.amount || !incomeForm.category) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    const { error } = await (supabase as any)
      .from('personal_incomes')
      .insert({
        user_id: user?.id,
        amount: parseFloat(incomeForm.amount),
        category: incomeForm.category,
        description: incomeForm.description,
        date: new Date(incomeForm.date).toISOString()
      });

    if (error) {
      toast.error('Erro ao adicionar entrada');
    } else {
      toast.success('Entrada adicionada!');
      setIncomeDialogOpen(false);
      setIncomeForm({ amount: "", category: "", description: "", date: format(new Date(), 'yyyy-MM-dd') });
      loadData();
    }
  };

  const handleAddPayment = async () => {
    if (!paymentForm.amount || !paymentForm.category || !paymentForm.due_date) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    const { error } = await (supabase as any)
      .from('personal_pending_payments')
      .insert({
        user_id: user?.id,
        amount: parseFloat(paymentForm.amount),
        category: paymentForm.category,
        description: paymentForm.description,
        due_date: new Date(paymentForm.due_date).toISOString()
      });

    if (error) {
      toast.error('Erro ao adicionar pagamento pendente');
    } else {
      toast.success('Pagamento pendente adicionado!');
      setPaymentDialogOpen(false);
      setPaymentForm({ amount: "", category: "", description: "", due_date: "" });
      loadData();
    }
  };

  const handleAddReceipt = async () => {
    if (!receiptForm.amount || !receiptForm.category || !receiptForm.expected_date) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    const { error } = await (supabase as any)
      .from('personal_pending_receipts')
      .insert({
        user_id: user?.id,
        amount: parseFloat(receiptForm.amount),
        category: receiptForm.category,
        description: receiptForm.description,
        expected_date: new Date(receiptForm.expected_date).toISOString()
      });

    if (error) {
      toast.error('Erro ao adicionar recebimento pendente');
    } else {
      toast.success('Recebimento pendente adicionado!');
      setReceiptDialogOpen(false);
      setReceiptForm({ amount: "", category: "", description: "", expected_date: "" });
      loadData();
    }
  };

  const handleDeleteTransaction = async (id: string, type: 'expense' | 'income') => {
    const table = type === 'expense' ? 'personal_expenses' : 'personal_incomes';
    const { error } = await (supabase as any)
      .from(table)
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Erro ao excluir transação');
    } else {
      toast.success('Transação excluída!');
      loadData();
    }
  };

  const handleTogglePayment = async (id: string, completed: boolean) => {
    const { error } = await (supabase as any)
      .from('personal_pending_payments')
      .update({ completed })
      .eq('id', id);

    if (error) {
      toast.error('Erro ao atualizar pagamento');
    } else {
      loadData();
    }
  };

  const handleToggleReceipt = async (id: string, completed: boolean) => {
    const { error } = await (supabase as any)
      .from('personal_pending_receipts')
      .update({ completed })
      .eq('id', id);

    if (error) {
      toast.error('Erro ao atualizar recebimento');
    } else {
      loadData();
    }
  };

  const filteredTransactions = categoryFilter
    ? transactions.filter(t => t.category === categoryFilter)
    : transactions;

  const displayedTransactions = showAllTransactions
    ? filteredTransactions
    : filteredTransactions.slice(0, 10);

  const allCategories = Array.from(new Set([...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES]));

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-primary/20 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className="text-xl sm:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
                Gestão de Finanças Pessoais
              </h1>
            </div>
            <Button
              onClick={() => navigate("/")}
              variant="outline"
              className="border-primary/20 w-full sm:w-auto"
            >
              Mudar para Gestão de Projetos
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8">
        {/* Dash Principal */}
        <section>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <h2 className="text-xl sm:text-2xl font-bold text-foreground">Resumo</h2>
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
                    {customStartDate && customEndDate 
                      ? `${format(customStartDate, 'dd/MM/yy')} - ${format(customEndDate, 'dd/MM/yy')}`
                      : "Selecionar datas"}
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

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
            <Card className="p-4 sm:p-6 border-red-500/20 bg-red-500/5">
              <div className="flex items-center gap-3 mb-2">
                <TrendingDown className="h-5 w-5 text-red-500" />
                <p className="text-sm text-muted-foreground">Saídas</p>
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-red-500">
                R$ {stats.totalExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </Card>

            <Card className="p-4 sm:p-6 border-green-500/20 bg-green-500/5">
              <div className="flex items-center gap-3 mb-2">
                <TrendingUp className="h-5 w-5 text-green-500" />
                <p className="text-sm text-muted-foreground">Entradas</p>
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-green-500">
                R$ {stats.totalIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </Card>

            <Card className={`p-4 sm:p-6 ${stats.balance >= 0 ? 'border-green-500/20 bg-green-500/5' : 'border-red-500/20 bg-red-500/5'}`}>
              <div className="flex items-center gap-3 mb-2">
                <DollarSign className={`h-5 w-5 ${stats.balance >= 0 ? 'text-green-500' : 'text-red-500'}`} />
                <p className="text-sm text-muted-foreground">Resultado</p>
              </div>
              <p className={`text-2xl sm:text-3xl font-bold ${stats.balance >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                R$ {stats.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </Card>
          </div>
        </section>

        {/* Gastos e Entradas */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Gastos */}
          <Card className="p-4 sm:p-6 border-primary/20">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg sm:text-xl font-bold text-foreground">Gastos</h3>
              <Dialog open={expenseDialogOpen} onOpenChange={setExpenseDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Adicionar Gasto</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Valor (R$)*</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={expenseForm.amount}
                        onChange={(e) => setExpenseForm({...expenseForm, amount: e.target.value})}
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <Label>Categoria*</Label>
                      <Select value={expenseForm.category} onValueChange={(v) => setExpenseForm({...expenseForm, category: v})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          {EXPENSE_CATEGORIES.map(cat => (
                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Descrição</Label>
                      <Textarea
                        value={expenseForm.description}
                        onChange={(e) => setExpenseForm({...expenseForm, description: e.target.value})}
                        placeholder="Descreva o gasto..."
                      />
                    </div>
                    <div>
                      <Label>Data*</Label>
                      <Input
                        type="date"
                        value={expenseForm.date}
                        onChange={(e) => setExpenseForm({...expenseForm, date: e.target.value})}
                      />
                    </div>
                    <Button onClick={handleAddExpense} className="w-full">Adicionar Gasto</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {expenses.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">Nenhum gasto registrado</p>
              ) : (
                expenses.map(exp => (
                  <div key={exp.id} className="p-3 rounded-lg bg-background border border-primary/10 flex items-center justify-between">
                    <div>
                      <p className="font-medium">{exp.category}</p>
                      {exp.description && <p className="text-sm text-muted-foreground">{exp.description}</p>}
                      <p className="text-xs text-muted-foreground">{format(new Date(exp.date), 'dd/MM/yyyy')}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="text-red-500 font-bold">-R$ {Number(exp.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteTransaction(exp.id, 'expense')}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>

          {/* Entradas */}
          <Card className="p-4 sm:p-6 border-primary/20">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg sm:text-xl font-bold text-foreground">Entradas</h3>
              <Dialog open={incomeDialogOpen} onOpenChange={setIncomeDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Adicionar Entrada</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Valor (R$)*</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={incomeForm.amount}
                        onChange={(e) => setIncomeForm({...incomeForm, amount: e.target.value})}
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <Label>Categoria*</Label>
                      <Select value={incomeForm.category} onValueChange={(v) => setIncomeForm({...incomeForm, category: v})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          {INCOME_CATEGORIES.map(cat => (
                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Descrição</Label>
                      <Textarea
                        value={incomeForm.description}
                        onChange={(e) => setIncomeForm({...incomeForm, description: e.target.value})}
                        placeholder="Descreva a entrada..."
                      />
                    </div>
                    <div>
                      <Label>Data*</Label>
                      <Input
                        type="date"
                        value={incomeForm.date}
                        onChange={(e) => setIncomeForm({...incomeForm, date: e.target.value})}
                      />
                    </div>
                    <Button onClick={handleAddIncome} className="w-full">Adicionar Entrada</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {incomes.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">Nenhuma entrada registrada</p>
              ) : (
                incomes.map(inc => (
                  <div key={inc.id} className="p-3 rounded-lg bg-background border border-primary/10 flex items-center justify-between">
                    <div>
                      <p className="font-medium">{inc.category}</p>
                      {inc.description && <p className="text-sm text-muted-foreground">{inc.description}</p>}
                      <p className="text-xs text-muted-foreground">{format(new Date(inc.date), 'dd/MM/yyyy')}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="text-green-500 font-bold">+R$ {Number(inc.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteTransaction(inc.id, 'income')}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </section>

        {/* Últimas Transações */}
        <section>
          <Card className="p-4 sm:p-6 border-primary/20">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <h3 className="text-lg sm:text-xl font-bold text-foreground">Últimas Transações</h3>
              <div className="flex gap-2">
                <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v === '__all__' ? '' : v)}>
                  <SelectTrigger className="w-full sm:w-48">
                    <Filter className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Filtrar por categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">Todas</SelectItem>
                    {allCategories.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {displayedTransactions.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Nenhuma transação encontrada</p>
              ) : (
                <>
                  {displayedTransactions.map(transaction => (
                    <div key={transaction.id} className="p-3 rounded-lg bg-background border border-primary/10 flex items-center justify-between">
                      <div>
                        <p className="font-medium">{transaction.category}</p>
                        {transaction.description && <p className="text-sm text-muted-foreground">{transaction.description}</p>}
                        <p className="text-xs text-muted-foreground">{format(new Date(transaction.date), 'dd/MM/yyyy HH:mm')}</p>
                      </div>
                      <p className={`font-bold ${transaction.type === 'income' ? 'text-green-500' : 'text-red-500'}`}>
                        {transaction.type === 'income' ? '+' : '-'}R$ {transaction.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  ))}
                  {filteredTransactions.length > 10 && (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => setShowAllTransactions(!showAllTransactions)}
                    >
                      {showAllTransactions ? 'Mostrar menos' : 'Mostrar extrato completo'}
                    </Button>
                  )}
                </>
              )}
            </div>
          </Card>
        </section>

        {/* Pagamentos e Recebimentos Pendentes */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pagamentos Pendentes */}
          <Card className="p-4 sm:p-6 border-primary/20">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg sm:text-xl font-bold text-foreground">Pagamentos Pendentes</h3>
              <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Adicionar Pagamento Pendente</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Valor (R$)*</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={paymentForm.amount}
                        onChange={(e) => setPaymentForm({...paymentForm, amount: e.target.value})}
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <Label>Categoria*</Label>
                      <Input
                        value={paymentForm.category}
                        onChange={(e) => setPaymentForm({...paymentForm, category: e.target.value})}
                        placeholder="Ex: Dívida cartão, Conta de luz..."
                      />
                    </div>
                    <div>
                      <Label>Descrição</Label>
                      <Textarea
                        value={paymentForm.description}
                        onChange={(e) => setPaymentForm({...paymentForm, description: e.target.value})}
                        placeholder="Descreva o pagamento..."
                      />
                    </div>
                    <div>
                      <Label>Data de Vencimento*</Label>
                      <Input
                        type="date"
                        value={paymentForm.due_date}
                        onChange={(e) => setPaymentForm({...paymentForm, due_date: e.target.value})}
                      />
                    </div>
                    <Button onClick={handleAddPayment} className="w-full">Adicionar</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {pendingPayments.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">Nenhum pagamento pendente</p>
              ) : (
                pendingPayments.map(payment => (
                  <div key={payment.id} className="p-3 rounded-lg bg-background border border-primary/10">
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={payment.completed}
                        onCheckedChange={(checked) => handleTogglePayment(payment.id, checked as boolean)}
                      />
                      <div className="flex-1">
                        <p className="font-medium">{payment.category}</p>
                        {payment.description && <p className="text-sm text-muted-foreground">{payment.description}</p>}
                        <p className="text-xs text-muted-foreground">Vencimento: {format(new Date(payment.due_date), 'dd/MM/yyyy')}</p>
                        <p className="text-red-500 font-bold mt-1">R$ {Number(payment.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>

          {/* Recebimentos Pendentes */}
          <Card className="p-4 sm:p-6 border-primary/20">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg sm:text-xl font-bold text-foreground">Recebimentos Pendentes</h3>
              <Dialog open={receiptDialogOpen} onOpenChange={setReceiptDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Adicionar Recebimento Pendente</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Valor (R$)*</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={receiptForm.amount}
                        onChange={(e) => setReceiptForm({...receiptForm, amount: e.target.value})}
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <Label>Categoria*</Label>
                      <Input
                        value={receiptForm.category}
                        onChange={(e) => setReceiptForm({...receiptForm, category: e.target.value})}
                        placeholder="Ex: Salário, Venda produto..."
                      />
                    </div>
                    <div>
                      <Label>Descrição</Label>
                      <Textarea
                        value={receiptForm.description}
                        onChange={(e) => setReceiptForm({...receiptForm, description: e.target.value})}
                        placeholder="Descreva o recebimento..."
                      />
                    </div>
                    <div>
                      <Label>Data Esperada*</Label>
                      <Input
                        type="date"
                        value={receiptForm.expected_date}
                        onChange={(e) => setReceiptForm({...receiptForm, expected_date: e.target.value})}
                      />
                    </div>
                    <Button onClick={handleAddReceipt} className="w-full">Adicionar</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {pendingReceipts.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">Nenhum recebimento pendente</p>
              ) : (
                pendingReceipts.map(receipt => (
                  <div key={receipt.id} className="p-3 rounded-lg bg-background border border-primary/10">
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={receipt.completed}
                        onCheckedChange={(checked) => handleToggleReceipt(receipt.id, checked as boolean)}
                      />
                      <div className="flex-1">
                        <p className="font-medium">{receipt.category}</p>
                        {receipt.description && <p className="text-sm text-muted-foreground">{receipt.description}</p>}
                        <p className="text-xs text-muted-foreground">Esperado para: {format(new Date(receipt.expected_date), 'dd/MM/yyyy')}</p>
                        <p className="text-green-500 font-bold mt-1">R$ {Number(receipt.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </section>
      </main>
    </div>
  );
};

export default PersonalFinances;