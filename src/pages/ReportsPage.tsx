import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatTime } from "@/lib/types";
import { Download, FileSpreadsheet } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useProfile, useUserRole, useAllProfiles } from "@/hooks/useProfile";
import { useTimeEntries } from "@/hooks/useTimeEntries";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";

export default function ReportsPage() {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const { data: role } = useUserRole();
  const { data: allProfiles = [] } = useAllProfiles();
  const [selectedUser, setSelectedUser] = useState(user?.id || "");
  const [period, setPeriod] = useState<"week" | "month">("week");

  // Sage export state
  const [sageOpen, setSageOpen] = useState(false);
  const [sageFrom, setSageFrom] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split("T")[0];
  });
  const [sageTo, setSageTo] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().split("T")[0];
  });
  const [sageExporting, setSageExporting] = useState(false);

  const isManager = role === "supervisor" || role === "admin";
  const activeProfiles = allProfiles.filter((p) => (p as any).is_active !== false);
  const userId = selectedUser || user?.id || "";

  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay() + 1);
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const from = period === "week" ? startOfWeek.toISOString().split("T")[0] : startOfMonth.toISOString().split("T")[0];
  const to = period === "week" ? endOfWeek.toISOString().split("T")[0] : endOfMonth.toISOString().split("T")[0];

  const { data: entries = [] } = useTimeEntries(userId, from, to);
  const filtered = entries.filter((e) => e.check_in);
  const totalWorked = filtered.reduce((sum, e) => sum + (e.total_worked_minutes || 0), 0);
  const targetUser = allProfiles.find((p) => p.user_id === userId);

  const exportCSV = () => {
    const header = "Fecha,Entrada,Inicio Comida,Fin Comida,Salida,Total (min)\n";
    const rows = filtered.map((e) =>
      `${e.date},${e.check_in || ""},${e.lunch_start || ""},${e.lunch_end || ""},${e.check_out || ""},${e.total_worked_minutes || ""}`
    ).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `informe-${period}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const formatDateSage = (dateStr: string) => {
    const [y, m, d] = dateStr.split("-");
    return `${d}/${m}/${y}`;
  };

  const minutesToHHMM = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  };

  const exportSageTimeEntries = async () => {
    setSageExporting(true);
    try {
      // Fetch all time entries for active users in the date range
      const activeUserIds = activeProfiles.map((p) => p.user_id);
      if (activeUserIds.length === 0) {
        toast.error("No hay empleados activos");
        return;
      }

      const { data: allEntries, error } = await supabase
        .from("time_entries")
        .select("*")
        .in("user_id", activeUserIds)
        .gte("date", sageFrom)
        .lte("date", sageTo)
        .not("check_in", "is", null)
        .order("date");

      if (error) throw error;

      // Build Sage 200 format: Código empleado;Fecha;Tipo incidencia;Hora entrada;Hora salida;Total horas
      const header = "Codigo empleado;Nombre;Fecha;Tipo incidencia;Hora entrada;Hora salida;Total horas\n";
      const rows = (allEntries || []).map((e) => {
        const emp = activeProfiles.find((p) => p.user_id === e.user_id);
        const empCode = (emp as any)?.employee_code || emp?.email?.split("@")[0] || e.user_id.substring(0, 8);
        const empName = emp ? `${(emp as any).first_name || ""} ${(emp as any).last_name || ""}`.trim() || emp.name : "Desconocido";
        const totalHours = e.total_worked_minutes ? minutesToHHMM(e.total_worked_minutes) : "";
        return `${empCode};${empName};${formatDateSage(e.date)};JOR;${e.check_in || ""};${e.check_out || ""};${totalHours}`;
      }).join("\n");

      const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `sage200_fichajes_${sageFrom}_${sageTo}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`${(allEntries || []).length} registros exportados para Sage 200`);
      setSageOpen(false);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSageExporting(false);
    }
  };

  const exportSageAbsences = async () => {
    setSageExporting(true);
    try {
      const activeUserIds = activeProfiles.map((p) => p.user_id);
      if (activeUserIds.length === 0) {
        toast.error("No hay empleados activos");
        return;
      }

      const { data: absences, error } = await supabase
        .from("absence_requests")
        .select("*")
        .in("user_id", activeUserIds)
        .eq("status", "approved")
        .gte("start_date", sageFrom)
        .lte("end_date", sageTo)
        .order("start_date");

      if (error) throw error;

      const typeMap: Record<string, string> = {
        vacation: "VAC",
        absence: "AUS",
        overtime: "HEX",
        sick_leave: "ENF",
        personal_day: "APE",
      };

      const header = "Codigo empleado;Nombre;Fecha inicio;Fecha fin;Tipo incidencia;Horas;Motivo\n";
      const rows = (absences || []).map((a) => {
        const emp = activeProfiles.find((p) => p.user_id === a.user_id);
        const empCode = (emp as any)?.employee_code || emp?.email?.split("@")[0] || a.user_id.substring(0, 8);
        const empName = emp ? `${(emp as any).first_name || ""} ${(emp as any).last_name || ""}`.trim() || emp.name : "Desconocido";
        const tipo = typeMap[a.type] || a.type;
        return `${empCode};${empName};${formatDateSage(a.start_date)};${formatDateSage(a.end_date)};${tipo};${a.hours || ""};${(a.reason || "").replace(/;/g, ",")}`;
      }).join("\n");

      const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `sage200_ausencias_${sageFrom}_${sageTo}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`${(absences || []).length} ausencias exportadas para Sage 200`);
      setSageOpen(false);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSageExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Informes</h1>
        <p className="text-muted-foreground mt-1">Resumen de horas trabajadas</p>
      </div>
      <div className="flex flex-wrap gap-3">
        {isManager && (
          <Select value={userId} onValueChange={setSelectedUser}>
            <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {activeProfiles.map((p) => (
                <SelectItem key={p.user_id} value={p.user_id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <Select value={period} onValueChange={(v) => setPeriod(v as "week" | "month")}>
          <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="week">Semanal</SelectItem>
            <SelectItem value="month">Mensual</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={exportCSV}><Download className="h-4 w-4 mr-2" /> Exportar CSV</Button>
        {isManager && (
          <Dialog open={sageOpen} onOpenChange={setSageOpen}>
            <DialogTrigger asChild>
              <Button variant="outline"><FileSpreadsheet className="h-4 w-4 mr-2" /> Exportar Sage 200</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Exportar para Sage 200</DialogTitle>
                <DialogDescription>
                  Genera archivos CSV en formato compatible con Sage 200 para todos los empleados activos.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Desde</Label>
                    <Input type="date" value={sageFrom} onChange={(e) => setSageFrom(e.target.value)} />
                  </div>
                  <div>
                    <Label>Hasta</Label>
                    <Input type="date" value={sageTo} onChange={(e) => setSageTo(e.target.value)} />
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Formato: CSV con separador punto y coma (;)</p>
                  <p className="text-sm text-muted-foreground">Tipos de incidencia: JOR (jornada), VAC (vacaciones), AUS (ausencia), ENF (enfermedad), HEX (horas extra), APE (asuntos personales)</p>
                </div>
              </div>
              <DialogFooter className="flex-col sm:flex-row gap-2">
                <Button onClick={exportSageTimeEntries} disabled={sageExporting}>
                  <Download className="h-4 w-4 mr-2" />
                  {sageExporting ? "Exportando..." : "Fichajes"}
                </Button>
                <Button onClick={exportSageAbsences} disabled={sageExporting} variant="secondary">
                  <Download className="h-4 w-4 mr-2" />
                  {sageExporting ? "Exportando..." : "Ausencias"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Total trabajado</p><p className="text-2xl font-bold text-foreground">{formatTime(totalWorked)}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Días registrados</p><p className="text-2xl font-bold text-foreground">{filtered.length}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Media diaria</p><p className="text-2xl font-bold text-foreground">{filtered.length > 0 ? formatTime(Math.round(totalWorked / filtered.length)) : "—"}</p></CardContent></Card>
      </div>
      <Card>
        <CardHeader><CardTitle className="text-base">Detalle — {targetUser?.name || profile?.name} ({period === "week" ? "Semana" : "Mes"} actual)</CardTitle></CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">Sin registros en este periodo</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead><TableHead>Entrada</TableHead><TableHead>Comida</TableHead><TableHead>Salida</TableHead><TableHead>Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((e) => (
                    <TableRow key={e.id}>
                      <TableCell className="font-medium">{e.date}</TableCell>
                      <TableCell>{e.check_in || "—"}</TableCell>
                      <TableCell>{e.lunch_start && e.lunch_end ? `${e.lunch_start} - ${e.lunch_end}` : "—"}</TableCell>
                      <TableCell>{e.check_out || "—"}</TableCell>
                      <TableCell>{e.total_worked_minutes ? formatTime(e.total_worked_minutes) : "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
