import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Shield, Loader2, Mail, Lock, UserPlus } from "lucide-react";
import { z } from "zod";
import logo4QA from "@/assets/logo-4qa.png";

const authSchema = z.object({
  email: z.string().trim().email({ message: "Email inválido" }),
  password: z.string().min(6, { message: "Senha deve ter no mínimo 6 caracteres" }),
});

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session?.user) {
          navigate("/");
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        navigate("/");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const validateForm = () => {
    const result = authSchema.safeParse({ email, password });
    if (!result.success) {
      const fieldErrors: { email?: string; password?: string } = {};
      result.error.errors.forEach((err) => {
        if (err.path[0] === "email") fieldErrors.email = err.message;
        if (err.path[0] === "password") fieldErrors.password = err.message;
      });
      setErrors(fieldErrors);
      return false;
    }
    setErrors({});
    return true;
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (error) {
          if (error.message.includes("Invalid login credentials")) {
            toast({
              title: "Erro ao entrar",
              description: "Email ou senha incorretos",
              variant: "destructive",
            });
          } else {
            toast({
              title: "Erro ao entrar",
              description: error.message,
              variant: "destructive",
            });
          }
        }
      } else {
        const redirectUrl = `${window.location.origin}/`;
        
        const { error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: redirectUrl,
          },
        });

        if (error) {
          if (error.message.includes("User already registered")) {
            toast({
              title: "Erro ao cadastrar",
              description: "Este email já está cadastrado. Tente fazer login.",
              variant: "destructive",
            });
          } else {
            toast({
              title: "Erro ao cadastrar",
              description: error.message,
              variant: "destructive",
            });
          }
        } else {
          toast({
            title: "Cadastro realizado!",
            description: "Verifique seu email para confirmar a conta.",
          });
        }
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Ocorreu um erro inesperado. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-[0.02]">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="circuit" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
              <path d="M10 10 L10 30 L30 30" fill="none" stroke="currentColor" strokeWidth="1"/>
              <circle cx="10" cy="10" r="3" fill="currentColor"/>
              <circle cx="30" cy="30" r="2" fill="currentColor"/>
              <path d="M70 10 L90 10 L90 30" fill="none" stroke="currentColor" strokeWidth="1"/>
              <circle cx="70" cy="10" r="2" fill="currentColor"/>
              <circle cx="90" cy="30" r="3" fill="currentColor"/>
              <path d="M50 50 L50 70 L70 70 L70 90" fill="none" stroke="currentColor" strokeWidth="1"/>
              <circle cx="50" cy="50" r="2" fill="currentColor"/>
              <circle cx="70" cy="90" r="3" fill="currentColor"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#circuit)" className="text-slate-800"/>
        </svg>
      </div>

      <div className="relative z-10 w-full max-w-sm mx-4">
        {/* Card com Logo Integrado */}
        <div className="bg-white rounded-3xl shadow-2xl shadow-slate-200/50 overflow-hidden border border-slate-100">
          {/* Header com Logo */}
          <div className="bg-gradient-to-br from-slate-800 via-slate-700 to-slate-800 px-8 py-10 relative overflow-hidden">
            {/* Decoração de circuitos no header */}
            <div className="absolute inset-0 opacity-10">
              <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <pattern id="circuit-header" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
                    <path d="M5 5 L5 20 L20 20" fill="none" stroke="white" strokeWidth="0.5"/>
                    <circle cx="5" cy="5" r="2" fill="white"/>
                    <circle cx="20" cy="20" r="1.5" fill="white"/>
                    <path d="M40 10 L55 10 L55 25" fill="none" stroke="white" strokeWidth="0.5"/>
                    <circle cx="40" cy="10" r="1.5" fill="white"/>
                    <path d="M30 35 L30 50 L45 50" fill="none" stroke="white" strokeWidth="0.5"/>
                    <circle cx="45" cy="50" r="2" fill="white"/>
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#circuit-header)"/>
              </svg>
            </div>
            
            <div className="relative flex flex-col items-center">
              <div className="w-24 h-24 bg-white rounded-2xl p-3 shadow-lg mb-4">
                <img 
                  src={logo4QA} 
                  alt="4QA Logo" 
                  className="w-full h-full object-contain"
                />
              </div>
              <h1 className="text-xl font-display font-bold text-white">
                {isLogin ? "Bem-vindo de volta" : "Criar conta"}
              </h1>
              <p className="text-slate-300 text-sm mt-1">
                Plataforma de Gestão de QA
              </p>
            </div>
          </div>

          {/* Form */}
          <div className="p-8">
            <form onSubmit={handleAuth} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-600 text-sm font-medium">
                  Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-11 h-12 rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white focus:border-slate-400 transition-all"
                    disabled={loading}
                  />
                </div>
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-600 text-sm font-medium">
                  Senha
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-11 h-12 rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white focus:border-slate-400 transition-all"
                    disabled={loading}
                  />
                </div>
                {errors.password && (
                  <p className="text-sm text-destructive">{errors.password}</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full h-12 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-base gap-2.5 transition-all shadow-lg shadow-slate-300/30 hover:shadow-slate-400/30"
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    {isLogin ? (
                      <Shield className="h-5 w-5" />
                    ) : (
                      <UserPlus className="h-5 w-5" />
                    )}
                    {isLogin ? "Entrar" : "Cadastrar"}
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setErrors({});
                }}
                className="text-sm text-slate-500 hover:text-slate-700 transition-colors"
                disabled={loading}
              >
                {isLogin ? (
                  <>
                    Não tem conta?{" "}
                    <span className="font-semibold text-slate-700 hover:underline">
                      Cadastre-se
                    </span>
                  </>
                ) : (
                  <>
                    Já tem conta?{" "}
                    <span className="font-semibold text-slate-700 hover:underline">
                      Faça login
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
