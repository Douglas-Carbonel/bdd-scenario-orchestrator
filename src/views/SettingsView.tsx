import { useState } from "react";
import { Settings, Code2, GitBranch, Database, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExportDialog } from "@/components/export/ExportDialog";
import { Company, Sprint, Scenario } from "@/types/bdd";

interface SettingsViewProps {
  companies: Company[];
  sprints: Sprint[];
  scenarios: Scenario[];
}

export function SettingsView({ companies, sprints, scenarios }: SettingsViewProps) {
  const [exportDialogOpen, setExportDialogOpen] = useState(false);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground">Configurações</h1>
        <p className="text-muted-foreground">Gerencie as configurações e integrações do 4QA</p>
      </div>

      {/* Integration Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Cypress Integration */}
        <div className="glass-card rounded-xl p-6 glow-border">
          <div className="flex items-start justify-between mb-4">
            <div className="h-12 w-12 rounded-xl bg-accent/10 flex items-center justify-center">
              <Code2 className="h-6 w-6 text-accent" />
            </div>
            <Badge variant="outline" className="text-warning border-warning/50">
              Em breve
            </Badge>
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">Integração Cypress</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Sincronize seus cenários BDD diretamente com o Cypress. Gere arquivos .feature e
            execute os testes automaticamente.
          </p>
          <div className="space-y-2 text-sm text-muted-foreground mb-4">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              <span>Geração automática de step definitions</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              <span>Execução de testes via CI/CD</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              <span>Relatórios de execução em tempo real</span>
            </div>
          </div>
          <Button variant="secondary" disabled className="w-full">
            Configurar Cypress
          </Button>
        </div>

        {/* Git Integration */}
        <div className="glass-card rounded-xl p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center">
              <GitBranch className="h-6 w-6 text-muted-foreground" />
            </div>
            <Badge variant="outline" className="text-muted-foreground border-muted">
              Planejado
            </Badge>
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">Integração Git</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Versione seus cenários BDD diretamente no repositório do projeto. Mantenha tudo
            sincronizado com o código.
          </p>
          <Button variant="outline" disabled className="w-full">
            Em desenvolvimento
          </Button>
        </div>

        {/* Database Sync */}
        <div className="glass-card rounded-xl p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center">
              <Database className="h-6 w-6 text-muted-foreground" />
            </div>
            <Badge variant="outline" className="text-muted-foreground border-muted">
              Planejado
            </Badge>
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">Persistência de Dados</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Conecte a um banco de dados para persistir seus cenários, sprints e resultados de
            execução.
          </p>
          <Button variant="outline" disabled className="w-full">
            Em desenvolvimento
          </Button>
        </div>

        {/* Export Options */}
        <div className="glass-card rounded-xl p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Settings className="h-6 w-6 text-primary" />
            </div>
            <Badge className="bg-primary/20 text-primary">Disponível</Badge>
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">Exportar Cenários</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Exporte seus cenários em formato .feature (Gherkin) para usar em qualquer framework
            de testes BDD.
          </p>
          <Button variant="default" className="w-full" onClick={() => setExportDialogOpen(true)}>
            Exportar como .feature
          </Button>
        </div>
      </div>

      {/* Info Section */}
      <div className="glass-card rounded-xl p-6 border-primary/30">
        <div className="flex items-start gap-4">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Zap className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground mb-1">Próximos Passos</h3>
            <p className="text-sm text-muted-foreground">
              Estamos trabalhando na integração com Cypress e outras ferramentas de teste.
              Para sincronização de dados e colaboração em equipe, ative o Supabase nas
              configurações do projeto.
            </p>
          </div>
        </div>
      </div>

      <ExportDialog
        open={exportDialogOpen}
        onOpenChange={setExportDialogOpen}
        scenarios={scenarios}
        companies={companies}
        sprints={sprints}
      />
    </div>
  );
}
