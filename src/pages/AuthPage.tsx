import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Shield } from "lucide-react";
import { logSystemEvent } from "@/lib/systemLogger";

async function checkGeoLocation(): Promise<{ allowed: boolean; country?: string }> {
  try {
    const res = await fetch("https://ipapi.co/json/", { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return { allowed: true }; // fail-open if service unavailable
    const data = await res.json();
    return { allowed: data.country_code === "ES", country: data.country_name };
  } catch {
    return { allowed: true }; // fail-open on network error
  }
}

export default function AuthPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const geo = await checkGeoLocation();
      if (!geo.allowed) {
        await logSystemEvent("geo_block", `Login bloqueado desde ${geo.country || "desconocido"}`, { email, country: geo.country });
        toast.error(`Acceso restringido: solo se permite el acceso desde España. Tu ubicación detectada: ${geo.country || "desconocida"}`);
        return;
      }
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        await logSystemEvent("login_failure", error.message, { email });
        throw error;
      }
      toast.success("Sesión iniciada");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">⏱ Registro Horario</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Inicia sesión en tu cuenta
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@empresa.com" required />
            </div>
            <div className="space-y-2">
              <Label>Contraseña</Label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required minLength={6} />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Cargando..." : "Iniciar sesión"}
            </Button>
          </form>
          <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground justify-center">
            <Shield className="h-3 w-3" />
            <span>Acceso restringido a territorio español</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
