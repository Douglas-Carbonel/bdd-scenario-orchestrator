import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Play, Terminal, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { z } from "zod";
import logo from "@/assets/logo-4qa.png";

const authSchema = z.object({
  email: z.string().trim().email({ message: "Email inválido" }),
  password: z.string().min(6, { message: "Senha deve ter no mínimo 6 caracteres" }),
});

type TestStep = {
  type: "given" | "when" | "then";
  text: string;
  status: "pending" | "running" | "passed" | "failed";
};

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isExecuting, setIsExecuting] = useState(false);
  const [testSteps, setTestSteps] = useState<TestStep[]>([]);
  const [showSteps, setShowSteps] = useState(false);
  const navigate = useNavigate();

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

  const getLoginSteps = (): TestStep[] => [
    { type: "given", text: `I am on the login page`, status: "pending" },
    { type: "given", text: `I have valid credentials for "${email}"`, status: "pending" },
    { type: "when", text: `I enter my email "${email}"`, status: "pending" },
    { type: "when", text: `I enter my password "••••••••"`, status: "pending" },
    { type: "when", text: `I click the "Execute Test Suite" button`, status: "pending" },
    { type: "then", text: `I should be authenticated successfully`, status: "pending" },
    { type: "then", text: `I should be redirected to the dashboard`, status: "pending" },
  ];

  const getSignupSteps = (): TestStep[] => [
    { type: "given", text: `I am on the signup page`, status: "pending" },
    { type: "given", text: `I want to create account for "${email}"`, status: "pending" },
    { type: "when", text: `I enter my email "${email}"`, status: "pending" },
    { type: "when", text: `I enter my password "••••••••"`, status: "pending" },
    { type: "when", text: `I click the "Execute Test Suite" button`, status: "pending" },
    { type: "then", text: `My account should be created`, status: "pending" },
    { type: "then", text: `I should receive a confirmation`, status: "pending" },
  ];

  const animateStep = (index: number, status: "running" | "passed" | "failed") => {
    setTestSteps(prev => prev.map((step, i) => 
      i === index ? { ...step, status } : step
    ));
  };

  const runTestSuite = async () => {
    const result = authSchema.safeParse({ email, password });
    if (!result.success) {
      const errorMsg = result.error.errors[0]?.message || "Dados inválidos";
      toast.error(errorMsg);
      return;
    }

    setIsExecuting(true);
    setShowSteps(true);
    const steps = isLogin ? getLoginSteps() : getSignupSteps();
    setTestSteps(steps);

    // Animate through steps
    for (let i = 0; i < steps.length - 2; i++) {
      await new Promise(resolve => setTimeout(resolve, 400));
      animateStep(i, "running");
      await new Promise(resolve => setTimeout(resolve, 300));
      animateStep(i, "passed");
    }

    // Execute actual auth
    try {
      if (isLogin) {
        animateStep(steps.length - 2, "running");
        const { error } = await supabase.auth.signInWithPassword({ 
          email: email.trim(), 
          password 
        });
        
        if (error) throw error;
        
        animateStep(steps.length - 2, "passed");
        await new Promise(resolve => setTimeout(resolve, 300));
        animateStep(steps.length - 1, "running");
        await new Promise(resolve => setTimeout(resolve, 300));
        animateStep(steps.length - 1, "passed");
        
        toast.success("✓ All tests passed! Redirecting...");
      } else {
        animateStep(steps.length - 2, "running");
        const { error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { emailRedirectTo: `${window.location.origin}/` }
        });
        
        if (error) throw error;
        
        animateStep(steps.length - 2, "passed");
        await new Promise(resolve => setTimeout(resolve, 300));
        animateStep(steps.length - 1, "running");
        await new Promise(resolve => setTimeout(resolve, 300));
        animateStep(steps.length - 1, "passed");
        
        toast.success("✓ All tests passed! Verifique seu email.");
        setTimeout(() => {
          setShowSteps(false);
          setTestSteps([]);
        }, 2000);
      }
    } catch (error: any) {
      animateStep(steps.length - 2, "failed");
      let errorMsg = error.message;
      if (error.message.includes("Invalid login credentials")) {
        errorMsg = "Email ou senha incorretos";
      } else if (error.message.includes("User already registered")) {
        errorMsg = "Este email já está cadastrado";
      }
      toast.error(`✗ Test failed: ${errorMsg}`);
      setTimeout(() => {
        setShowSteps(false);
        setTestSteps([]);
      }, 2000);
    } finally {
      setIsExecuting(false);
    }
  };

  const getStepIcon = (status: TestStep["status"]) => {
    switch (status) {
      case "running":
        return <Loader2 className="h-4 w-4 animate-spin text-yellow-400" />;
      case "passed":
        return <CheckCircle2 className="h-4 w-4 text-green-400" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-red-400" />;
      default:
        return <span className="h-4 w-4 rounded-full border border-muted-foreground/30 block" />;
    }
  };

  const getStepColor = (type: TestStep["type"]) => {
    switch (type) {
      case "given":
        return "text-blue-400";
      case "when":
        return "text-purple-400";
      case "then":
        return "text-green-400";
    }
  };

  return (
    <div className="min-h-screen bg-[#0d1117] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background grid */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(56,139,253,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(56,139,253,0.03)_1px,transparent_1px)] bg-[size:50px_50px]" />
      
      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute h-1 w-1 rounded-full bg-blue-500/20 animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${2 + Math.random() * 3}s`,
            }}
          />
        ))}
      </div>

      {/* Header with logo */}
      <div className="relative z-10 flex flex-col items-center mb-8 animate-fade-in">
        <div className="flex items-center gap-3 mb-2">
          <img src={logo} alt="4QA" className="h-12 w-auto" />
          <span className="text-2xl font-mono font-bold text-white">Portal</span>
        </div>
        <p className="text-muted-foreground font-mono text-sm">
          Behavior-Driven Authentication
        </p>
      </div>

      {/* Terminal Card */}
      <div className="relative z-10 w-full max-w-lg animate-scale-in">
        {/* Terminal header */}
        <div className="bg-[#161b22] rounded-t-lg border border-[#30363d] border-b-0 px-4 py-3 flex items-center gap-2">
          <div className="flex gap-2">
            <div className="h-3 w-3 rounded-full bg-[#ff5f56]" />
            <div className="h-3 w-3 rounded-full bg-[#ffbd2e]" />
            <div className="h-3 w-3 rounded-full bg-[#27ca40]" />
          </div>
          <span className="text-muted-foreground font-mono text-sm ml-4 flex items-center gap-2">
            <Terminal className="h-4 w-4" />
            auth.feature
          </span>
        </div>

        {/* Terminal body */}
        <div className="bg-[#0d1117] border border-[#30363d] rounded-b-lg p-6">
          {/* Feature description */}
          <div className="font-mono text-sm mb-6">
            <span className="text-purple-400">Feature:</span>
            <span className="text-muted-foreground ml-2">
              {isLogin ? "User Authentication" : "User Registration"}
            </span>
          </div>

          {/* BDD Steps display */}
          {showSteps && (
            <div className="mb-6 space-y-2 font-mono text-sm border-l-2 border-[#30363d] pl-4 animate-fade-in">
              {testSteps.map((step, index) => (
                <div
                  key={index}
                  className={`flex items-start gap-3 transition-all duration-300 ${
                    step.status === "pending" ? "opacity-40" : "opacity-100"
                  }`}
                >
                  <div className="mt-0.5 flex-shrink-0">{getStepIcon(step.status)}</div>
                  <div className="flex flex-wrap gap-1">
                    <span className={`${getStepColor(step.type)} font-semibold`}>
                      {step.type.charAt(0).toUpperCase() + step.type.slice(1)}
                    </span>
                    <span className="text-muted-foreground break-all">{step.text}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Input fields */}
          {!showSteps && (
            <div className="space-y-4 mb-6 animate-fade-in">
              <div className="font-mono text-sm text-muted-foreground mb-2">
                <span className="text-green-400">&gt;_</span> Enter test credentials
              </div>
              
              <div>
                <label className="font-mono text-sm text-muted-foreground flex items-center gap-2 mb-2">
                  <span className="text-yellow-400">$</span> email
                </label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tester@qa.dev"
                  className="bg-[#161b22] border-[#30363d] font-mono text-white placeholder:text-muted-foreground/50 focus:border-blue-500 focus:ring-blue-500/20"
                  disabled={isExecuting}
                />
              </div>

              <div>
                <label className="font-mono text-sm text-muted-foreground flex items-center gap-2 mb-2">
                  <span className="text-yellow-400">$</span> password
                </label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="bg-[#161b22] border-[#30363d] font-mono text-white placeholder:text-muted-foreground/50 focus:border-blue-500 focus:ring-blue-500/20"
                  disabled={isExecuting}
                />
              </div>
            </div>
          )}

          {/* Execute button */}
          <Button
            onClick={runTestSuite}
            disabled={isExecuting}
            className="w-full bg-[#238636] hover:bg-[#2ea043] text-white font-mono transition-all duration-300 group"
          >
            {isExecuting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Running Test Suite...
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                Execute Test Suite
              </>
            )}
          </Button>

          {/* Toggle login/signup */}
          {!showSteps && (
            <div className="mt-4 text-center">
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="font-mono text-sm text-muted-foreground hover:text-blue-400 transition-colors"
                disabled={isExecuting}
              >
                {isLogin
                  ? "// Need an account? Sign up"
                  : "// Already have account? Login"}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="relative z-10 mt-8 text-center animate-fade-in">
        <p className="text-muted-foreground font-mono text-xs flex items-center gap-2">
          <span className="text-green-400">⚙</span>
          v1.0.0 • No bugs in production™
        </p>
      </div>
    </div>
  );
};

export default Auth;
