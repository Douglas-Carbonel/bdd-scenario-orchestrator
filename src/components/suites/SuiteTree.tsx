import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Plus, FolderPlus, Inbox } from "lucide-react";
import { SuiteTreeNode, TestSuite } from "@/types/bdd";
import { SuiteItem } from "./SuiteItem";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface SuiteTreeProps {
  tree: SuiteTreeNode[];
  selectedSuiteId: string | null;
  onSelect: (suiteId: string | null) => void;
  onAddSuite: (name: string, parentId: string | null) => void;
  onUpdateSuite: (id: string, updates: Partial<TestSuite>) => void;
  onDeleteSuite: (id: string) => void;
  onMoveSuite: (suiteId: string, newParentId: string | null, newOrder: number) => void;
  unsortedCount: number;
}

export function SuiteTree({
  tree,
  selectedSuiteId,
  onSelect,
  onAddSuite,
  onUpdateSuite,
  onDeleteSuite,
  onMoveSuite,
  unsortedCount,
}: SuiteTreeProps) {
  const { t } = useTranslation();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSuite, setEditingSuite] = useState<SuiteTreeNode | null>(null);
  const [parentIdForNew, setParentIdForNew] = useState<string | null>(null);
  const [suiteName, setSuiteName] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over || active.id === over.id) return;

    // Find the positions and move
    const activeNode = findNode(tree, active.id as string);
    const overNode = findNode(tree, over.id as string);

    if (activeNode && overNode) {
      // Move to same parent as over node, after it
      onMoveSuite(active.id as string, overNode.parentId, overNode.order + 1);
    }
  };

  const openCreateDialog = (parentId: string | null = null) => {
    setEditingSuite(null);
    setParentIdForNew(parentId);
    setSuiteName("");
    setIsDialogOpen(true);
  };

  const openEditDialog = (suite: SuiteTreeNode) => {
    setEditingSuite(suite);
    setParentIdForNew(null);
    setSuiteName(suite.name);
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (!suiteName.trim()) return;

    if (editingSuite) {
      onUpdateSuite(editingSuite.id, { name: suiteName });
    } else {
      onAddSuite(suiteName, parentIdForNew);
    }
    setIsDialogOpen(false);
    setSuiteName("");
  };

  const getAllIds = (nodes: SuiteTreeNode[]): string[] => {
    return nodes.flatMap((node) => [node.id, ...getAllIds(node.children)]);
  };

  const renderTree = (nodes: SuiteTreeNode[], level: number = 0): React.ReactNode => {
    return nodes.map((node) => (
      <SuiteItem
        key={node.id}
        node={node}
        level={level}
        selectedSuiteId={selectedSuiteId}
        onSelect={onSelect}
        onAddChild={(parentId) => openCreateDialog(parentId)}
        onEdit={openEditDialog}
        onDelete={onDeleteSuite}
      >
        {node.children.length > 0 && renderTree(node.children, level + 1)}
      </SuiteItem>
    ));
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-border">
        <h3 className="text-sm font-semibold text-foreground">Test Suites</h3>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openCreateDialog(null)}>
          <FolderPlus className="h-4 w-4" />
        </Button>
      </div>

      {/* Tree */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {/* Unsorted */}
        <button
          className={cn(
            "w-full flex items-center gap-2 py-1.5 px-2 rounded-lg cursor-pointer transition-colors",
            selectedSuiteId === null ? "bg-primary/20 text-primary" : "hover:bg-secondary/50"
          )}
          onClick={() => onSelect(null)}
        >
          <Inbox className="h-4 w-4" />
          <span className="flex-1 text-sm font-medium text-left">{t("scenarios.noFolder")}</span>
          {unsortedCount > 0 && (
            <span className="text-xs text-muted-foreground bg-secondary px-1.5 py-0.5 rounded">
              {unsortedCount}
            </span>
          )}
        </button>

        {/* Suites Tree with DnD */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={getAllIds(tree)} strategy={verticalListSortingStrategy}>
            {renderTree(tree)}
          </SortableContext>
          <DragOverlay>
            {activeId ? (
              <div className="px-3 py-2 bg-card border border-primary rounded-lg shadow-lg text-sm font-medium">
                {findNode(tree, activeId)?.name || "Moving..."}
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>

        {/* Empty state */}
        {tree.length === 0 && (
          <div className="text-center py-8 px-4">
            <FolderPlus className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground mb-3">
              Organize seus cenários em pastas
            </p>
            <Button variant="outline" size="sm" onClick={() => openCreateDialog(null)}>
              <Plus className="h-4 w-4 mr-1" />
              Criar Pasta
            </Button>
          </div>
        )}
      </div>

      {/* Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {editingSuite ? "Renomear Pasta" : "Nova Pasta"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="suite-name">Nome da Pasta</Label>
              <Input
                id="suite-name"
                value={suiteName}
                onChange={(e) => setSuiteName(e.target.value)}
                placeholder="Ex: Login, Checkout, API"
                onKeyDown={(e) => e.key === "Enter" && handleSave()}
                autoFocus
              />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>
              {editingSuite ? "Salvar" : "Criar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function findNode(nodes: SuiteTreeNode[], id: string): SuiteTreeNode | null {
  for (const node of nodes) {
    if (node.id === id) return node;
    const found = findNode(node.children, id);
    if (found) return found;
  }
  return null;
}
