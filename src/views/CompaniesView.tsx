import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CompanyCard } from "@/components/companies/CompanyCard";
import { Company, Scenario, Sprint } from "@/types/bdd";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface CompaniesViewProps {
  companies: Company[];
  scenarios: Scenario[];
  sprints: Sprint[];
  onAddCompany: (company: Omit<Company, "id" | "createdAt">) => void;
  onEditCompany: (id: string, updates: Partial<Company>) => void;
  onDeleteCompany: (id: string) => void;
}

export function CompaniesView({
  companies,
  scenarios,
  sprints,
  onAddCompany,
  onEditCompany,
  onDeleteCompany,
}: CompaniesViewProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const openCreateDialog = () => {
    setEditingCompany(null);
    setName("");
    setDescription("");
    setIsDialogOpen(true);
  };

  const openEditDialog = (company: Company) => {
    setEditingCompany(company);
    setName(company.name);
    setDescription(company.description || "");
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (!name.trim()) return;

    if (editingCompany) {
      onEditCompany(editingCompany.id, { name, description });
    } else {
      onAddCompany({ name, description });
    }
    setIsDialogOpen(false);
  };

  const getCompanyStats = (companyId: string) => ({
    scenarioCount: scenarios.filter((s) => s.companyId === companyId).length,
    sprintCount: sprints.filter((s) => s.companyId === companyId).length,
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground">Empresas</h1>
          <p className="text-muted-foreground">Gerencie as empresas e seus projetos de teste</p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Empresa
        </Button>
      </div>

      {/* Companies Grid */}
      {companies.length === 0 ? (
        <div className="glass-card rounded-xl p-12 text-center">
          <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Plus className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            Nenhuma empresa cadastrada
          </h3>
          <p className="text-muted-foreground mb-6">
            Comece adicionando sua primeira empresa para organizar os cenários de teste.
          </p>
          <Button onClick={openCreateDialog}>
            <Plus className="h-4 w-4 mr-2" />
            Criar Primeira Empresa
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {companies.map((company, index) => {
            const stats = getCompanyStats(company.id);
            return (
              <div
                key={company.id}
                className="animate-slide-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CompanyCard
                  company={company}
                  scenarioCount={stats.scenarioCount}
                  sprintCount={stats.sprintCount}
                  onSelect={() => {}}
                  onEdit={openEditDialog}
                  onDelete={(c) => onDeleteCompany(c.id)}
                />
              </div>
            );
          })}
        </div>
      )}

      {/* Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingCompany ? "Editar Empresa" : "Nova Empresa"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome da Empresa</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: TechCorp Brasil"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Descrição (opcional)</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Breve descrição do projeto ou produto"
                rows={3}
              />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>
              {editingCompany ? "Salvar" : "Criar Empresa"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
