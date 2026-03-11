import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, X } from "lucide-react";
import { toast } from "sonner";
import { useAllRequests, useUpdateRequestStatus, type RequestType, type RequestStatus } from "@/hooks/useRequests";

const typeLabels: Record<RequestType, string> = {
  vacation: "Vacaciones", absence: "Ausencia justificada", overtime: "Horas extra", sick_leave: "Baja por enfermedad", personal_day: "Día libre elección",
};
const statusLabels: Record<RequestStatus, string> = { pending: "Pendiente", approved: "Aprobada", rejected: "Rechazada" };
const statusColors: Record<RequestStatus, string> = {
  pending: "bg-warning/15 text-warning", approved: "bg-success/15 text-success", rejected: "bg-destructive/15 text-destructive",
};

export default function ApprovalsPage() {
  const { data: requests = [] } = useAllRequests();
  const updateStatus = useUpdateRequestStatus();

  const pending = requests.filter((r) => r.status === "pending");
  const processed = requests.filter((r) => r.status !== "pending");

  const handleAction = (id: string, status: RequestStatus) => {
    updateStatus.mutate({ id, status }, {
      onSuccess: () => toast.success(status === "approved" ? "Solicitud aprobada" : "Solicitud rechazada"),
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Aprobaciones</h1>
        <p className="text-muted-foreground mt-1">Gestiona las solicitudes de tu equipo</p>
      </div>
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-3">Pendientes ({pending.length})</h2>
        {pending.length === 0 ? (
          <Card><CardContent className="py-8 text-center"><p className="text-muted-foreground">No hay solicitudes pendientes 🎉</p></CardContent></Card>
        ) : (
          <div className="space-y-3">
            {pending.map((r: any) => (
              <Card key={r.id}>
                <CardContent className="py-4 flex items-center justify-between flex-wrap gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground">{r.profiles?.name || "Empleado"}</span>
                      <span className="text-muted-foreground">•</span>
                      <span className="text-sm text-foreground">{typeLabels[r.type as RequestType]}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{r.start_date} → {r.end_date}{r.hours ? ` • ${r.hours}h` : ""}{r.reason ? ` • ${r.reason}` : ""}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="success" size="sm" onClick={() => handleAction(r.id, "approved")} disabled={updateStatus.isPending}>
                      <Check className="h-4 w-4 mr-1" /> Aprobar
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => handleAction(r.id, "rejected")} disabled={updateStatus.isPending}>
                      <X className="h-4 w-4 mr-1" /> Rechazar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-3">Procesadas</h2>
        <div className="space-y-3">
          {processed.map((r: any) => (
            <Card key={r.id}>
              <CardContent className="py-4 flex items-center justify-between flex-wrap gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground">{r.profiles?.name || "Empleado"}</span>
                    <span className="text-muted-foreground">•</span>
                    <span className="text-sm text-foreground">{typeLabels[r.type as RequestType]}</span>
                    <Badge className={statusColors[r.status as RequestStatus] + " border-0"}>{statusLabels[r.status as RequestStatus]}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{r.start_date} → {r.end_date}</p>
                </div>
              </CardContent>
            </Card>
          ))}
          {processed.length === 0 && <p className="text-sm text-muted-foreground">Sin solicitudes procesadas</p>}
        </div>
      </div>
    </div>
  );
}
