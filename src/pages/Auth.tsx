import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Play, Terminal, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().trim().email({ message: "Email inválido" }),
  password: z.string().min(6, { message: "Senha deve ter no mínimo 6 caracteres" }),
});

const signupSchema = z.object({
  name: z.string().trim().min(2, { message: "Nome deve ter no mínimo 2 caracteres" }),
  email: z.string().trim().email({ message: "Email inválido" }),
  company: z.string().trim().min(2, { message: "Empresa deve ter no mínimo 2 caracteres" }),
  password: z.string().min(6, { message: "Senha deve ter no mínimo 6 caracteres" }),
});

type TestStep = {
  type: "given" | "when" | "then";
  text: string;
  status: "pending" | "running" | "passed" | "failed";
};

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [password, setPassword] = useState("");
  const [isExecuting, setIsExecuting] = useState(false);
  const [testSteps, setTestSteps] = useState<TestStep[]>([]);
  const [showSteps, setShowSteps] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const navigate = useNavigate();

  const handleModeSwitch = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      setIsLogin(!isLogin);
      setTimeout(() => {
        setIsTransitioning(false);
      }, 50);
    }, 200);
  };

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
    { type: "given", text: `I want to create account for "${name}"`, status: "pending" },
    { type: "when", text: `I enter my name "${name}"`, status: "pending" },
    { type: "when", text: `I enter my email "${email}"`, status: "pending" },
    { type: "when", text: `I enter my company "${company}"`, status: "pending" },
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
    const schema = isLogin ? loginSchema : signupSchema;
    const data = isLogin 
      ? { email, password } 
      : { name, email, company, password };
    
    const result = schema.safeParse(data);
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
          options: { 
            emailRedirectTo: `${window.location.origin}/`,
            data: {
              name: name.trim(),
              company: company.trim(),
            }
          }
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
        return "text-given";
      case "when":
        return "text-when";
      case "then":
        return "text-then";
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Radial gradient overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_hsl(var(--secondary))_0%,_hsl(var(--background))_70%)]" />
      
      {/* Animated background grid */}
      <div className="absolute inset-0 bg-[linear-gradient(hsl(var(--primary)/0.05)_1px,transparent_1px),linear-gradient(90deg,hsl(var(--primary)/0.05)_1px,transparent_1px)] bg-[size:50px_50px]" />
      
      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute h-1 w-1 rounded-full bg-primary/20 animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${2 + Math.random() * 3}s`,
            }}
          />
        ))}
      </div>

      {/* Terminal Card */}
      <div className="relative z-10 w-full max-w-lg animate-scale-in">
        {/* Logo Header - integrated into card */}
        <div className="bg-card rounded-t-xl border border-border border-b-0 px-6 py-8 flex flex-col items-center">
          <h1 className="text-4xl font-bold text-foreground tracking-tight mb-2">
            <span className="text-primary">4</span>QA
          </h1>
          <p className="text-muted-foreground font-mono text-sm">
            Behavior-Driven Authentication
          </p>
        </div>

        {/* Terminal header - tabs style */}
        <div className="bg-secondary border-x border-border px-2 py-1 flex items-center gap-1">
          {/* Login tab */}
          <button
            onClick={() => !isLogin && handleModeSwitch()}
            disabled={isExecuting}
            className={`px-3 py-1.5 font-mono text-xs flex items-center gap-2 rounded-t transition-all duration-200 ${
              isLogin 
                ? "bg-card text-card-foreground border-t border-x border-border" 
                : "text-muted-foreground hover:text-foreground hover:bg-card/50"
            }`}
          >
            <Terminal className="h-3 w-3" />
            login.feature
          </button>
          {/* Signup tab */}
          <button
            onClick={() => isLogin && handleModeSwitch()}
            disabled={isExecuting}
            className={`px-3 py-1.5 font-mono text-xs flex items-center gap-2 rounded-t transition-all duration-200 ${
              !isLogin 
                ? "bg-card text-card-foreground border-t border-x border-border" 
                : "text-muted-foreground hover:text-foreground hover:bg-card/50"
            }`}
          >
            <Terminal className="h-3 w-3" />
            signup.feature
          </button>
        </div>

        {/* Terminal body */}
        <div className={`bg-card border border-border border-t-0 rounded-b-xl p-6 transition-all duration-200 ${
          isTransitioning ? "opacity-0 translate-y-2" : "opacity-100 translate-y-0"
        }`}>
          {/* Feature description */}
          <div className="font-mono text-sm mb-6">
            <span className="text-given">Feature:</span>
            <span className="text-muted-foreground ml-2">
              {isLogin ? "User Authentication" : "User Registration"}
            </span>
            <div className="text-muted-foreground/70 text-xs mt-1 ml-2">
              {isLogin 
                ? "As a registered user, I want to login to access my dashboard"
                : "As a new user, I want to create an account to start testing"
              }
            </div>
          </div>

          {/* BDD Steps display */}
          {showSteps && (
            <div className="mb-6 space-y-2 font-mono text-sm border-l-2 border-border pl-4 animate-fade-in">
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
                <span className="text-then">&gt;_</span> {isLogin ? "Enter test credentials" : "Enter registration data"}
              </div>
              
              {/* Name field - only for signup */}
              {!isLogin && (
                <div>
                  <label className="font-mono text-sm text-muted-foreground flex items-center gap-2 mb-2">
                    <span className="text-warning">$</span> name
                  </label>
                  <Input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe"
                    className="bg-secondary border-border font-mono text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:ring-primary/20"
                    disabled={isExecuting}
                  />
                </div>
              )}

              <div>
                <label className="font-mono text-sm text-muted-foreground flex items-center gap-2 mb-2">
                  <span className="text-warning">$</span> email
                </label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tester@qa.dev"
                  className="bg-secondary border-border font-mono text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:ring-primary/20"
                  disabled={isExecuting}
                />
              </div>

              {/* Company field - only for signup */}
              {!isLogin && (
                <div>
                  <label className="font-mono text-sm text-muted-foreground flex items-center gap-2 mb-2">
                    <span className="text-warning">$</span> company
                  </label>
                  <Input
                    type="text"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="Acme Corp"
                    className="bg-secondary border-border font-mono text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:ring-primary/20"
                    disabled={isExecuting}
                  />
                </div>
              )}

              <div>
                <label className="font-mono text-sm text-muted-foreground flex items-center gap-2 mb-2">
                  <span className="text-warning">$</span> password
                </label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="bg-secondary border-border font-mono text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:ring-primary/20"
                  disabled={isExecuting}
                />
              </div>
            </div>
          )}

          {/* Execute button */}
          <Button
            onClick={runTestSuite}
            disabled={isExecuting}
            className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-mono transition-all duration-300 group"
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

        </div>
      </div>

      {/* Footer */}
      <div className="relative z-10 mt-8 text-center animate-fade-in">
        <p className="text-muted-foreground font-mono text-xs flex items-center gap-2">
          <span className="text-then">⚙</span>
          v1.0.0 • No bugs in production™
        </p>
      </div>
    </div>
  );
};

export default Auth;
