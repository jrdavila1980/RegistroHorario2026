import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Plus, Pencil } from "lucide-react";
import { toast } from "sonner";
import { useMyRequests, useCreateRequest, useEditRequest, type RequestType, type RequestStatus } from "@/hooks/useRequests";

const typeLabels: Record<RequestType, string> = {
  vacation: "Vacaciones", absence: "Ausencia justificada", overtime: "Horas extra", sick_leave: "Baja por enfermedad", personal_day: "Día libre elección",
};
const statusLabels: Record<RequestStatus, string> = { pending: "Pendiente", approved: "Aprobada", rejected: "Rechazada" };
const statusColors: Record<RequestStatus, string> = {
  pending: "bg-warning/15 text-warning", approved: "bg-success/15 text-success", rejected: "bg-destructive/15 text-destructive",
};

export default function RequestsPage() {
  const { data: requests = [] } = useMyRequests();
  const createRequest = useCreateRequest();
  const editRequest = useEditRequest();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [type, setType] = useState<RequestType>("vacation");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [hours, setHours] = useState("");
  const [reason, setReason] = useState("");
  const [overtimeStart, setOvertimeStart] = useState("");
  const [overtimeEnd, setOvertimeEnd] = useState("");

  const isSingleDateType = type === "overtime" || type === "personal_day";

  const resetForm = () => {
    setEditingId(null);
    setType("vacation");
    setStartDate("");
    setEndDate("");
    setHours("");
    setReason("");
    setOvertimeStart("");
    setOvertimeEnd("");
  };

  const openNew = () => {
    resetForm();
    setOpen(true);
  };

  const openEdit = (r: typeof requests[0]) => {
    setEditingId(r.id);
    setType(r.type);
    setStartDate(r.start_date);
    setEndDate(r.end_date);
    setHours(r.hours ? String(r.hours) : "");
    setReason(r.reason || "");
    setOvertimeStart(r.overtime_start_time ? r.overtime_start_time.slice(0, 5) : "");
    setOvertimeEnd(r.overtime_end_time ? r.overtime_end_time.slice(0, 5) : "");
    setOpen(true);
  };

  const canEdit = (r: typeof requests[0]) => {
    const today = new Date().toISOString().split("T")[0];
    return r.start_date > today && (r.status === "approved" || r.status === "pending");
  };

  const handleSubmit = () => {
    if (!startDate) { toast.error("Por favor, rellena la fecha"); return; }
    if (!isSingleDateType && !endDate) { toast.error("Por favor, rellena la fecha fin"); return; }
    if (type === "overtime" && (!overtimeStart || !overtimeEnd)) { toast.error("Por favor, rellena el horario"); return; }

    const payload = {
      type,
      start_date: startDate,
      end_date: isSingleDateType ? startDate : endDate,
      hours: hours ? Number(hours) : undefined,
      reason: reason || undefined,
      overtime_start_time: type === "overtime" ? overtimeStart : undefined,
      overtime_end_time: type === "overtime" ? overtimeEnd : undefined,
    };

    if (editingId) {
      editRequest.mutate(
        { id: editingId, ...payload },
        { onSuccess: () => { setOpen(false); resetForm(); } }
      );
    } else {
      createRequest.mutate(
        payload,
        { onSuccess: () => { setOpen(false); resetForm(); } }
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Solicitudes</h1>
          <p className="text-muted-foreground mt-1">Gestiona tus vacaciones, ausencias y horas extra</p>
        </div>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
          <DialogTrigger asChild>
            <Button onClick={openNew}><Plus className="h-4 w-4 mr-2" /> Nueva solicitud</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editingId ? "Editar solicitud" : "Nueva solicitud"}</DialogTitle></DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select value={type} onValueChange={(v) => setType(v as RequestType)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vacation">Vacaciones</SelectItem>
                    <SelectItem value="absence">Ausencia justificada</SelectItem>
                    <SelectItem value="overtime">Horas extra</SelectItem>
                    <SelectItem value="sick_leave">Baja por enfermedad</SelectItem>
                    <SelectItem value="personal_day">Día libre elección</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {isSingleDateType ? (
                <div className="space-y-2"><Label>Fecha</Label><Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} /></div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Fecha inicio</Label><Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} /></div>
                  <div className="space-y-2"><Label>Fecha fin</Label><Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} /></div>
                </div>
              )}
              {type === "overtime" && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Hora inicio</Label><Input type="time" value={overtimeStart} onChange={(e) => setOvertimeStart(e.target.value)} /></div>
                  <div className="space-y-2"><Label>Hora fin</Label><Input type="time" value={overtimeEnd} onChange={(e) => setOvertimeEnd(e.target.value)} /></div>
                </div>
              )}
              <div className="space-y-2"><Label>Motivo (opcional)</Label><Textarea value={reason} onChange={(e) => setReason(e.target.value)} /></div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setOpen(false); resetForm(); }}>Cancelar</Button>
              <Button onClick={handleSubmit} disabled={createRequest.isPending || editRequest.isPending}>
                {editingId ? "Guardar cambios" : "Enviar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      {editingId && (
        <p className="text-sm text-muted-foreground bg-warning/10 border border-warning/20 rounded-md px-3 py-2">
          Al editar una solicitud aprobada, volverá a estado pendiente y requerirá nueva aprobación.
        </p>
      )}
      <div className="space-y-3">
        {requests.length === 0 ? (
          <Card><CardContent className="py-12 text-center"><p className="text-muted-foreground">No tienes solicitudes aún</p></CardContent></Card>
        ) : requests.map((r) => (
          <Card key={r.id}>
            <CardContent className="py-4 flex items-center justify-between flex-wrap gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-foreground">{typeLabels[r.type]}</span>
                  <Badge className={statusColors[r.status] + " border-0"}>{statusLabels[r.status]}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {r.start_date}{r.start_date !== r.end_date ? ` → ${r.end_date}` : ""}
                  {r.overtime_start_time && r.overtime_end_time ? ` • ${r.overtime_start_time.slice(0,5)} - ${r.overtime_end_time.slice(0,5)}` : ""}
                  {r.hours ? ` • ${r.hours}h` : ""}
                  {r.reason ? ` • ${r.reason}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {canEdit(r) && (
                  <Button variant="outline" size="sm" onClick={() => openEdit(r)}>
                    <Pencil className="h-3.5 w-3.5 mr-1" /> Editar
                  </Button>
                )}
                <p className="text-xs text-muted-foreground">Creada: {new Date(r.created_at).toLocaleDateString("es-ES")}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
