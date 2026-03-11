import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MapPin, Clock, AlertTriangle, UserX, Building2, ChevronLeft, ChevronRight, Search, Shield } from "lucide-react";
import { formatTime, getExpectedHours, calculateWorkedMinutes } from "@/lib/types";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const PAGE_SIZE = 25;

function useAllProfiles() {
  return useQuery({
    queryKey: ["all_profiles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*");
      if (error) throw error;
      return data;
    },
  });
}

function useDepartments() {
  return useQuery({
    queryKey: ["departments"],
    queryFn: async () => {
      const { data, error } = await supabase.from("departments").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });
}

function useEntriesByDate(date: string) {
  return useQuery({
    queryKey: ["supervision_entries", date],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("time_entries")
        .select("*")
        .eq("date", date);
      if (error) throw error;
      return data;
    },
  });
}

function usePresenceLogsByDate(date: string) {
  return useQuery({
    queryKey: ["supervision_presence", date],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("presence_logs")
        .select("*")
        .gte("created_at", date + "T00:00:00")
        .lte("created_at", date + "T23:59:59");
      if (error) throw error;
      return data;
    },
  });
}

function useOffices() {
  return useQuery({
    queryKey: ["offices"],
    queryFn: async () => {
      const { data, error } = await supabase.from("offices").select("*");
      if (error) throw error;
      return data;
    },
  });
}

function calcDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const dphi = ((lat2 - lat1) * Math.PI) / 180;
  const dlambda = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dphi / 2) ** 2 + Math.cos(phi1) * Math.cos(phi2) * Math.sin(dlambda / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function findNearestOffice(lat: number | null, lon: number | null, offices: any[]): string | null {
  if (!lat || !lon || !offices.length) return null;
  let nearest = "";
  let minDist = Infinity;
  for (const o of offices) {
    const d = calcDistance(lat, lon, o.latitude, o.longitude);
    if (d < minDist) { minDist = d; nearest = o.name; }
  }
  return minDist <= 1000 ? nearest : `Fuera de oficina (${Math.round(minDist)}m)`;
}

function Pagination({ total, page, onPageChange }: { total: number; page: number; onPageChange: (p: number) => void }) {
  const totalPages = Math.ceil(total / PAGE_SIZE);
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between pt-4">
      <p className="text-sm text-muted-foreground">
        Mostrando {Math.min(page * PAGE_SIZE + 1, total)}–{Math.min((page + 1) * PAGE_SIZE, total)} de {total}
      </p>
      <div className="flex gap-1">
        <Button variant="outline" size="sm" disabled={page === 0} onClick={() => onPageChange(page - 1)}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
          const start = Math.max(0, Math.min(page - 2, totalPages - 5));
          const p = start + i;
          if (p >= totalPages) return null;
          return (
            <Button key={p} variant={p === page ? "default" : "outline"} size="sm" onClick={() => onPageChange(p)} className="w-8">
              {p + 1}
            </Button>
          );
        })}
        <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => onPageChange(page + 1)}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function paginate<T>(items: T[], page: number): T[] {
  return items.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
}

