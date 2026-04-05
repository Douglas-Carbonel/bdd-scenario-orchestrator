import { Building2, LayoutDashboard, FlaskConical, Calendar, Settings, ChevronLeft, ChevronRight, ShieldCheck, LogOut, Bug, Users, FileSpreadsheet } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
}

interface UserProfile {
  name: string;
  email: string;
}

const menuItems = [
  { id: "dashboard", label: "Dashboard",    icon: LayoutDashboard },
  { id: "companies", label: "Empresas",     icon: Building2 },
  { id: "scenarios", label: "Cenários",     icon: FlaskConical },
  { id: "sprints",   label: "Sprints",      icon: Calendar },
  { id: "bugs",      label: "Bugs",         icon: Bug },
  { id: "team",      label: "Time",         icon: Users },
  { id: "export",    label: "Exportar",     icon: FileSpreadsheet },
  { id: "settings",  label: "Configurações",icon: Settings },
];

const adminItems = [
  { id: "admin", label: "Administração", icon: ShieldCheck },
];

export function Sidebar({ activeView, onViewChange }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const { isAdmin } = useUserRole();
  const navigate = useNavigate();

  const allItems = isAdmin ? [...menuItems, ...adminItems] : menuItems;

  useEffect(() => {
    const fetchUserProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("name, email")
          .eq("id", user.id)
          .single();
        
        if (profile) {
          setUserProfile(profile);
        }
      }
    };

    fetchUserProfile();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetchUserProfile();
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Erro ao sair: " + error.message);
    } else {
      toast.success("Sessão encerrada com sucesso");
      navigate("/auth");
    }
  };

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-sidebar-border">
        {!collapsed && (
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="font-bold text-sm text-primary-foreground">4</span>
              </div>
              <span className="font-display font-bold text-lg text-sidebar-foreground">
                4<span className="text-primary">QA</span>
              </span>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
            className="text-sidebar-foreground hover:bg-sidebar-accent"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-3">
          {allItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => onViewChange(item.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-lg shadow-primary/20"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
              >
                <Icon className="h-5 w-5 shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-sidebar-border space-y-3">
          {/* User Info */}
          {userProfile && (
            <div className={cn(
              "flex items-center gap-3 px-2",
              collapsed && "justify-center"
            )}>
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <span className="text-xs font-semibold text-primary">
                  {userProfile.name.charAt(0).toUpperCase()}
                </span>
              </div>
              {!collapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-sidebar-foreground truncate">
                    {userProfile.name}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {userProfile.email}
                  </p>
                </div>
              )}
            </div>
          )}
          
          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
              "text-sidebar-foreground hover:bg-red-500/10 hover:text-red-500"
            )}
          >
            <LogOut className="h-5 w-5 shrink-0" />
            {!collapsed && <span>Sair</span>}
          </button>
        </div>
      </div>
    </aside>
  );
}
