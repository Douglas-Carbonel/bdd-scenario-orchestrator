import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Key, Copy, Check, Package, Trash2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CompanyCard } from "@/components/companies/CompanyCard";
import { Company, Product, Scenario, Sprint } from "@/types/bdd";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface CompaniesViewProps {
  companies: Company[];
  products: Product[];
  scenarios: Scenario[];
  sprints: Sprint[];
  onAddCompany: (company: Omit<Company, "id" | "createdAt">) => void;
  onEditCompany: (id: string, updates: Partial<Company>) => void;
  onDeleteCompany: (id: string) => void;
  onAddProduct: (product: Omit<Product, "id" | "createdAt" | "apiKey">) => void;
  onEditProduct: (id: string, updates: Partial<Product>) => void;
  onDeleteProduct: (id: string) => void;
}

export function CompaniesView({
  companies,
  products,
  scenarios,
  sprints,
  onAddCompany,
  onEditCompany,
  onDeleteCompany,
  onAddProduct,
  onEditProduct,
  onDeleteProduct,
}: CompaniesViewProps) {
  const { t } = useTranslation();

  const [isCompanyDialogOpen, setIsCompanyDialogOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [companyName, setCompanyName] = useState("");
  const [companyDescription, setCompanyDescription] = useState("");

  const [isProductsDialogOpen, setIsProductsDialogOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);

  const [isProductFormOpen, setIsProductFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productName, setProductName] = useState("");
  const [productDescription, setProductDescription] = useState("");

  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopyKey = (key: string, id: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(id);
    toast.success(t("common.copied"));
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const openCreateCompanyDialog = () => {
    setEditingCompany(null);
    setCompanyName("");
    setCompanyDescription("");
    setIsCompanyDialogOpen(true);
  };

  const openEditCompanyDialog = (company: Company) => {
    setEditingCompany(company);
    setCompanyName(company.name);
    setCompanyDescription(company.description || "");
    setIsCompanyDialogOpen(true);
  };

  const handleSaveCompany = () => {
    if (!companyName.trim()) return;
    if (editingCompany) {
      onEditCompany(editingCompany.id, { name: companyName, description: companyDescription });
    } else {
      onAddCompany({ name: companyName, description: companyDescription });
    }
    setIsCompanyDialogOpen(false);
  };

  const openProductsDialog = (company: Company) => {
    setSelectedCompany(company);
    setIsProductsDialogOpen(true);
    setIsProductFormOpen(false);
    setEditingProduct(null);
    setProductName("");
    setProductDescription("");
  };

  const openCreateProductForm = () => {
    setEditingProduct(null);
    setProductName("");
    setProductDescription("");
    setIsProductFormOpen(true);
  };

  const openEditProductForm = (product: Product) => {
    setEditingProduct(product);
    setProductName(product.name);
    setProductDescription(product.description || "");
    setIsProductFormOpen(true);
  };

  const handleSaveProduct = () => {
    if (!productName.trim() || !selectedCompany) return;
    if (editingProduct) {
      onEditProduct(editingProduct.id, { name: productName, description: productDescription });
    } else {
      onAddProduct({ companyId: selectedCompany.id, name: productName, description: productDescription });
    }
    setIsProductFormOpen(false);
    setEditingProduct(null);
    setProductName("");
    setProductDescription("");
  };

  const getCompanyStats = (companyId: string) => ({
    scenarioCount: scenarios.filter((s) => s.companyId === companyId).length,
    sprintCount: sprints.filter((s) => s.companyId === companyId).length,
    productCount: products.filter((p) => p.companyId === companyId).length,
  });

  const companyProducts = selectedCompany
    ? products.filter((p) => p.companyId === selectedCompany.id)
    : [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground">{t("companies.title")}</h1>
          <p className="text-muted-foreground">{t("companies.subtitle")}</p>
        </div>
        <Button onClick={openCreateCompanyDialog}>
          <Plus className="h-4 w-4 mr-2" />
          {t("companies.newCompany")}
        </Button>
      </div>

      {/* Companies Grid */}
      {companies.length === 0 ? (
        <div className="glass-card rounded-xl p-12 text-center">
          <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Plus className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            {t("companies.noCompanies")}
          </h3>
          <p className="text-muted-foreground mb-6">
            {t("companies.noCompaniesHint")}
          </p>
          <Button onClick={openCreateCompanyDialog}>
            <Plus className="h-4 w-4 mr-2" />
            {t("companies.addCompany")}
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
                  productCount={stats.productCount}
                  onSelect={openProductsDialog}
                  onEdit={openEditCompanyDialog}
                  onDelete={(c) => onDeleteCompany(c.id)}
                />
              </div>
            );
          })}
        </div>
      )}

      {/* Company Create/Edit Dialog */}
      <Dialog open={isCompanyDialogOpen} onOpenChange={setIsCompanyDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingCompany ? t("companies.editCompany") : t("companies.newCompany")}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="company-name">{t("companies.companyName")}</Label>
              <Input
                id="company-name"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder={t("companies.companyPlaceholder")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company-description">
                {t("common.description")} <span className="text-muted-foreground text-xs">({t("common.optional")})</span>
              </Label>
              <Textarea
                id="company-description"
                value={companyDescription}
                onChange={(e) => setCompanyDescription(e.target.value)}
                placeholder={t("companies.companyDesc")}
                rows={3}
              />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setIsCompanyDialogOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button onClick={handleSaveCompany}>
              {editingCompany ? t("companies.saveCompany") : t("companies.addCompany")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Products Management Dialog */}
      <Dialog open={isProductsDialogOpen} onOpenChange={setIsProductsDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              {t("companies.products")} — {selectedCompany?.name}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Product list */}
            {companyProducts.length === 0 && !isProductFormOpen ? (
              <div className="text-center py-6 text-muted-foreground text-sm">
                {t("companies.noProducts")}
              </div>
            ) : (
              <div className="space-y-2">
                {companyProducts.map((product) => (
                  <div
                    key={product.id}
                    className="flex flex-col gap-2 p-3 rounded-lg bg-secondary/40 border border-border"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-foreground">{product.name}</p>
                        {product.description && (
                          <p className="text-xs text-muted-foreground">{product.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => openEditProductForm(product)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={() => onDeleteProduct(product.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                    {/* API Key */}
                    <div className="flex items-center gap-2 p-2 rounded-md bg-background/60 border border-border">
                      <Key className="h-3 w-3 text-muted-foreground shrink-0" />
                      <code className="text-xs text-muted-foreground font-mono truncate flex-1">
                        {product.apiKey}
                      </code>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5 shrink-0"
                        onClick={() => handleCopyKey(product.apiKey, product.id)}
                      >
                        {copiedKey === product.id ? (
                          <Check className="h-3 w-3 text-primary" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Inline product form */}
            {isProductFormOpen && (
              <div className="space-y-3 p-3 rounded-lg border border-primary/30 bg-primary/5">
                <p className="text-sm font-medium text-foreground">
                  {editingProduct ? t("companies.editProduct") : t("companies.newProduct")}
                </p>
                <div className="space-y-2">
                  <Label htmlFor="product-name">{t("companies.productName")}</Label>
                  <Input
                    id="product-name"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    placeholder={t("companies.productPlaceholder")}
                    autoFocus
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="product-description">
                    {t("common.description")} <span className="text-muted-foreground text-xs">({t("common.optional")})</span>
                  </Label>
                  <Input
                    id="product-description"
                    value={productDescription}
                    onChange={(e) => setProductDescription(e.target.value)}
                    placeholder={t("companies.productDesc")}
                  />
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleSaveProduct}>
                    {editingProduct ? t("common.save") : t("common.create")}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => { setIsProductFormOpen(false); setEditingProduct(null); }}
                  >
                    {t("common.cancel")}
                  </Button>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-between pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={openCreateProductForm}
              disabled={isProductFormOpen && !editingProduct}
            >
              <Plus className="h-4 w-4 mr-1" />
              {t("companies.newProduct")}
            </Button>
            <Button variant="ghost" onClick={() => setIsProductsDialogOpen(false)}>
              {t("common.close")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
