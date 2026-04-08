import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Camera, Save, Mail, Lock, User, Building2, ShieldCheck,
  Eye, EyeOff, CheckCircle2, AlertTriangle, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ─── Avatar helpers ──────────────────────────────────── */

function resizeImage(file: File, size = 256): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d")!;
      const min = Math.min(img.width, img.height);
      const sx = (img.width - min) / 2;
      const sy = (img.height - min) / 2;
      ctx.drawImage(img, sx, sy, min, min, 0, 0, size, size);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", 0.85));
    };
    img.onerror = reject;
    img.src = url;
  });
}

function AvatarCircle({
  url, name, size = "lg", onClick,
}: {
  url?: string | null;
  name: string;
  size?: "sm" | "lg";
  onClick?: () => void;
}) {
  const dim = size === "lg" ? "h-24 w-24" : "h-10 w-10";
  const text = size === "lg" ? "text-3xl" : "text-sm";
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0].toUpperCase())
    .join("");

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        dim,
        "rounded-full relative overflow-hidden shrink-0 ring-2 ring-primary/30 transition-all",
        onClick && "cursor-pointer hover:ring-primary/60 hover:scale-105"
      )}
    >
      {url ? (
        <img src={url} alt={name} className="h-full w-full object-cover" />
      ) : (
        <div className={cn("h-full w-full bg-primary/10 flex items-center justify-center", text)}>
          <span className="font-bold text-primary">{initials || "?"}</span>
        </div>
      )}
      {onClick && (
        <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
          <Camera className="h-6 w-6 text-white" />
        </div>
      )}
    </button>
  );
}

/* ─── Section wrapper ─────────────────────────────────── */

function Section({ title, icon: Icon, children }: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <div className="glass-card rounded-xl p-6 space-y-4">
      <div className="flex items-center gap-3 pb-2 border-b border-border/60">
        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <Icon className="h-4 w-4 text-primary" />
        </div>
        <h3 className="font-semibold text-foreground">{title}</h3>
      </div>
      {children}
    </div>
  );
}

/* ─── Password field ──────────────────────────────────── */

