-- Adicionar número do assinante na tabela subscriptions
ALTER TABLE public.subscriptions 
ADD COLUMN IF NOT EXISTS subscriber_number TEXT;

-- Criar tabela para tarefas globais (não vinculadas a projetos)
CREATE TABLE IF NOT EXISTS public.global_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS para global_tasks
ALTER TABLE public.global_tasks ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para global_tasks
CREATE POLICY "Users can view their own tasks"
ON public.global_tasks FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own tasks"
ON public.global_tasks FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tasks"
ON public.global_tasks FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tasks"
ON public.global_tasks FOR DELETE
USING (auth.uid() = user_id);

-- Trigger para atualizar updated_at em global_tasks
CREATE TRIGGER update_global_tasks_updated_at
BEFORE UPDATE ON public.global_tasks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Criar tabela para despesas pessoais
CREATE TABLE IF NOT EXISTS public.personal_expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL CHECK (amount > 0),
  category TEXT NOT NULL,
  description TEXT,
  date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS para personal_expenses
ALTER TABLE public.personal_expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own expenses"
ON public.personal_expenses FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own expenses"
ON public.personal_expenses FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own expenses"
ON public.personal_expenses FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own expenses"
ON public.personal_expenses FOR DELETE
USING (auth.uid() = user_id);

-- Criar tabela para receitas pessoais
CREATE TABLE IF NOT EXISTS public.personal_incomes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL CHECK (amount > 0),
  category TEXT NOT NULL,
  description TEXT,
  date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS para personal_incomes
ALTER TABLE public.personal_incomes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own incomes"
ON public.personal_incomes FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own incomes"
ON public.personal_incomes FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own incomes"
ON public.personal_incomes FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own incomes"
ON public.personal_incomes FOR DELETE
USING (auth.uid() = user_id);

-- Criar tabela para pagamentos pendentes
CREATE TABLE IF NOT EXISTS public.personal_pending_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL CHECK (amount > 0),
  category TEXT NOT NULL,
  description TEXT,
  due_date TIMESTAMP WITH TIME ZONE NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS para personal_pending_payments
ALTER TABLE public.personal_pending_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own pending payments"
ON public.personal_pending_payments FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own pending payments"
ON public.personal_pending_payments FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pending payments"
ON public.personal_pending_payments FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own pending payments"
ON public.personal_pending_payments FOR DELETE
USING (auth.uid() = user_id);

CREATE TRIGGER update_personal_pending_payments_updated_at
BEFORE UPDATE ON public.personal_pending_payments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Criar tabela para recebimentos pendentes
CREATE TABLE IF NOT EXISTS public.personal_pending_receipts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL CHECK (amount > 0),
  category TEXT NOT NULL,
  description TEXT,
  expected_date TIMESTAMP WITH TIME ZONE NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS para personal_pending_receipts
ALTER TABLE public.personal_pending_receipts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own pending receipts"
ON public.personal_pending_receipts FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own pending receipts"
ON public.personal_pending_receipts FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own pending receipts"
ON public.personal_pending_receipts FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own pending receipts"
ON public.personal_pending_receipts FOR DELETE
USING (auth.uid() = user_id);

CREATE TRIGGER update_personal_pending_receipts_updated_at
BEFORE UPDATE ON public.personal_pending_receipts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();