export default function SupervisionPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split("T")[0]);
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [latePage, setLatePage] = useState(0);
  const [insuffPage, setInsuffPage] = useState(0);
  const [missingPage, setMissingPage] = useState(0);
  const [officePage, setOfficePage] = useState(0);

  // Remote permission state
  const [remoteOpen, setRemoteOpen] = useState(false);
  const [remoteUserId, setRemoteUserId] = useState("");
  const [remoteUserName, setRemoteUserName] = useState("");
  const [remoteDate, setRemoteDate] = useState(new Date().toISOString().split("T")[0]);
  const [remoteReason, setRemoteReason] = useState("");
  const [remoteLoading, setRemoteLoading] = useState(false);

  const { data: profiles = [] } = useAllProfiles();
  const { data: departments = [] } = useDepartments();
  const { data: entries = [] } = useEntriesByDate(dateFilter);
  const { data: presenceLogs = [] } = usePresenceLogsByDate(dateFilter);
  const { data: offices = [] } = useOffices();

  // Fetch remote permissions for the selected date
  const { data: remotePermissions = [] } = useQuery({
    queryKey: ["remote_permissions", dateFilter],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("remote_clock_permissions" as any)
        .select("*")
        .eq("permission_date", dateFilter);
      if (error) throw error;
      return data as any[];
    },
  });

  const handleGrantRemotePermission = async () => {
    if (!remoteUserId || !remoteDate) return;
    setRemoteLoading(true);
    try {
      const { error } = await supabase
        .from("remote_clock_permissions" as any)
        .insert({
          user_id: remoteUserId,
          granted_by: user!.id,
          permission_date: remoteDate,
          reason: remoteReason || null,
        } as any);
      if (error) {
        if (error.message.includes("duplicate") || error.message.includes("unique")) {
          toast.error("Ya existe un permiso para este empleado en esa fecha");
        } else {
          throw error;
        }
        return;
      }
      toast.success(`Permiso remoto concedido a ${remoteUserName} para ${remoteDate}`);
      qc.invalidateQueries({ queryKey: ["remote_permissions"] });
      setRemoteOpen(false);
      setRemoteReason("");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setRemoteLoading(false);
    }
  };

  const handleRevokeRemotePermission = async (permId: string) => {
    const { error } = await supabase
      .from("remote_clock_permissions" as any)
      .delete()
      .eq("id", permId);
    if (error) { toast.error(error.message); return; }
    toast.success("Permiso revocado");
    qc.invalidateQueries({ queryKey: ["remote_permissions"] });
  };

  const filterDate = new Date(dateFilter + "T12:00:00");
  const dayOfWeek = filterDate.getDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
  const expectedMinutes = getExpectedHours(dayOfWeek);

  // Filter profiles by department and search
  const filteredProfiles = useMemo(() => {
    return profiles.filter((p) => {
      if (departmentFilter !== "all" && p.department_id !== departmentFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!p.name.toLowerCase().includes(q) && !p.email.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [profiles, departmentFilter, searchQuery]);

  const filteredUserIds = useMemo(() => new Set(filteredProfiles.map((p) => p.user_id)), [filteredProfiles]);

  const profileMap = useMemo(() => {
    const map = new Map<string, any>();
    filteredProfiles.forEach((p) => map.set(p.user_id, p));
    return map;
  }, [filteredProfiles]);

  const filteredEntries = useMemo(() => entries.filter((e) => filteredUserIds.has(e.user_id)), [entries, filteredUserIds]);

  const entryMap = useMemo(() => {
    const map = new Map<string, any>();
    filteredEntries.forEach((e) => map.set(e.user_id, e));
    return map;
  }, [filteredEntries]);

  const checkInLogs = useMemo(() => {
    const map = new Map<string, any>();
    presenceLogs
      .filter((l) => l.event_type === "check_in" && filteredUserIds.has(l.user_id))
      .forEach((l) => map.set(l.user_id, l));
    return map;
  }, [presenceLogs, filteredUserIds]);

  const lateArrivals = useMemo(() => {
    return filteredEntries
      .filter((e) => {
        if (!e.check_in) return false;
        const [h, m] = e.check_in.split(":").map(Number);
        return h * 60 + m > 8 * 60 + 30;
      })
      .map((e) => ({
        ...e,
        profile: profileMap.get(e.user_id),
        delay: (() => {
          const [h, m] = e.check_in!.split(":").map(Number);
          return h * 60 + m - (8 * 60 + 30);
        })(),
      }))
      .sort((a, b) => b.delay - a.delay);
  }, [filteredEntries, profileMap]);

  const insufficientHours = useMemo(() => {
    if (expectedMinutes === 0) return [];
    return filteredEntries
      .filter((e) => {
        if (!e.check_out) return false;
        const worked = calculateWorkedMinutes(e);
        return worked < expectedMinutes - 5;
      })
      .map((e) => ({
        ...e,
        profile: profileMap.get(e.user_id),
        worked: calculateWorkedMinutes(e),
        deficit: expectedMinutes - calculateWorkedMinutes(e),
      }))
      .sort((a, b) => b.deficit - a.deficit);
  }, [filteredEntries, profileMap, expectedMinutes]);

  const missingEntries = useMemo(() => {
    if (isWeekend) return [];
    return filteredProfiles.filter((p) => !entryMap.has(p.user_id));
  }, [filteredProfiles, entryMap, isWeekend]);

  const officeEntries = useMemo(() => {
    return filteredEntries.map((e) => {
      const log = checkInLogs.get(e.user_id);
      const officeName = log ? findNearestOffice(log.latitude, log.longitude, offices) : null;
      return {
        ...e,
        profile: profileMap.get(e.user_id),
        latitude: log?.latitude,
        longitude: log?.longitude,
        officeName,
        withinGeofence: log?.is_within_geofence,
      };
    });
  }, [filteredEntries, checkInLogs, offices, profileMap]);

  // Reset pages when filters change
  const resetPages = () => { setLatePage(0); setInsuffPage(0); setMissingPage(0); setOfficePage(0); };

  const deptName = (id: string | null) => departments.find((d) => d.id === id)?.name || "—";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Supervisión</h1>
        <p className="text-muted-foreground mt-1">Control de fichajes y cumplimiento horario del equipo</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-end">
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Fecha</label>
          <Input
            type="date"
            value={dateFilter}
            onChange={(e) => { setDateFilter(e.target.value); resetPages(); }}
            className="w-40"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Departamento</label>
          <Select value={departmentFilter} onValueChange={(v) => { setDepartmentFilter(v); resetPages(); }}>
            <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los departamentos</SelectItem>
              {departments.map((d) => (
                <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1 flex-1 min-w-[200px]">
          <label className="text-xs font-medium text-muted-foreground">Buscar empleado</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Nombre o email..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); resetPages(); }}
              className="pl-9"
            />
          </div>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-4 pb-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-destructive/10 flex items-center justify-center">
              <Clock className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{lateArrivals.length}</p>
              <p className="text-xs text-muted-foreground">Llegadas tarde</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-warning/10 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{insufficientHours.length}</p>
              <p className="text-xs text-muted-foreground">Horas insuficientes</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
              <UserX className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{missingEntries.length}</p>
              <p className="text-xs text-muted-foreground">Sin fichar</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{filteredEntries.length}</p>
              <p className="text-xs text-muted-foreground">Fichajes</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="late">
        <TabsList className="w-full grid grid-cols-5">
          <TabsTrigger value="late" className="text-xs sm:text-sm">🕐 Tarde ({lateArrivals.length})</TabsTrigger>
          <TabsTrigger value="insufficient" className="text-xs sm:text-sm">⚠️ Horas ({insufficientHours.length})</TabsTrigger>
          <TabsTrigger value="missing" className="text-xs sm:text-sm">❌ Sin fichar ({missingEntries.length})</TabsTrigger>
          <TabsTrigger value="offices" className="text-xs sm:text-sm">📍 Oficinas ({officeEntries.length})</TabsTrigger>
          <TabsTrigger value="remote" className="text-xs sm:text-sm">🔓 Remotos ({remotePermissions.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="late">
          <Card>
            <CardHeader><CardTitle className="text-base">Empleados con entrada después de las 08:30</CardTitle></CardHeader>
            <CardContent>
              {lateArrivals.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">Todos han fichado a tiempo 🎉</p>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Empleado</TableHead>
                        <TableHead>Departamento</TableHead>
                        <TableHead>Hora entrada</TableHead>
                        <TableHead>Retraso</TableHead>
                        <TableHead>Estado</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginate(lateArrivals, latePage).map((e) => (
                        <TableRow key={e.id}>
                          <TableCell>
                            <p className="font-medium text-foreground">{e.profile?.name || "—"}</p>
                            <p className="text-xs text-muted-foreground">{e.profile?.email}</p>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">{deptName(e.profile?.department_id)}</TableCell>
                          <TableCell className="font-mono text-foreground">{e.check_in}</TableCell>
                          <TableCell><Badge variant="destructive" className="font-mono">+{e.delay} min</Badge></TableCell>
                          <TableCell>
                            <Badge variant={e.check_out ? "secondary" : "default"}>{e.check_out ? "Finalizada" : "Trabajando"}</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <Pagination total={lateArrivals.length} page={latePage} onPageChange={setLatePage} />
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insufficient">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Empleados con menos horas de las establecidas ({formatTime(expectedMinutes)})</CardTitle>
            </CardHeader>
            <CardContent>
              {isWeekend ? (
                <p className="text-muted-foreground text-center py-8">Es fin de semana</p>
              ) : insufficientHours.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">Todos cumplen las horas 🎉</p>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Empleado</TableHead>
                        <TableHead>Departamento</TableHead>
                        <TableHead>Entrada</TableHead>
                        <TableHead>Salida</TableHead>
                        <TableHead>Trabajadas</TableHead>
                        <TableHead>Déficit</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginate(insufficientHours, insuffPage).map((e) => (
                        <TableRow key={e.id}>
                          <TableCell>
                            <p className="font-medium text-foreground">{e.profile?.name || "—"}</p>
                            <p className="text-xs text-muted-foreground">{e.profile?.email}</p>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">{deptName(e.profile?.department_id)}</TableCell>
                          <TableCell className="font-mono text-foreground">{e.check_in}</TableCell>
                          <TableCell className="font-mono text-foreground">{e.check_out}</TableCell>
                          <TableCell className="font-mono text-foreground">{formatTime(e.worked)}</TableCell>
                          <TableCell><Badge variant="destructive" className="font-mono">-{formatTime(e.deficit)}</Badge></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <Pagination total={insufficientHours.length} page={insuffPage} onPageChange={setInsuffPage} />
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="missing">
          <Card>
            <CardHeader><CardTitle className="text-base">Empleados que no han fichado</CardTitle></CardHeader>
            <CardContent>
              {isWeekend ? (
                <p className="text-muted-foreground text-center py-8">Es fin de semana</p>
              ) : missingEntries.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">Todos han fichado 🎉</p>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Empleado</TableHead>
                        <TableHead>Departamento</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Hora esperada</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginate(missingEntries, missingPage).map((p) => (
                        <TableRow key={p.id}>
                          <TableCell><p className="font-medium text-foreground">{p.name}</p></TableCell>
                          <TableCell className="text-sm text-muted-foreground">{deptName(p.department_id)}</TableCell>
                          <TableCell className="text-muted-foreground">{p.email}</TableCell>
                          <TableCell className="font-mono text-foreground">{p.expected_start_time?.slice(0, 5) || "08:30"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <Pagination total={missingEntries.length} page={missingPage} onPageChange={setMissingPage} />
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="offices">
          <Card>
            <CardHeader><CardTitle className="text-base">Ubicación de fichajes</CardTitle></CardHeader>
            <CardContent>
              {officeEntries.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No hay fichajes</p>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Empleado</TableHead>
                        <TableHead>Departamento</TableHead>
                        <TableHead>Entrada</TableHead>
                        <TableHead>Oficina</TableHead>
                        <TableHead>Geofence</TableHead>
                        <TableHead>Estado</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginate(officeEntries, officePage).map((e) => (
                        <TableRow key={e.id}>
                          <TableCell>
                            <p className="font-medium text-foreground">{e.profile?.name || "—"}</p>
                            <p className="text-xs text-muted-foreground">{e.profile?.email}</p>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">{deptName(e.profile?.department_id)}</TableCell>
                          <TableCell className="font-mono text-foreground">{e.check_in}</TableCell>
                          <TableCell>
                            {e.officeName ? (
                              <div className="flex items-center gap-1.5">
                                <MapPin className="h-3.5 w-3.5 text-primary" />
                                <span className="text-sm text-foreground">{e.officeName}</span>
                              </div>
                            ) : (
                              <span className="text-sm text-muted-foreground">Sin ubicación</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {e.withinGeofence === true ? (
                              <Badge className="bg-success/15 text-success border-0">Dentro</Badge>
                            ) : e.withinGeofence === false ? (
                              <Badge className="bg-destructive/15 text-destructive border-0">Fuera</Badge>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant={e.check_out ? "secondary" : "default"}>
                              {e.check_out ? "Finalizada" : e.lunch_start && !e.lunch_end ? "Comida" : "Trabajando"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <Pagination total={officeEntries.length} page={officePage} onPageChange={setOfficePage} />
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="remote">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Permisos de fichaje remoto</CardTitle>
              <Button size="sm" onClick={() => {
                setRemoteDate(dateFilter);
                setRemoteUserId("");
                setRemoteUserName("");
                setRemoteReason("");
                setRemoteOpen(true);
              }}>
                <Shield className="h-4 w-4 mr-2" /> Conceder permiso
              </Button>
            </CardHeader>
            <CardContent>
              {remotePermissions.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No hay permisos remotos para esta fecha</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Empleado</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Motivo</TableHead>
                      <TableHead>Concedido por</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {remotePermissions.map((perm: any) => {
                      const emp = profiles.find((p) => p.user_id === perm.user_id);
                      const grantor = profiles.find((p) => p.user_id === perm.granted_by);
                      return (
                        <TableRow key={perm.id}>
                          <TableCell>
                            <p className="font-medium text-foreground">{emp?.name || "—"}</p>
                            <p className="text-xs text-muted-foreground">{emp?.email}</p>
                          </TableCell>
                          <TableCell className="font-mono text-foreground">{perm.permission_date}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{perm.reason || "—"}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{grantor?.name || "—"}</TableCell>
                          <TableCell>
                            <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleRevokeRemotePermission(perm.id)}>
                              Revocar
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Grant remote permission dialog */}
      <Dialog open={remoteOpen} onOpenChange={setRemoteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Conceder permiso de fichaje remoto</DialogTitle>
            <DialogDescription>
              Permite al empleado fichar sin estar dentro del rango de la oficina durante un día completo.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Empleado</Label>
              <Select value={remoteUserId} onValueChange={(v) => {
                setRemoteUserId(v);
                const emp = filteredProfiles.find((p) => p.user_id === v);
                setRemoteUserName(emp?.name || "");
              }}>
                <SelectTrigger><SelectValue placeholder="Seleccionar empleado" /></SelectTrigger>
                <SelectContent>
                  {filteredProfiles
                    .filter((p) => (p as any).is_active !== false)
                    .map((p) => (
                      <SelectItem key={p.user_id} value={p.user_id}>{p.name}</SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Fecha</Label>
              <Input type="date" value={remoteDate} onChange={(e) => setRemoteDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Motivo (opcional)</Label>
              <Textarea value={remoteReason} onChange={(e) => setRemoteReason(e.target.value)} placeholder="Ej: Visita a cliente, teletrabajo puntual..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRemoteOpen(false)}>Cancelar</Button>
            <Button onClick={handleGrantRemotePermission} disabled={remoteLoading || !remoteUserId}>
              {remoteLoading ? "Concediendo..." : "Conceder permiso"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
