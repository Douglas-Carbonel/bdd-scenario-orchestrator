import { Building2, FlaskConical, Calendar, MoreVertical } from "lucide-react";
import { Company } from "@/types/bdd";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface CompanyCardProps {
  company: Company;
  scenarioCount: number;
  sprintCount: number;
  productCount?: number;
  onSelect: (company: Company) => void;
  onEdit: (company: Company) => void;
  onDelete: (company: Company) => void;
}

export function CompanyCard({ company, scenarioCount, sprintCount, productCount = 0, onSelect, onEdit, onDelete }: CompanyCardProps) {

  return (
    <div
      className="glass-card rounded-xl p-6 hover:border-primary/50 cursor-pointer transition-all duration-200 group"
      onClick={() => onSelect(company)}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
          <Building2 className="h-6 w-6 text-primary" />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(company); }}>
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive"
              onClick={(e) => { e.stopPropagation(); onDelete(company); }}
            >
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <h3 className="text-lg font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
        {company.name}
      </h3>
      {company.description && (
        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{company.description}</p>
      )}

      <div className="flex items-center gap-4 pt-4 border-t border-border text-sm text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <Building2 className="h-4 w-4" />
          <span>{productCount} produto{productCount !== 1 ? "s" : ""}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <FlaskConical className="h-4 w-4" />
          <span>{scenarioCount} cenários</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Calendar className="h-4 w-4" />
          <span>{sprintCount} sprints</span>
        </div>
      </div>
    </div>
  );
}
