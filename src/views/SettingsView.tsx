import { useTranslation } from "react-i18next";
import { Globe, Palette, Moon, Sun, Monitor, Check, ChevronRight, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useAppearance, ACCENT_PRESETS, type Theme, type AccentKey } from "@/hooks/useAppearance";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

/* ─── Theme option definition ────────────────────────────── */

interface ThemeOption {
  id: Theme;
  labelKey: string;
  icon: typeof Moon;
  preview: React.ReactNode;
}

const themeOptions: ThemeOption[] = [
  {
    id: "dark",
    labelKey: "settings.themeDark",
    icon: Moon,
    preview: (
      <div className="h-16 w-full rounded-lg overflow-hidden border border-white/10 flex flex-col gap-1 p-2 bg-[#0f1117]">
        <div className="flex gap-1 items-center">
          <div className="h-1.5 w-1.5 rounded-full bg-[#0ea5e9]" />
          <div className="h-1 flex-1 rounded bg-white/20" />
        </div>
        <div className="flex gap-1">
          <div className="h-8 w-8 rounded bg-[#1a2035] shrink-0" />
          <div className="flex-1 space-y-1">
            <div className="h-1.5 w-2/3 rounded bg-white/20" />
            <div className="h-1 w-full rounded bg-white/10" />
            <div className="h-1 w-3/4 rounded bg-white/10" />
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "light",
    labelKey: "settings.themeLight",
    icon: Sun,
    preview: (
      <div className="h-16 w-full rounded-lg overflow-hidden border border-black/10 flex flex-col gap-1 p-2 bg-[#f5f7fa]">
        <div className="flex gap-1 items-center">
          <div className="h-1.5 w-1.5 rounded-full bg-[#0ea5e9]" />
          <div className="h-1 flex-1 rounded bg-black/15" />
        </div>
        <div className="flex gap-1">
          <div className="h-8 w-8 rounded bg-white shrink-0 shadow-sm" />
          <div className="flex-1 space-y-1">
            <div className="h-1.5 w-2/3 rounded bg-black/20" />
            <div className="h-1 w-full rounded bg-black/10" />
            <div className="h-1 w-3/4 rounded bg-black/10" />
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "system",
    labelKey: "settings.themeSystem",
    icon: Monitor,
    preview: (
      <div className="h-16 w-full rounded-lg overflow-hidden border border-border/40 flex">
        <div className="flex-1 flex flex-col gap-1 p-2 bg-[#0f1117]">
          <div className="h-1 w-full rounded bg-white/15" />
          <div className="h-1 w-2/3 rounded bg-white/10" />
          <div className="h-4 w-full rounded bg-[#1a2035] mt-1" />
        </div>
        <div className="flex-1 flex flex-col gap-1 p-2 bg-[#f5f7fa]">
          <div className="h-1 w-full rounded bg-black/15" />
          <div className="h-1 w-2/3 rounded bg-black/10" />
          <div className="h-4 w-full rounded bg-white shadow-sm mt-1" />
        </div>
      </div>
    ),
  },
];

/* ─── View ───────────────────────────────────────────────── */

export function SettingsView() {
  const { t, i18n } = useTranslation();
  const { theme, setTheme, accent, setAccent } = useAppearance();
  const currentLang = i18n.language === "en" ? "en" : "pt-BR";

  const handleTheme = (val: Theme) => {
    setTheme(val);
    toast.success(
      val === "dark"   ? "Tema escuro ativado"  :
      val === "light"  ? "Tema claro ativado"   :
      "Tema do sistema ativado"
    );
  };

  const handleAccent = (key: AccentKey) => {
    setAccent(key);
    const preset = ACCENT_PRESETS.find(p => p.key === key)!;
    toast.success(`Cor de destaque: ${preset.label}`);
  };

  return (
    <div className="space-y-8 max-w-2xl">

      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground">{t("settings.title")}</h1>
        <p className="text-muted-foreground">{t("settings.subtitle")}</p>
      </div>

      {/* ── Language ─────────────────────────────────────── */}
      <div className="glass-card rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Globe className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">{t("settings.languageTitle")}</h3>
            <p className="text-sm text-muted-foreground">{t("settings.languageDesc")}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {[
            { code: "pt-BR", flag: "🇧🇷", name: "Português", region: "Brasil" },
            { code: "en",    flag: "🇺🇸", name: "English",   region: "United States" },
          ].map(lang => (
            <button
              key={lang.code}
              onClick={() => i18n.changeLanguage(lang.code)}
              className={cn(
                "relative flex flex-col items-start gap-2 p-4 rounded-xl border-2 transition-all duration-200 text-left",
                currentLang === lang.code
                  ? "border-primary bg-primary/5"
                  : "border-border bg-secondary/20 hover:border-border/80 hover:bg-secondary/40"
              )}
            >
              {currentLang === lang.code && (
                <div className="absolute top-3 right-3 h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                  <Check className="h-3 w-3 text-primary-foreground" />
                </div>
              )}
              <span className="text-2xl">{lang.flag}</span>
              <div>
                <p className="font-semibold text-foreground text-sm">{lang.name}</p>
                <p className="text-xs text-muted-foreground">{lang.region}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ── Theme ────────────────────────────────────────── */}
      <div className="glass-card rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-violet-500/10 flex items-center justify-center shrink-0">
            <Palette className="h-5 w-5 text-violet-400" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">{t("settings.appearanceTitle")}</h3>
            <p className="text-sm text-muted-foreground">{t("settings.appearanceDesc")}</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {themeOptions.map(opt => {
            const Icon = opt.icon;
            const isActive = theme === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => handleTheme(opt.id)}
                className={cn(
                  "relative flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all duration-200",
                  isActive
                    ? "border-primary bg-primary/5"
                    : "border-border bg-secondary/20 hover:border-border/80 hover:bg-secondary/40"
                )}
              >
                {isActive && (
                  <div className="absolute top-2 right-2 h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                    <Check className="h-3 w-3 text-primary-foreground" />
                  </div>
                )}
                {opt.preview}
                <div className="flex items-center gap-1.5">
                  <Icon className={cn("h-3.5 w-3.5", isActive ? "text-primary" : "text-muted-foreground")} />
                  <p className={cn("text-xs font-medium", isActive ? "text-foreground" : "text-muted-foreground")}>
                    {t(opt.labelKey)}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Accent Color ─────────────────────────────────── */}
      <div className="glass-card rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
            <Sparkles className="h-5 w-5 text-emerald-400" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">{t("settings.accentTitle")}</h3>
            <p className="text-sm text-muted-foreground">{t("settings.accentDesc")}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {ACCENT_PRESETS.map(preset => {
            const isActive = accent === preset.key;
            return (
              <button
                key={preset.key}
                title={preset.label}
                onClick={() => handleAccent(preset.key)}
                className={cn(
                  "relative h-10 w-10 rounded-full transition-all duration-200",
                  isActive
                    ? "ring-2 ring-offset-2 ring-offset-background scale-110"
                    : "hover:scale-105 opacity-70 hover:opacity-100"
                )}
                style={{
                  backgroundColor: preset.hex,
                  ringColor: preset.hex,
                  ...(isActive ? { outline: `2px solid ${preset.hex}`, outlineOffset: "3px" } : {}),
                }}
              >
                {isActive && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Check className="h-4 w-4 text-white drop-shadow" />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Live preview strip */}
        <div className="rounded-xl overflow-hidden border border-border">
          <div className="bg-background p-3 flex items-center gap-3">
            <div className="h-7 px-3 rounded-md flex items-center text-xs font-medium text-primary-foreground"
              style={{ backgroundColor: `hsl(var(--primary))` }}>
              Botão primário
            </div>
            <div className="h-7 px-3 rounded-md border-2 flex items-center text-xs font-medium border-primary text-primary">
              Contornado
            </div>
            <div className="flex items-center gap-1.5 ml-auto text-xs text-muted-foreground">
              <div className="h-2 w-2 rounded-full bg-primary" />
              <span className="text-primary font-medium">{ACCENT_PRESETS.find(p => p.key === accent)?.label}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Integrations hint ────────────────────────────── */}
      <div className="glass-card rounded-xl p-5 flex items-center gap-4 cursor-pointer hover:border-primary/30 transition-colors group">
        <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
          <span className="text-lg">🔌</span>
        </div>
        <div className="flex-1">
          <p className="font-semibold text-foreground text-sm">{t("settings.integrationsHint")}</p>
          <p className="text-xs text-muted-foreground">{t("settings.integrationsHintDesc")}</p>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
      </div>
    </div>
  );
}
