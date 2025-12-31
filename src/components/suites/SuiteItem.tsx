import { useState } from "react";
import { ChevronRight, ChevronDown, Folder, FolderOpen, MoreVertical, Plus, GripVertical, FlaskConical } from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { SuiteTreeNode, Scenario } from "@/types/bdd";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface SuiteItemProps {
  node: SuiteTreeNode;
  level: number;
  selectedSuiteId: string | null;
  onSelect: (suiteId: string | null) => void;
  onAddChild: (parentId: string) => void;
  onEdit: (suite: SuiteTreeNode) => void;
  onDelete: (suiteId: string) => void;
  children?: React.ReactNode;
}

export function SuiteItem({
  node,
  level,
  selectedSuiteId,
  onSelect,
  onAddChild,
  onEdit,
  onDelete,
  children,
}: SuiteItemProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const isSelected = selectedSuiteId === node.id;
  const hasChildren = node.children.length > 0 || node.scenarios.length > 0;

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: node.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const scenarioCount = node.scenarios.length;
  const totalScenarios = countAllScenarios(node);

  return (
    <div ref={setNodeRef} style={style} className={cn(isDragging && "opacity-50")}>
      <div
        className={cn(
          "group flex items-center gap-1 py-1.5 px-2 rounded-lg cursor-pointer transition-colors",
          isSelected ? "bg-primary/20 text-primary" : "hover:bg-secondary/50",
          level > 0 && "ml-4"
        )}
        onClick={() => onSelect(node.id)}
      >
        {/* Drag Handle */}
        <button
          {...attributes}
          {...listeners}
          className="p-0.5 rounded opacity-0 group-hover:opacity-100 hover:bg-secondary cursor-grab active:cursor-grabbing"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="h-3 w-3 text-muted-foreground" />
        </button>

        {/* Expand/Collapse */}
        <button
          className="p-0.5 rounded hover:bg-secondary"
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded(!isExpanded);
          }}
        >
          {hasChildren ? (
            isExpanded ? (
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
            )
          ) : (
            <span className="w-3.5" />
          )}
        </button>

        {/* Folder Icon */}
        {isExpanded && hasChildren ? (
          <FolderOpen className="h-4 w-4 text-primary shrink-0" />
        ) : (
          <Folder className="h-4 w-4 text-muted-foreground shrink-0" />
        )}

        {/* Name */}
        <span className="flex-1 text-sm font-medium truncate">{node.name}</span>

        {/* Count Badge */}
        {totalScenarios > 0 && (
          <span className="text-xs text-muted-foreground bg-secondary px-1.5 py-0.5 rounded">
            {totalScenarios}
          </span>
        )}

        {/* Actions */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 opacity-0 group-hover:opacity-100"
            >
              <MoreVertical className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem onClick={() => onAddChild(node.id)}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Subpasta
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEdit(node)}>
              Renomear
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => onDelete(node.id)}
            >
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Children */}
      {isExpanded && hasChildren && (
        <div className="ml-2 border-l border-border/50">
          {children}
          {/* Show scenario count in folder */}
          {node.scenarios.length > 0 && (
            <div className="ml-6 py-1 px-2 flex items-center gap-2 text-xs text-muted-foreground">
              <FlaskConical className="h-3 w-3" />
              {node.scenarios.length} cenário{node.scenarios.length !== 1 ? "s" : ""}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function countAllScenarios(node: SuiteTreeNode): number {
  return (
    node.scenarios.length +
    node.children.reduce((acc, child) => acc + countAllScenarios(child), 0)
  );
}