function PasswordInput({
  id, label, value, onChange, placeholder, required,
}: {
  id: string; label: string; value: string;
  onChange: (v: string) => void; placeholder?: string; required?: boolean;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-sm">{label}{required && <span className="text-destructive ml-1">*</span>}</Label>
      <div className="relative">
        <Input
          id={id}
          type={show ? "text" : "password"}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className="pr-10"
        />
        <button
          type="button"
          onClick={() => setShow(s => !s)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}

/* ─── Main view ───────────────────────────────────────── */

interface ProfileData {
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;
  company_id: string | null;
  approval_status: string;
}

export function ProfileView() {
  const fileRef = useRef<HTMLInputElement>(null);

  const [profile,    setProfile]    = useState<ProfileData | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [authEmail,  setAuthEmail]  = useState("");

  /* Personal info form */
  const [name,       setName]       = useState("");
  const [avatarUrl,  setAvatarUrl]  = useState<string | null>(null);
  const [savingInfo, setSavingInfo] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);

  /* Email change */
  const [newEmail,      setNewEmail]      = useState("");
  const [changingEmail, setChangingEmail] = useState(false);
  const [emailSent,     setEmailSent]     = useState(false);

  /* Password change */
  const [newPass,      setNewPass]      = useState("");
  const [confirmPass,  setConfirmPass]  = useState("");
  const [changingPass, setChangingPass] = useState(false);

  /* Load profile */
  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setAuthEmail(user.email ?? "");

      const { data } = await supabase
        .from("profiles")
        .select("id, name, email, avatar_url, company_id, approval_status")
        .eq("id", user.id)
        .single();

      if (data) {
        setProfile(data as ProfileData);
        setName(data.name);
        setAvatarUrl((data as ProfileData).avatar_url ?? null);
      }
      setLoading(false);
    })();
  }, []);

  /* ── Handlers ── */

  const handleAvatarFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Imagem muito grande — máximo 5 MB.");
      return;
    }
    setAvatarUploading(true);
    try {
      const dataUrl = await resizeImage(file, 256);
      setAvatarUrl(dataUrl);
    } catch {
      toast.error("Erro ao processar imagem.");
    } finally {
      setAvatarUploading(false);
      e.target.value = "";
    }
  };

  const savePersonalInfo = async () => {
    if (!profile) return;
    setSavingInfo(true);
    const { error } = await supabase
      .from("profiles")
      .update({ name: name.trim(), avatar_url: avatarUrl })
      .eq("id", profile.id);

    if (error) {
      toast.error("Erro ao salvar: " + error.message);
    } else {
      toast.success("Perfil atualizado!");
      setProfile(p => p ? { ...p, name: name.trim(), avatar_url: avatarUrl } : p);
    }
    setSavingInfo(false);
  };

  const handleEmailChange = async () => {
    if (!newEmail.trim()) return;
    setChangingEmail(true);
    const { error } = await supabase.auth.updateUser({ email: newEmail.trim() });
    if (error) {
      toast.error("Erro ao alterar e-mail: " + error.message);
    } else {
      setEmailSent(true);
      toast.success("Confirmação enviada para o novo e-mail!");
    }
    setChangingEmail(false);
  };

  const handlePasswordChange = async () => {
    if (!newPass) return;
    if (newPass !== confirmPass) {
      toast.error("As senhas não coincidem.");
      return;
    }
    if (newPass.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres.");
      return;
    }
    setChangingPass(true);
    const { error } = await supabase.auth.updateUser({ password: newPass });
    if (error) {
      toast.error("Erro ao alterar senha: " + error.message);
    } else {
      toast.success("Senha alterada com sucesso!");
      setNewPass(""); setConfirmPass("");
    }
    setChangingPass(false);
  };

  /* ── Derived ── */

  const infoChanged = profile
    ? (name.trim() !== profile.name || avatarUrl !== profile.avatar_url)
    : false;

  /* ── Render ── */

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="glass-card rounded-xl p-12 text-center text-muted-foreground">
        Perfil não encontrado.
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-display font-bold text-foreground">Meu Perfil</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Gerencie seus dados pessoais, acesso e segurança.
        </p>
      </div>

      {/* Identity hero card */}
      <div className="glass-card rounded-xl p-6">
        <div className="flex items-center gap-6">
          <div className="relative">
            <AvatarCircle
              url={avatarUrl}
              name={name || profile.name}
              size="lg"
              onClick={() => fileRef.current?.click()}
            />
            {avatarUploading && (
              <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-white" />
              </div>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarFile}
            />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-foreground truncate">{profile.name}</h2>
            <p className="text-sm text-muted-foreground truncate">{authEmail}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className={cn(
                "inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium",
                profile.approval_status === "approved"
                  ? "bg-success/10 text-success"
                  : "bg-warning/10 text-warning"
              )}>
                {profile.approval_status === "approved"
                  ? <><CheckCircle2 className="h-3 w-3" /> Conta aprovada</>
                  : <><AlertTriangle className="h-3 w-3" /> Pendente de aprovação</>}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground border border-border rounded-lg px-3 py-2 transition-colors hover:bg-secondary/50 shrink-0"
          >
            <Camera className="h-4 w-4" />
            Trocar foto
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Personal info */}
        <Section title="Informações Pessoais" icon={User}>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="prof-name" className="text-sm">Nome completo</Label>
              <Input
                id="prof-name"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Seu nome"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm text-muted-foreground">E-mail atual</Label>
              <Input value={authEmail} disabled className="bg-muted/30 cursor-not-allowed" />
              <p className="text-xs text-muted-foreground">
                Para alterar o e-mail, use a seção "Conta" ao lado.
              </p>
            </div>
          </div>
          <Button
            onClick={savePersonalInfo}
            disabled={!infoChanged || savingInfo || !name.trim()}
            className="w-full"
          >
            {savingInfo
              ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Salvando…</>
              : <><Save className="h-4 w-4 mr-2" /> Salvar Alterações</>
            }
          </Button>
        </Section>

        {/* Account info */}
        <Section title="Conta" icon={Building2}>
          <div className="space-y-3 text-sm text-muted-foreground">
            <div className="flex items-center justify-between py-2 border-b border-border/40">
              <span className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4" />
                Status
              </span>
              <span className={cn(
                "font-medium text-xs px-2 py-0.5 rounded-full",
                profile.approval_status === "approved"
                  ? "bg-success/10 text-success"
                  : "bg-warning/10 text-warning"
              )}>
                {profile.approval_status === "approved" ? "Aprovado" : "Pendente"}
              </span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Empresa vinculada
              </span>
              <span className="text-foreground font-medium text-xs">
                {profile.company_id ? "Vinculada" : "Sem empresa"}
              </span>
            </div>
          </div>

          {/* Email change */}
          <div className="pt-2 border-t border-border/60 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Mail className="h-3.5 w-3.5" /> Alterar E-mail
            </p>
            {emailSent ? (
              <div className="flex items-center gap-2 rounded-lg bg-success/10 border border-success/20 px-3 py-2.5 text-xs text-success">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                Confirmação enviada para <strong className="ml-1">{newEmail}</strong>. Verifique sua caixa de entrada.
              </div>
            ) : (
              <div className="flex gap-2">
                <Input
                  type="email"
                  value={newEmail}
                  onChange={e => setNewEmail(e.target.value)}
                  placeholder="novo@email.com"
                  className="h-9"
                />
                <Button
                  variant="secondary"
                  size="sm"
                  className="h-9 shrink-0"
                  onClick={handleEmailChange}
                  disabled={!newEmail.trim() || changingEmail}
                >
                  {changingEmail
                    ? <Loader2 className="h-4 w-4 animate-spin" />
                    : "Alterar"
                  }
                </Button>
              </div>
            )}
          </div>
        </Section>

        {/* Security */}
        <Section title="Segurança" icon={Lock}>
          <div className="space-y-3">
            <PasswordInput
              id="new-pass"
              label="Nova senha"
              value={newPass}
              onChange={setNewPass}
              placeholder="Mínimo 6 caracteres"
              required
            />
            <PasswordInput
              id="confirm-pass"
              label="Confirmar nova senha"
              value={confirmPass}
              onChange={setConfirmPass}
              placeholder="Repita a senha"
            />
            {confirmPass && newPass !== confirmPass && (
              <p className="text-xs text-destructive flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5" /> As senhas não coincidem.
              </p>
            )}
            {confirmPass && newPass === confirmPass && newPass.length >= 6 && (
              <p className="text-xs text-success flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5" /> Senhas conferem!
              </p>
            )}
          </div>
          <Button
            onClick={handlePasswordChange}
            disabled={!newPass || !confirmPass || changingPass}
            className="w-full"
            variant="outline"
          >
            {changingPass
              ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Alterando…</>
              : <><Lock className="h-4 w-4 mr-2" /> Alterar Senha</>
            }
          </Button>
        </Section>

      </div>
    </div>
  );
}
