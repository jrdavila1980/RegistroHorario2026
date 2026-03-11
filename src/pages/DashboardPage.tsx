import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Clock, Coffee, LogOut, Play, ArrowRight, MapPin, Users, Shield } from "lucide-react";
import { formatTime, calculateEstimatedExit, getExpectedHours, normalizeTime } from "@/lib/types";
import { useProfile, useUserRole } from "@/hooks/useProfile";
import { useTodayEntry, useClockIn, useStartLunch, useEndLunch, useClockOut } from "@/hooks/useTimeEntries";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

type ClockStatus = "not_started" | "checked_in" | "lunch_started" | "lunch_ended" | "checked_out";

function getStatus(entry: any): ClockStatus {
  if (!entry || !entry.check_in) return "not_started";
  if (entry.check_out) return "checked_out";
  if (entry.lunch_end) return "lunch_ended";
  if (entry.lunch_start) return "lunch_started";
  return "checked_in";
}

function calcWorkedNow(entry: any): number {
  if (!entry?.check_in) return 0;
  const now = new Date();
  const [ch, cm] = entry.check_in.split(":").map(Number);
  const endTime = entry.check_out
    ? entry.check_out.split(":").map(Number)
    : [now.getHours(), now.getMinutes()];
  let total = (endTime[0] * 60 + endTime[1]) - (ch * 60 + cm);
  if (entry.lunch_start) {
    const [lsh, lsm] = entry.lunch_start.split(":").map(Number);
    const lunchEnd = entry.lunch_end
      ? entry.lunch_end.split(":").map(Number)
      : [now.getHours(), now.getMinutes()];
    total -= (lunchEnd[0] * 60 + lunchEnd[1]) - (lsh * 60 + lsm);
  }
  return Math.max(0, total);
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const { data: role } = useUserRole();
  const { data: entry } = useTodayEntry();
  const clockIn = useClockIn();
  const startLunch = useStartLunch();
  const endLunch = useEndLunch();
  const clockOut = useClockOut();
  const [, setTick] = useState(0);
  const navigate = useNavigate();
  const isSupervisor = role === "supervisor";

  const todayStr = new Date().toISOString().split("T")[0];
  const { data: remotePermission } = useQuery({
    queryKey: ["my_remote_permission", user?.id, todayStr],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("remote_clock_permissions" as any)
        .select("id, reason")
        .eq("user_id", user!.id)
        .eq("permission_date", todayStr)
        .maybeSingle();
      return data as any;
    },
  });

  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 30000);
    return () => clearInterval(interval);
  }, []);

  const status = getStatus(entry);
  const dayOfWeek = new Date().getDay();
  const expectedMinutes = getExpectedHours(dayOfWeek);
  const workedMinutes = calcWorkedNow(entry);
  const progress = expectedMinutes > 0 ? Math.min(100, (workedMinutes / expectedMinutes) * 100) : 0;
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  const dayName = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"][dayOfWeek];
  const lunchDuration = profile?.lunch_break_duration || 60;

  const estimatedExit = entry?.check_in
    ? calculateEstimatedExit(entry.check_in, lunchDuration, dayOfWeek)
    : null;

  const now = new Date();
  const currentTime = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;

  const statusConfig: Record<ClockStatus, { label: string; color: string }> = {
    not_started: { label: "Sin fichar", color: "bg-muted text-muted-foreground" },
    checked_in: { label: "Trabajando", color: "bg-success/15 text-success" },
    lunch_started: { label: "En pausa comida", color: "bg-warning/15 text-warning" },
    lunch_ended: { label: "Trabajando", color: "bg-success/15 text-success" },
    checked_out: { label: "Jornada finalizada", color: "bg-muted text-muted-foreground" },
  };

  const isLoading = clockIn.isPending || startLunch.isPending || endLunch.isPending || clockOut.isPending;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Hola, {(profile?.name || "").split(" ")[0]} 👋
        </h1>
        <p className="text-muted-foreground mt-1">
          {dayName}, {now.toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-medium">Estado actual</CardTitle>
              <Badge className={statusConfig[status].color + " border-0"}>
                {statusConfig[status].label}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center py-4">
              <p className="text-5xl font-bold tabular-nums text-foreground">{currentTime}</p>
            </div>
            {entry?.check_in && (
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tiempo trabajado</span>
                  <span className="font-medium text-foreground">{formatTime(workedMinutes)}</span>
                </div>
                <Progress value={progress} className="h-2" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>0h</span>
                  <span>Objetivo: {formatTime(expectedMinutes)}</span>
                </div>
              </div>
            )}
            {entry?.check_in && (
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="bg-muted rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">Entrada</p>
                  <p className="text-sm font-semibold text-foreground">{normalizeTime(entry.check_in)}</p>
                </div>
                {estimatedExit && (
                  <div className="bg-muted rounded-lg p-3">
                    <p className="text-xs text-muted-foreground">Salida estimada</p>
                    <p className="text-sm font-semibold text-foreground">{estimatedExit}</p>
                  </div>
                )}
                {entry.lunch_start && (
                  <div className="bg-muted rounded-lg p-3">
                    <p className="text-xs text-muted-foreground">Inicio comida</p>
                    <p className="text-sm font-semibold text-foreground">{normalizeTime(entry.lunch_start)}</p>
                  </div>
                )}
                {entry.lunch_end && (
                  <div className="bg-muted rounded-lg p-3">
                    <p className="text-xs text-muted-foreground">Fin comida</p>
                    <p className="text-sm font-semibold text-foreground">{normalizeTime(entry.lunch_end)}</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium">Acciones</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {isSupervisor ? (
              <div className="text-center py-8 space-y-4">
                <Users className="h-12 w-12 mx-auto text-muted-foreground" />
                <div>
                  <p className="text-lg font-medium text-foreground">Rol: Supervisor</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    No necesitas fichar. Gestiona tu equipo desde Supervisión.
                  </p>
                </div>
                <Button variant="outline" className="mt-2" onClick={() => navigate("/supervision")}>
                  <Users className="h-4 w-4 mr-2" />
                  Ir a Supervisión
                </Button>
              </div>
            ) : isWeekend ? (
              <div className="text-center py-8">
                <p className="text-lg font-medium text-muted-foreground">🎉 ¡Es fin de semana!</p>
                <p className="text-sm text-muted-foreground mt-1">No es necesario fichar hoy.</p>
              </div>
            ) : (
              <>
                {status === "not_started" && (
                  <Button variant="clock" size="xl" className="w-full" onClick={() => clockIn.mutate()} disabled={isLoading}>
                    <MapPin className="h-5 w-5 mr-2" />
                    Fichar entrada
                  </Button>
                )}
                {status === "checked_in" && (
                  <>
                    <Button variant="warning" size="xl" className="w-full" onClick={() => startLunch.mutate()} disabled={isLoading}>
                      <Coffee className="h-5 w-5 mr-2" />
                      Iniciar pausa comida
                    </Button>
                    <Button variant="outline" size="lg" className="w-full" onClick={() => clockOut.mutate()} disabled={isLoading}>
                      <LogOut className="h-5 w-5 mr-2" />
                      Fichar salida
                    </Button>
                  </>
                )}
                {status === "lunch_started" && (
                  <Button variant="success" size="xl" className="w-full" onClick={() => endLunch.mutate()} disabled={isLoading}>
                    <ArrowRight className="h-5 w-5 mr-2" />
                    Finalizar pausa comida
                  </Button>
                )}
                {status === "lunch_ended" && (
                  <Button variant="outline" size="xl" className="w-full border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground" onClick={() => clockOut.mutate()} disabled={isLoading}>
                    <LogOut className="h-5 w-5 mr-2" />
                    Fichar salida
                  </Button>
                )}
                {status === "checked_out" && (
                  <div className="text-center py-8">
                    <p className="text-lg font-medium text-foreground">✅ Jornada completada</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Has trabajado {formatTime(workedMinutes)} hoy.
                    </p>
                  </div>
                )}
                {remotePermission ? (
                  <div className="bg-primary/10 rounded-lg p-3 mt-4">
                    <div className="flex items-center gap-2 text-xs text-primary font-medium">
                      <Shield className="h-3 w-3" />
                      <span>Fichaje remoto autorizado para hoy</span>
                    </div>
                    {remotePermission.reason && (
                      <p className="text-xs text-muted-foreground mt-1">Motivo: {remotePermission.reason}</p>
                    )}
                  </div>
                ) : (
                  <div className="bg-muted rounded-lg p-3 mt-4">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      <span>Geolocalización activa • Radio: 150m</span>
                    </div>
                  </div>
                )}
                <div className="bg-muted rounded-lg p-3 mt-2">
                  <p className="text-xs text-muted-foreground">
                    Pausa de comida: {lunchDuration} min
                    {dayOfWeek === 5 ? " • Viernes: jornada de 6h" : " • Jornada: 8h 30min"}
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
