import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Lock, Loader2 } from "lucide-react";
import { verifyPassword } from "@/lib/employeeAuth";
import { useToast } from "@/hooks/use-toast";

const EmployeeLogin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const role = await verifyPassword(password);
    setSubmitting(false);
    if (role) {
      toast({
        title: role === "admin" ? "Welcome, Administrator" : "Welcome",
        description: role === "admin" ? "Admin access granted." : "Access granted.",
      });
      navigate("/admin");
    } else {
      toast({
        title: "Incorrect password",
        description: "Please try again.",
        variant: "destructive",
      });
      setPassword("");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary text-primary-foreground">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary-foreground/20 flex items-center justify-center font-bold text-lg font-serif">
              C
            </div>
            <span className="text-xl font-serif font-bold tracking-tight">Commerce Bank</span>
          </div>
          <Button variant="secondary" size="sm" onClick={() => navigate("/")}>
            <ArrowLeft className="w-4 h-4 mr-1" /> Back
          </Button>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-16">
        <Card className="p-8">
          <div className="flex flex-col items-center text-center mb-6">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-3">
              <Lock className="w-7 h-7 text-primary" />
            </div>
            <h1 className="text-2xl font-serif font-bold">Employee Login</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Enter the staff password to access the admin dashboard.
            </p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
                required
                className="mt-1"
              />
            </div>
            <Button type="submit" className="w-full" disabled={submitting || !password}>
              {submitting && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
              Sign in
            </Button>
          </form>
        </Card>
      </main>
    </div>
  );
};

export default EmployeeLogin;