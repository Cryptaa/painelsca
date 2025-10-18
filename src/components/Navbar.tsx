interface NavbarProps {
  onNavigate: (section: string) => void;
}

export const Navbar = ({ onNavigate }: NavbarProps) => {
  const sections = [
    { id: 'financial-summary', label: 'Resumo Financeiro' },
    { id: 'projects', label: 'Projetos' },
    { id: 'tasks', label: 'Tarefas' },
    { id: 'notes', label: 'Anotações' },
    { id: 'learnings', label: 'Diário de Aprendizados' },
  ];

  return (
    <nav className="border-b border-primary/20 bg-card/80 backdrop-blur-sm sticky top-16 z-40">
      <div className="container mx-auto px-6">
        <div className="flex gap-1 overflow-x-auto no-scrollbar">
          {sections.map((section) => (
            <button
              key={section.id}
              onClick={() => onNavigate(section.id)}
              className="px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-primary/10 transition-colors whitespace-nowrap border-b-2 border-transparent hover:border-primary"
            >
              {section.label}
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
};