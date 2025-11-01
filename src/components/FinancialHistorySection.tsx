import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { TrendingUp, History } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface FinancialHistory {
  id: string;
  date: string;
  investment_amount: number;
  revenue_amount: number;
  net_profit: number;
  roi: number;
}

interface Props {
  projectId: string;
}

export const FinancialHistorySection = ({ projectId }: Props) => {
  const [history, setHistory] = useState<FinancialHistory[]>([]);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    loadHistory();

    const channel = supabase
      .channel('financial-history-changes')
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'project_financial_history',
          filter: `project_id=eq.${projectId}`
        },
        () => loadHistory()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId]);

  const loadHistory = async () => {
    const { data } = await (supabase as any)
      .from('project_financial_history')
      .select('*')
      .eq('project_id', projectId)
      .order('date', { ascending: false });

    setHistory(data || []);
  };

  const displayedHistory = showAll ? history : history.slice(0, 5);

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <History className="h-6 w-6" />
          Histórico Financeiro
        </h2>
      </div>

      <Card className="p-6 border-primary/20 bg-card/50 backdrop-blur-sm">
        <div className="space-y-4">
          {displayedHistory.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Nenhum histórico financeiro registrado ainda
            </p>
          ) : (
            <>
              {displayedHistory.map((record) => (
                <div
                  key={record.id}
                  className="p-4 rounded-lg bg-background border border-primary/10 hover:border-primary/20 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <p className="font-medium text-foreground">
                        {format(new Date(record.date), "dd/MM/yy", { locale: ptBR })}
                      </p>
                      <div className="flex flex-wrap gap-3 mt-2 text-sm">
                        <span className="text-red-500">
                          Investimento: R$ {record.investment_amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                        <span className="text-green-500">
                          Faturamento: R$ {record.revenue_amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold ${record.net_profit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        Lucro: R$ {record.net_profit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        ROI: {record.roi.toFixed(2)}%
                      </p>
                    </div>
                  </div>
                </div>
              ))}

              {history.length > 5 && !showAll && (
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full border-primary/20">
                      Extrato Completo
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Histórico Financeiro Completo</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                      {history.map((record) => (
                        <div
                          key={record.id}
                          className="p-4 rounded-lg bg-background border border-primary/10"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div>
                              <p className="font-medium text-foreground">
                                {format(new Date(record.date), "dd/MM/yy", { locale: ptBR })}
                              </p>
                              <div className="flex flex-wrap gap-3 mt-2 text-sm">
                                <span className="text-red-500">
                                  Investimento: R$ {record.investment_amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </span>
                                <span className="text-green-500">
                                  Faturamento: R$ {record.revenue_amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </span>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className={`font-bold ${record.net_profit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                Lucro: R$ {record.net_profit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                ROI: {record.roi.toFixed(2)}%
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </>
          )}
        </div>
      </Card>
    </section>
  );
};
