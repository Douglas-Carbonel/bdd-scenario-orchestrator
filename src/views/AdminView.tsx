import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Check, X, Clock, Building2, Mail, User, Key, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface PendingUser {
  id: string;
  name: string;
  email: string;
  company_id: string | null;
  company_name: string | null;
  company_api_key: string | null;
  approval_status: string;
  created_at: string;
}

export function AdminView() {
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchPendingUsers();
  }, []);

  const fetchPendingUsers = async () => {
    try {
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select(`
          id,
          name,
          email,
          company_id,
          approval_status,
          created_at
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch company details for each profile
      const usersWithCompanies = await Promise.all(
        (profiles || []).map(async (profile) => {
          let company_name = null;
          let company_api_key = null;

          if (profile.company_id) {
            const { data: company } = await supabase
              .from("companies")
              .select("name, api_key")
              .eq("id", profile.company_id)
              .single();

            if (company) {
              company_name = company.name;
              company_api_key = company.api_key;
            }
          }

          return {
            ...profile,
            company_name,
            company_api_key,
          };
        })
      );

      setPendingUsers(usersWithCompanies);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast({
        title: "Erro ao carregar usuários",
        description: "Não foi possível carregar a lista de usuários.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async (userId: string, approve: boolean) => {
    setProcessing(userId);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from("profiles")
        .update({
          approval_status: approve ? "approved" : "rejected",
          approved_by: approve ? user?.id : null,
          approved_at: approve ? new Date().toISOString() : null,
        })
        .eq("id", userId);

      if (error) throw error;

      toast({
        title: approve ? "Usuário aprovado" : "Usuário rejeitado",
        description: approve
          ? "O usuário agora tem acesso ao sistema."
          : "O acesso do usuário foi negado.",
      });

      fetchPendingUsers();
    } catch (error) {
      console.error("Error updating user:", error);
      toast({
        title: "Erro ao processar",
        description: "Não foi possível atualizar o status do usuário.",
        variant: "destructive",
      });
    } finally {
      setProcessing(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">
            <Clock className="h-3 w-3 mr-1" />
            Pendente
          </Badge>
        );
      case "approved":
        return (
          <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
            <Check className="h-3 w-3 mr-1" />
            Aprovado
          </Badge>
        );
      case "rejected":
        return (
          <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20">
            <X className="h-3 w-3 mr-1" />
            Rejeitado
          </Badge>
        );
      default:
        return null;
    }
  };

  const pendingCount = pendingUsers.filter((u) => u.approval_status === "pending").length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Administração</h1>
        <p className="text-muted-foreground">
          Gerencie aprovações de usuários e acesso ao sistema
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pendentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-500">{pendingCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Aprovados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              {pendingUsers.filter((u) => u.approval_status === "approved").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Rejeitados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">
              {pendingUsers.filter((u) => u.approval_status === "rejected").length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* User List */}
      <Card>
        <CardHeader>
          <CardTitle>Usuários</CardTitle>
          <CardDescription>
            Lista de todos os usuários cadastrados no sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pendingUsers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum usuário cadastrado ainda.
            </div>
          ) : (
            <div className="space-y-4">
              {pendingUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-border bg-card"
                >
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{user.name || "Sem nome"}</p>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Mail className="h-3 w-3" />
                          {user.email}
                        </div>
                      </div>
                      {getStatusBadge(user.approval_status)}
                    </div>

                    <div className="flex items-center gap-4 text-sm text-muted-foreground ml-13">
                      {user.company_name && (
                        <div className="flex items-center gap-1">
                          <Building2 className="h-3 w-3" />
                          {user.company_name}
                        </div>
                      )}
                      {user.company_api_key && user.approval_status === "approved" && (
                        <div className="flex items-center gap-1">
                          <Key className="h-3 w-3" />
                          <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                            {user.company_api_key}
                          </code>
                        </div>
                      )}
                      <span>
                        Cadastrado em{" "}
                        {format(new Date(user.created_at), "dd/MM/yyyy 'às' HH:mm", {
                          locale: ptBR,
                        })}
                      </span>
                    </div>
                  </div>

                  {user.approval_status === "pending" && (
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
                        onClick={() => handleApproval(user.id, false)}
                        disabled={processing === user.id}
                      >
                        {processing === user.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <X className="h-4 w-4" />
                        )}
                        <span className="ml-1">Rejeitar</span>
                      </Button>
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => handleApproval(user.id, true)}
                        disabled={processing === user.id}
                      >
                        {processing === user.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Check className="h-4 w-4" />
                        )}
                        <span className="ml-1">Aprovar</span>
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
