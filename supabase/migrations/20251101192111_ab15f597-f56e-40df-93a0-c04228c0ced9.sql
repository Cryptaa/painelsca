-- Criar tabela de histórico financeiro de projetos
CREATE TABLE public.project_financial_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL,
  user_id UUID NOT NULL,
  date DATE NOT NULL,
  investment_amount NUMERIC NOT NULL DEFAULT 0,
  revenue_amount NUMERIC NOT NULL DEFAULT 0,
  net_profit NUMERIC NOT NULL DEFAULT 0,
  roi NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(project_id, date)
);

-- Enable RLS
ALTER TABLE public.project_financial_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own project financial history"
ON public.project_financial_history
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own project financial history"
ON public.project_financial_history
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own project financial history"
ON public.project_financial_history
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own project financial history"
ON public.project_financial_history
FOR DELETE
USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_project_financial_history_updated_at
BEFORE UPDATE ON public.project_financial_history
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Criar tabela de planos de assinatura disponíveis
CREATE TABLE public.subscription_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  duration_months INTEGER NOT NULL,
  price NUMERIC NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(name)
);

-- Inserir planos padrão
INSERT INTO public.subscription_plans (name, duration_months, price, description) VALUES
('Mensal', 1, 29.90, 'Assinatura mensal'),
('Trimestral', 3, 79.90, 'Assinatura trimestral com desconto'),
('Anual', 12, 299.90, 'Assinatura anual com maior desconto');

-- Alterar tabela de subscriptions para trial
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS is_trial BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS trial_end_at TIMESTAMP WITH TIME ZONE;

-- Enable realtime for tables that need it
ALTER PUBLICATION supabase_realtime ADD TABLE public.global_tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.personal_expenses;
ALTER PUBLICATION supabase_realtime ADD TABLE public.personal_incomes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.personal_pending_payments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.personal_pending_receipts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.project_financial_history;