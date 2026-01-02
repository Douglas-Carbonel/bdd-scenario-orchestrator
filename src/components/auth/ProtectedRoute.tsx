import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Loader2, Clock, XCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

type ApprovalStatus = "pending" | "approved" | "rejected" | null;

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [approvalStatus, setApprovalStatus] = useState<ApprovalStatus>(null);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
        
        // Defer profile fetch with setTimeout
        if (session?.user) {
          setTimeout(() => {
            fetchApprovalStatus(session.user.id);
          }, 0);
        } else {
          setApprovalStatus(null);
          setLoading(false);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchApprovalStatus(session.user.id);
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchApprovalStatus = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("approval_status")
        .eq("id", userId)
        .single();

      if (error) {
        console.error("Error fetching profile:", error);
        // If no profile found, might be a new user - set as pending
        setApprovalStatus("pending");
      } else {
        setApprovalStatus(data?.approval_status as ApprovalStatus);
      }
    } catch (error) {
      console.error("Error:", error);
      setApprovalStatus("pending");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (approvalStatus === "pending") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-yellow-500/10 flex items-center justify-center">
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
            <CardTitle>Aguardando Aprovação</CardTitle>
            <CardDescription>
              Seu cadastro está sendo analisado. Você receberá acesso assim que um administrador aprovar sua conta.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-muted p-4 text-sm text-muted-foreground">
              <p>
                <strong>E-mail:</strong> {user.email}
              </p>
              <p className="mt-1">
                <strong>Status:</strong> Pendente
              </p>
            </div>
            <Button variant="outline" className="w-full" onClick={handleLogout}>
              Sair e usar outra conta
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (approvalStatus === "rejected") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-red-500/10 flex items-center justify-center">
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
            <CardTitle>Acesso Negado</CardTitle>
            <CardDescription>
              Infelizmente seu cadastro não foi aprovado. Entre em contato com o administrador para mais informações.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-muted p-4 text-sm text-muted-foreground">
              <p>
                <strong>E-mail:</strong> {user.email}
              </p>
              <p className="mt-1">
                <strong>Status:</strong> Rejeitado
              </p>
            </div>
            <Button variant="outline" className="w-full" onClick={handleLogout}>
              Sair
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
