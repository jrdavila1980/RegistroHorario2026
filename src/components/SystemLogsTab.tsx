import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, AlertCircle, ShieldAlert, MapPinOff, Bug, Download } from "lucide-react";

const PAGE_SIZE = 25;

const EVENT_TYPES = [
  { value: "all", label: "Todos los tipos" },
  { value: "login_failure", label: "Fallo de login" },
  { value: "geo_block", label: "Bloqueo geográfico" },
  { value: "gps_failure", label: "Fallo GPS" },
  { value: "error", label: "Error" },
  { value: "auth_error", label: "Error de auth" },
];

const eventIcon = (type: string) => {
  switch (type) {
    case "login_failure": return <ShieldAlert className="h-4 w-4 text-destructive" />;
    case "geo_block": return <MapPinOff className="h-4 w-4 text-warning" />;
    case "gps_failure": return <MapPinOff className="h-4 w-4 text-muted-foreground" />;
    default: return <Bug className="h-4 w-4 text-muted-foreground" />;
  }
};

const eventLabel = (type: string) => {
  const map: Record<string, string> = {
    login_failure: "Fallo login",
    geo_block: "Bloqueo geo",
    gps_failure: "Fallo GPS",
    error: "Error",
    auth_error: "Error auth",
  };
  return map[type] || type;
};

const eventVariant = (type: string): "destructive" | "secondary" | "default" => {
  if (type === "login_failure" || type === "auth_error") return "destructive";
  if (type === "geo_block") return "default";
  return "secondary";
};

export default function SystemLogsTab() {
  const [eventFilter, setEventFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(0);

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ["system_logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("system_logs" as any)
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return data as any[];
    },
  });

  const filtered = useMemo(() => {
    return logs.filter((l: any) => {
      if (eventFilter !== "all" && l.event_type !== eventFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (
          !l.message?.toLowerCase().includes(q) &&
          !l.user_agent?.toLowerCase().includes(q) &&
          !JSON.stringify(l.metadata || {}).toLowerCase().includes(q)
        ) return false;
      }
      return true;
    });
  }, [logs, eventFilter, searchQuery]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" }) +
      " " + d.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  };

  // Summary counts
  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    logs.forEach((l: any) => { c[l.event_type] = (c[l.event_type] || 0) + 1; });
    return c;
  }, [logs]);

  const exportCSV = () => {
    const header = "Fecha,Tipo,Mensaje,Metadata,User Agent\n";
    const rows = filtered.map((l: any) =>
      `"${formatDate(l.created_at)}","${eventLabel(l.event_type)}","${(l.message || "").replace(/"/g, '""')}","${JSON.stringify(l.metadata || {}).replace(/"/g, '""')}","${(l.user_agent || "").replace(/"/g, '""')}"`
    ).join("\n");
    const blob = new Blob(["\uFEFF" + header + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `system_logs_${new Date().toISOString().split("T")[0]}.csv`; a.click();
    URL.revokeObjectURL(url);
  };


  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        {[
          { type: "login_failure", icon: ShieldAlert, label: "Fallos login", color: "text-destructive" },
          { type: "geo_block", icon: MapPinOff, label: "Bloqueos geo", color: "text-warning" },
          { type: "gps_failure", icon: MapPinOff, label: "Fallos GPS", color: "text-muted-foreground" },
          { type: "error", icon: Bug, label: "Errores", color: "text-muted-foreground" },
        ].map(({ type, icon: Icon, label, color }) => (
          <Card key={type} className="cursor-pointer hover:border-primary/30 transition-colors"
            onClick={() => { setEventFilter(type); setPage(0); }}>
            <CardContent className="pt-4 pb-4 flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center">
                <Icon className={`h-4 w-4 ${color}`} />
              </div>
              <div>
                <p className="text-xl font-bold text-foreground">{counts[type] || 0}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-end">
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Tipo de evento</label>
          <Select value={eventFilter} onValueChange={(v) => { setEventFilter(v); setPage(0); }}>
            <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
            <SelectContent>
              {EVENT_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1 flex-1 min-w-[200px]">
          <label className="text-xs font-medium text-muted-foreground">Buscar</label>
          <Input
            placeholder="Buscar en mensaje o metadata..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setPage(0); }}
          />
        </div>
        <Button variant="outline" size="sm" onClick={exportCSV} disabled={filtered.length === 0} className="self-end">
          <Download className="h-4 w-4 mr-2" /> Exportar CSV
        </Button>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Logs del sistema ({filtered.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground text-center py-8">Cargando...</p>
          ) : filtered.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No hay logs del sistema 🎉</p>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Mensaje</TableHead>
                    <TableHead>Metadata</TableHead>
                    <TableHead>User Agent</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginated.map((log: any) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-mono text-xs text-foreground whitespace-nowrap">
                        {formatDate(log.created_at)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          {eventIcon(log.event_type)}
                          <Badge variant={eventVariant(log.event_type)} className="text-xs">
                            {eventLabel(log.event_type)}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-foreground max-w-[300px] truncate" title={log.message}>
                        {log.message}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate font-mono" title={JSON.stringify(log.metadata)}>
                        {log.metadata && Object.keys(log.metadata).length > 0
                          ? JSON.stringify(log.metadata)
                          : "—"}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[150px] truncate" title={log.user_agent}>
                        {log.user_agent ? log.user_agent.slice(0, 40) + "…" : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4">
                  <p className="text-sm text-muted-foreground">
                    Mostrando {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filtered.length)} de {filtered.length}
                  </p>
                  <div className="flex gap-1">
                    <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(page - 1)}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(page + 1)}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
