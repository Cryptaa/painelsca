import { Badge } from "@/components/ui/badge";

interface StatusBadgeProps {
  status: 'active' | 'paused' | 'completed';
}

export const StatusBadge = ({ status }: StatusBadgeProps) => {
  const config = {
    active: { label: 'Ativo', className: 'bg-green-500/10 text-green-500 border-green-500/20' },
    paused: { label: 'Pausado', className: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' },
    completed: { label: 'Concluído', className: 'bg-blue-500/10 text-blue-500 border-blue-500/20' }
  };

  const { label, className } = config[status];

  return (
    <Badge variant="outline" className={className}>
      {label}
    </Badge>
  );
};
