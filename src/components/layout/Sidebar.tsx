import {
  Building2, LayoutDashboard, FlaskConical, Calendar, Settings,
  ChevronLeft, ChevronRight, ShieldCheck, LogOut, Bug, Users,
  FileSpreadsheet, Globe, ChevronDown, FolderOpen, TestTube2, BarChart3,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
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

interface NavItem {
  id: string;
  icon: React.ElementType;
  adminOnly?: boolean;
}

interface NavGroup {
  id: string;
  icon: React.ElementType;
  standalone?: boolean;
  adminOnly?: boolean;
  items?: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    id: "dashboard",
    icon: LayoutDashboard,
    standalone: true,
  },
  {
    id: "projects",
    icon: FolderOpen,
    items: [
      { id: "companies", icon: Building2 },
    ],
  },
  {
    id: "tests",
    icon: TestTube2,
    items: [
      { id: "scenarios", icon: FlaskConical },
      { id: "sprints",   icon: Calendar },
      { id: "bugs",      icon: Bug },
    ],
  },
  {
    id: "reports",
    icon: BarChart3,
    items: [
      { id: "export", icon: FileSpreadsheet },
    ],
  },
  {
    id: "administration",
    icon: Settings,
    items: [
      { id: "team",      icon: Users },
      { id: "settings",  icon: Settings },
      { id: "admin",     icon: ShieldCheck, adminOnly: true },
    ],
  },
];

export function Sidebar({ activeView, onViewChange }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    projects: true,
    tests: true,
    reports: true,
    administration: true,
  });
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const { isAdmin } = useUserRole();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  useEffect(() => {
    const fetchUserProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("name, email")
          .eq("id", user.id)
          .single();
        if (profile) setUserProfile(profile);
      }
    };
    fetchUserProfile();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => { fetchUserProfile(); });
    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error(t("sidebar.logoutError", { defaultValue: "Erro ao sair" }));
    } else {
      navigate("/auth");
    }
  };

  const toggleLang = () => {
    const next = i18n.language === "pt-BR" ? "en" : "pt-BR";
    i18n.changeLanguage(next);
  };

  const toggleGroup = (groupId: string) => {
    setOpenGroups((prev) => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  const currentLangLabel = i18n.language === "en" ? "EN" : "PT";

  const isGroupActive = (group: NavGroup): boolean => {
    if (group.standalone) return activeView === group.id;
    return group.items?.some((item) => item.id === activeView) ?? false;
  };

  const visibleGroups = NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items?.filter((item) => !item.adminOnly || isAdmin),
  })).filter((group) => {
    if (group.adminOnly && !isAdmin) return false;
    if (!group.standalone && (!group.items || group.items.length === 0)) return false;
    return true;
  });

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
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {visibleGroups.map((group) => {
            const GroupIcon = group.icon;
            const groupActive = isGroupActive(group);

            /* ── STANDALONE ITEM (Dashboard) ── */
            if (group.standalone) {
              return (
                <button
                  key={group.id}
                  onClick={() => onViewChange(group.id)}
                  title={collapsed ? t(`sidebar.${group.id}`) : undefined}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                    groupActive
                      ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-lg shadow-primary/20"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}
                >
                  <GroupIcon className="h-5 w-5 shrink-0" />
                  {!collapsed && <span>{t(`sidebar.${group.id}`)}</span>}
                </button>
              );
            }

            /* ── COLLAPSED: show individual sub-item icons ── */
            if (collapsed) {
              return (
                <div key={group.id} className="space-y-1">
                  {group.items?.map((item) => {
                    const ItemIcon = item.icon;
                    const isActive = activeView === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => onViewChange(item.id)}
                        title={t(`sidebar.${item.id}`)}
                        className={cn(
                          "w-full flex items-center justify-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                          isActive
                            ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-lg shadow-primary/20"
                            : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                        )}
                      >
                        <ItemIcon className="h-5 w-5 shrink-0" />
                      </button>
                    );
                  })}
                </div>
              );
            }

            /* ── EXPANDED: collapsible group ── */
            const isOpen = openGroups[group.id] ?? true;
            return (
              <div key={group.id}>
                {/* Group header */}
                <button
                  onClick={() => toggleGroup(group.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all duration-200 mt-2",
                    groupActive
                      ? "text-primary"
                      : "text-muted-foreground hover:text-sidebar-foreground"
                  )}
                >
                  <GroupIcon className="h-4 w-4 shrink-0" />
                  <span className="flex-1 text-left">{t(`sidebar.group_${group.id}`)}</span>
                  <ChevronDown
                    className={cn(
                      "h-3.5 w-3.5 shrink-0 transition-transform duration-200",
                      !isOpen && "-rotate-90"
                    )}
                  />
                </button>

                {/* Sub-items */}
                {isOpen && (
                  <div className="mt-0.5 ml-3 pl-3 border-l border-sidebar-border space-y-0.5">
                    {group.items?.map((item) => {
                      const ItemIcon = item.icon;
                      const isActive = activeView === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => onViewChange(item.id)}
                          className={cn(
                            "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                            isActive
                              ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-md shadow-primary/20"
                              : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                          )}
                        >
                          <ItemIcon className="h-4 w-4 shrink-0" />
                          <span>{t(`sidebar.${item.id}`)}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-sidebar-border space-y-2">
          {/* Language toggle */}
          <button
            onClick={toggleLang}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
              "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            )}
            title={collapsed ? currentLangLabel : undefined}
          >
            <Globe className="h-5 w-5 shrink-0" />
            {!collapsed && (
              <span className="flex items-center gap-2">
                {currentLangLabel}
                <span className="text-xs text-muted-foreground/60">
                  {i18n.language === "en" ? "English" : "Português"}
                </span>
              </span>
            )}
          </button>

          {/* User Info */}
          {userProfile && (
            <div className={cn(
              "flex items-center gap-3 px-2 py-1",
              collapsed && "justify-center"
            )}>
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <span className="text-xs font-semibold text-primary">
                  {userProfile.name.charAt(0).toUpperCase()}
                </span>
              </div>
              {!collapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-sidebar-foreground truncate">{userProfile.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{userProfile.email}</p>
                </div>
              )}
            </div>
          )}

          {/* Logout */}
          <button
            onClick={handleLogout}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
              "text-sidebar-foreground hover:bg-red-500/10 hover:text-red-500"
            )}
            title={collapsed ? t("sidebar.logout") : undefined}
          >
            <LogOut className="h-5 w-5 shrink-0" />
            {!collapsed && <span>{t("sidebar.logout")}</span>}
          </button>
        </div>
      </div>
    </aside>
  );
}
