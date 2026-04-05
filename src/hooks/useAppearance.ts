import { useState, useEffect, useCallback } from "react";

export type Theme = "dark" | "light" | "system";
export type AccentKey = "cyan" | "violet" | "emerald" | "rose" | "amber" | "orange";

export interface AccentPreset {
  key: AccentKey;
  label: string;
  primary: string;
  hex: string;
}

export const ACCENT_PRESETS: AccentPreset[] = [
  { key: "cyan",    label: "Cyan",    primary: "199 89% 48%", hex: "#0ea5e9" },
  { key: "violet",  label: "Violeta", primary: "270 60% 60%", hex: "#8b5cf6" },
  { key: "emerald", label: "Esmeralda", primary: "142 65% 42%", hex: "#10b981" },
  { key: "rose",    label: "Rosa",    primary: "350 89% 60%", hex: "#f43f5e" },
  { key: "amber",   label: "Âmbar",   primary: "38 92% 50%",  hex: "#f59e0b" },
  { key: "orange",  label: "Laranja", primary: "25 95% 53%",  hex: "#f97316" },
];

const STORAGE_THEME  = "4qa_theme";
const STORAGE_ACCENT = "4qa_accent";

/* ─── Apply to DOM ────────────────────────────────────────── */

function getSystemDark(): boolean {
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function applyTheme(theme: Theme) {
  const html = document.documentElement;
  const isDark = theme === "system" ? getSystemDark() : theme === "dark";
  html.classList.toggle("light", !isDark);
  html.classList.toggle("dark", isDark);
}

function applyAccent(key: AccentKey) {
  const preset = ACCENT_PRESETS.find(p => p.key === key) ?? ACCENT_PRESETS[0];
  const root = document.documentElement;
  root.style.setProperty("--primary",              preset.primary);
  root.style.setProperty("--ring",                 preset.primary);
  root.style.setProperty("--sidebar-primary",      preset.primary);
  root.style.setProperty("--sidebar-ring",         preset.primary);
  root.style.setProperty("--primary-foreground",   "222 47% 11%");
}

/* ─── Init (run once at app startup) ─────────────────────── */

export function initAppearance() {
  const theme  = (localStorage.getItem(STORAGE_THEME)  as Theme  | null) ?? "dark";
  const accent = (localStorage.getItem(STORAGE_ACCENT) as AccentKey | null) ?? "cyan";
  applyTheme(theme);
  applyAccent(accent);
}

/* ─── Hook ────────────────────────────────────────────────── */

export function useAppearance() {
  const [theme,  setThemeState]  = useState<Theme>(
    () => (localStorage.getItem(STORAGE_THEME) as Theme | null) ?? "dark"
  );
  const [accent, setAccentState] = useState<AccentKey>(
    () => (localStorage.getItem(STORAGE_ACCENT) as AccentKey | null) ?? "cyan"
  );

  /* Listen for system theme changes when mode === "system" */
  useEffect(() => {
    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => applyTheme("system");
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [theme]);

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
    localStorage.setItem(STORAGE_THEME, t);
    applyTheme(t);
  }, []);

  const setAccent = useCallback((k: AccentKey) => {
    setAccentState(k);
    localStorage.setItem(STORAGE_ACCENT, k);
    applyAccent(k);
  }, []);

  return { theme, setTheme, accent, setAccent };
}
