import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { User } from '@supabase/supabase-js';

interface SubscriptionPlan {
  id: string;
  name: string;
  duration_months: number;
  price: number;
  description: string;
}

const Subscriptions = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingPlan, setProcessingPlan] = useState<string | null>(null);

  useEffect(() => {
    checkAuth();
    loadPlans();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate('/auth');
    } else {
      setUser(user);
    }
  };

  const loadPlans = async () => {
    const { data } = await (supabase as any)
      .from('subscription_plans')
      .select('*')
      .eq('is_active', true)
      .order('duration_months', { ascending: true });

    setPlans(data || []);
    setLoading(false);
  };

  const handleSelectPlan = async (plan: SubscriptionPlan) => {
    if (!user) return;
    
    setProcessingPlan(plan.id);

    try {
      // TODO: Integrate with PIX payment API here
      // For now, we'll create a pending subscription
      
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + plan.duration_months);

      const { error } = await (supabase as any)
        .from('subscriptions')
        .insert({
          user_id: user.id,
          plan_name: plan.name,
          price: plan.price,
          status: 'waiting_payment',
          start_date: new Date().toISOString(),
          end_date: endDate.toISOString(),
          is_trial: false,
          notes: `Aguardando pagamento via PIX - R$ ${plan.price.toFixed(2)}`
        });

      if (error) throw error;

      toast.success('Assinatura iniciada! Aguardando pagamento via PIX.');
      toast.info('Por favor, realize o pagamento para ativar sua assinatura.');
      
      // TODO: Show PIX QR code and payment details
      
    } catch (error: any) {
      toast.error('Erro ao processar assinatura: ' + error.message);
    } finally {
      setProcessingPlan(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-primary/20 bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 sm:px-6 py-6">
          <h1 className="text-3xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
            Escolha seu Plano
          </h1>
          <p className="text-center text-muted-foreground mt-2">
            Selecione o plano ideal para você
          </p>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan) => (
            <Card 
              key={plan.id} 
              className={`p-8 border-2 ${
                plan.name === 'Anual' 
                  ? 'border-primary bg-primary/5' 
                  : 'border-primary/20'
              }`}
            >
              {plan.name === 'Anual' && (
                <div className="bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full mb-4 w-fit">
                  MELHOR VALOR
                </div>
              )}
              
              <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
              <div className="mb-4">
                <span className="text-4xl font-bold">
                  R$ {plan.price.toFixed(2)}
                </span>
                <span className="text-muted-foreground">
                  /{plan.duration_months === 1 ? 'mês' : `${plan.duration_months} meses`}
                </span>
              </div>
              
              <p className="text-muted-foreground mb-6">{plan.description}</p>
              
              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-green-500" />
                  <span>Acesso completo ao painel</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-green-500" />
                  <span>Gestão de projetos ilimitados</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-green-500" />
                  <span>Relatórios financeiros</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-green-500" />
                  <span>Suporte prioritário</span>
                </div>
              </div>

              <Button
                onClick={() => handleSelectPlan(plan)}
                disabled={processingPlan !== null}
                className="w-full"
                variant={plan.name === 'Anual' ? 'default' : 'outline'}
              >
                {processingPlan === plan.id ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processando...
                  </>
                ) : (
                  'Assinar Agora'
                )}
              </Button>
            </Card>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-muted-foreground">
            Pagamento seguro via PIX. Sua assinatura será ativada automaticamente após a confirmação do pagamento.
          </p>
        </div>
      </main>
    </div>
  );
};

export default Subscriptions;
