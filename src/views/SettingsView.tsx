import { useTranslation } from "react-i18next";
import { Globe, Palette, Moon, Monitor, Check, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function SettingsView() {
  const { t, i18n } = useTranslation();

  const toggleLang = (lang: string) => {
    i18n.changeLanguage(lang);
  };

  const currentLang = i18n.language === "en" ? "en" : "pt-BR";

  return (
    <div className="space-y-8 max-w-2xl">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground">{t("settings.title")}</h1>
        <p className="text-muted-foreground">{t("settings.subtitle")}</p>
      </div>

      {/* Language */}
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
          {/* PT-BR */}
          <button
            onClick={() => toggleLang("pt-BR")}
            className={`relative flex flex-col items-start gap-2 p-4 rounded-xl border-2 transition-all duration-200 text-left ${
              currentLang === "pt-BR"
                ? "border-primary bg-primary/5"
                : "border-border bg-secondary/20 hover:border-border/80 hover:bg-secondary/40"
            }`}
          >
            {currentLang === "pt-BR" && (
              <div className="absolute top-3 right-3 h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                <Check className="h-3 w-3 text-primary-foreground" />
              </div>
            )}
            <span className="text-2xl">🇧🇷</span>
            <div>
              <p className="font-semibold text-foreground text-sm">Português</p>
              <p className="text-xs text-muted-foreground">Brasil</p>
            </div>
          </button>

          {/* EN */}
          <button
            onClick={() => toggleLang("en")}
            className={`relative flex flex-col items-start gap-2 p-4 rounded-xl border-2 transition-all duration-200 text-left ${
              currentLang === "en"
                ? "border-primary bg-primary/5"
                : "border-border bg-secondary/20 hover:border-border/80 hover:bg-secondary/40"
            }`}
          >
            {currentLang === "en" && (
              <div className="absolute top-3 right-3 h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                <Check className="h-3 w-3 text-primary-foreground" />
              </div>
            )}
            <span className="text-2xl">🇺🇸</span>
            <div>
              <p className="font-semibold text-foreground text-sm">English</p>
              <p className="text-xs text-muted-foreground">United States</p>
            </div>
          </button>
        </div>
      </div>

      {/* Appearance */}
      <div className="glass-card rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-violet-500/10 flex items-center justify-center shrink-0">
            <Palette className="h-5 w-5 text-violet-400" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-foreground">{t("settings.appearanceTitle")}</h3>
            <p className="text-sm text-muted-foreground">{t("settings.appearanceDesc")}</p>
          </div>
          <Badge variant="outline" className="text-muted-foreground border-muted shrink-0">
            {t("settings.statusPlanned")}
          </Badge>
        </div>

        <div className="grid grid-cols-3 gap-3 opacity-50 pointer-events-none select-none">
          {/* Dark (current) */}
          <div className="flex flex-col items-center gap-2 p-3 rounded-xl border-2 border-primary bg-primary/5">
            <div className="h-16 w-full rounded-lg bg-[#0f1117] border border-border/40 flex items-center justify-center">
              <Moon className="h-5 w-5 text-primary" />
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-4 w-4 rounded-full bg-primary flex items-center justify-center">
                <Check className="h-2.5 w-2.5 text-primary-foreground" />
              </div>
              <p className="text-xs font-medium text-foreground">{t("settings.themeDark")}</p>
            </div>
          </div>

          {/* Light */}
          <div className="flex flex-col items-center gap-2 p-3 rounded-xl border-2 border-border bg-secondary/20">
            <div className="h-16 w-full rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center">
              <Monitor className="h-5 w-5 text-gray-500" />
            </div>
            <p className="text-xs font-medium text-muted-foreground">{t("settings.themeLight")}</p>
          </div>

          {/* System */}
          <div className="flex flex-col items-center gap-2 p-3 rounded-xl border-2 border-border bg-secondary/20">
            <div className="h-16 w-full rounded-lg overflow-hidden border border-border flex">
              <div className="flex-1 bg-[#0f1117]" />
              <div className="flex-1 bg-gray-100" />
            </div>
            <p className="text-xs font-medium text-muted-foreground">{t("settings.themeSystem")}</p>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">{t("settings.appearanceSoon")}</p>
      </div>

      {/* Accent colors — planned */}
      <div className="glass-card rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
            <div className="h-5 w-5 rounded-full bg-gradient-to-br from-primary via-violet-500 to-emerald-400" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-foreground">{t("settings.accentTitle")}</h3>
            <p className="text-sm text-muted-foreground">{t("settings.accentDesc")}</p>
          </div>
          <Badge variant="outline" className="text-muted-foreground border-muted shrink-0">
            {t("settings.statusPlanned")}
          </Badge>
        </div>

        <div className="flex items-center gap-2 opacity-50 pointer-events-none select-none">
          {[
            "bg-blue-500", "bg-violet-500", "bg-emerald-500",
            "bg-rose-500", "bg-amber-500", "bg-cyan-500",
          ].map((color) => (
            <div
              key={color}
              className={`h-8 w-8 rounded-full ${color} ring-2 ring-offset-2 ring-offset-background ring-transparent`}
            />
          ))}
        </div>
      </div>

      {/* Integrations quick link */}
      <div
        className="glass-card rounded-xl p-5 flex items-center gap-4 cursor-pointer hover:border-primary/30 transition-colors group"
        onClick={() => {}}
      >
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
