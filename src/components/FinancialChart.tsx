import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { BarChart3, TrendingUp } from 'lucide-react';

interface ChartData {
  date: string;
  expenses: number;
  income: number;
  balance: number;
}

interface Props {
  data: ChartData[];
}

export const FinancialChart = ({ data }: Props) => {
  const [chartType, setChartType] = useState<'line' | 'bar'>('bar');

  return (
    <Card className="p-6 border-primary/20 bg-card/50 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-foreground">Visualização Gráfica</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setChartType(chartType === 'bar' ? 'line' : 'bar')}
          className="border-primary/20"
        >
          {chartType === 'bar' ? <TrendingUp className="h-4 w-4 mr-2" /> : <BarChart3 className="h-4 w-4 mr-2" />}
          {chartType === 'bar' ? 'Ver Linha' : 'Ver Barras'}
        </Button>
      </div>

      <ResponsiveContainer width="100%" height={400}>
        {chartType === 'bar' ? (
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="date" 
              stroke="hsl(var(--muted-foreground))"
              style={{ fontSize: '12px' }}
            />
            <YAxis 
              stroke="hsl(var(--muted-foreground))"
              style={{ fontSize: '12px' }}
              tickFormatter={(value) => `R$ ${value.toLocaleString('pt-BR')}`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px'
              }}
              formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, '']}
            />
            <Legend />
            <Bar dataKey="expenses" name="Gastos" fill="hsl(0, 84%, 60%)" radius={[8, 8, 0, 0]} />
            <Bar dataKey="income" name="Entradas" fill="hsl(142, 76%, 36%)" radius={[8, 8, 0, 0]} />
          </BarChart>
        ) : (
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="date" 
              stroke="hsl(var(--muted-foreground))"
              style={{ fontSize: '12px' }}
            />
            <YAxis 
              stroke="hsl(var(--muted-foreground))"
              style={{ fontSize: '12px' }}
              tickFormatter={(value) => `R$ ${value.toLocaleString('pt-BR')}`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px'
              }}
              formatter={(value: number) => [`R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, '']}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="expenses" 
              name="Gastos" 
              stroke="hsl(0, 84%, 60%)" 
              strokeWidth={3}
              dot={{ fill: 'hsl(0, 84%, 60%)', r: 5 }}
            />
            <Line 
              type="monotone" 
              dataKey="income" 
              name="Entradas" 
              stroke="hsl(142, 76%, 36%)" 
              strokeWidth={3}
              dot={{ fill: 'hsl(142, 76%, 36%)', r: 5 }}
            />
            <Line 
              type="monotone" 
              dataKey="balance" 
              name="Saldo" 
              stroke="hsl(var(--primary))" 
              strokeWidth={3}
              dot={{ fill: 'hsl(var(--primary))', r: 5 }}
              strokeDasharray="5 5"
            />
          </LineChart>
        )}
      </ResponsiveContainer>
    </Card>
  );
};
