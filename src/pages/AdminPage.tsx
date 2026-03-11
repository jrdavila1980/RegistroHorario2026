import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Trash2, Users, CalendarDays, Building2, MapPin, Upload, UserPlus, FileSpreadsheet, AlertCircle, CheckCircle2, KeyRound, Globe, Briefcase, Pencil, Download, ScrollText } from "lucide-react";
import SystemLogsTab from "@/components/SystemLogsTab";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAllProfiles, useDepartments, useOffices, useAllUserRoles } from "@/hooks/useProfile";
import { useHolidays } from "@/hooks/useRequests";
import { useHolidayCalendars, useCreateCalendar, useDeleteCalendar, SPANISH_REGIONS, NATIONAL_HOLIDAYS_2025, REGIONAL_HOLIDAYS_2025 } from "@/hooks/useHolidayCalendars";
import { useWorkAgreements, useCreateWorkAgreement, useUpdateWorkAgreement, useDeleteWorkAgreement, SECTORS, type WorkAgreement } from "@/hooks/useWorkAgreements";
import { SPANISH_REGIONS as AGREEMENT_REGIONS } from "@/hooks/useHolidayCalendars";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { useQueryClient } from "@tanstack/react-query";
import type { Enums } from "@/integrations/supabase/types";
import { Badge } from "@/components/ui/badge";

type AppRole = Enums<"app_role">;

interface NewUser {
  email: string;
  name: string;
  first_name?: string;
  last_name?: string;
  employee_code?: string;
  password?: string;
  role?: string;
  department_id?: string;
  office_id?: string;
  lunch_break_duration?: number;
}

interface ImportResult {
  email: string;
  success: boolean;
  error?: string;
}

export default function AdminPage() {
  const { data: profiles = [] } = useAllProfiles();
  const { data: holidays = [] } = useHolidays();
  const { data: departments = [] } = useDepartments();
  const { data: offices = [] } = useOffices();
  const { data: allRoles = [] } = useAllUserRoles();
  const { data: calendars = [] } = useHolidayCalendars();
  const { data: agreements = [] } = useWorkAgreements();
  const createCalendar = useCreateCalendar();
  const deleteCalendar = useDeleteCalendar();
  const deleteAgreement = useDeleteWorkAgreement();
  const createAgreement = useCreateWorkAgreement();
  const updateAgreement = useUpdateWorkAgreement();
  const qc = useQueryClient();

  // Agreement dialog state
  const [agreementOpen, setAgreementOpen] = useState(false);
  const [editingAgreement, setEditingAgreement] = useState<WorkAgreement | null>(null);
  const [agName, setAgName] = useState("");
  const [agSector, setAgSector] = useState("");
  const [agRegion, setAgRegion] = useState("Nacional");
  const [agWeeklyHours, setAgWeeklyHours] = useState("40");
  const [agAnnualHours, setAgAnnualHours] = useState("1760");
  const [agVacationDays, setAgVacationDays] = useState("22");
  const [agFridayHours, setAgFridayHours] = useState("");
  const [agSummerIntensive, setAgSummerIntensive] = useState(false);
  const [agSummerStart, setAgSummerStart] = useState("");
  const [agSummerEnd, setAgSummerEnd] = useState("");
  const [agNotes, setAgNotes] = useState("");
  // Holiday state
  const [holidayOpen, setHolidayOpen] = useState(false);
  const [holidayDate, setHolidayDate] = useState("");
  const [holidayName, setHolidayName] = useState("");
  const [holidayCalendarId, setHolidayCalendarId] = useState<string>("");

  // Calendar state
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [calendarRegion, setCalendarRegion] = useState("");
  const [importingCalendar, setImportingCalendar] = useState(false);

  // Department state
  const [deptOpen, setDeptOpen] = useState(false);
  const [deptName, setDeptName] = useState("");

  // Office state
  const [officeOpen, setOfficeOpen] = useState(false);
  const [officeName, setOfficeName] = useState("");
  const [officeLat, setOfficeLat] = useState("");
  const [officeLon, setOfficeLon] = useState("");

  // Register employee state
  const [registerOpen, setRegisterOpen] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newFirstName, setNewFirstName] = useState("");
  const [newLastName, setNewLastName] = useState("");
  const [newEmployeeCode, setNewEmployeeCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState<string>("employee");
  const [newDept, setNewDept] = useState<string>("");
  const [newOffice, setNewOffice] = useState<string>("");
  const [newLunch, setNewLunch] = useState<string>("30");
  const [registerLoading, setRegisterLoading] = useState(false);

  // Import state
  const [importOpen, setImportOpen] = useState(false);
  const [importData, setImportData] = useState<NewUser[]>([]);
  const [importResults, setImportResults] = useState<ImportResult[]>([]);
  const [importLoading, setImportLoading] = useState(false);
  const [importStep, setImportStep] = useState<"upload" | "preview" | "results">("upload");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Password reset state
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [passwordUserId, setPasswordUserId] = useState("");
  const [passwordUserName, setPasswordUserName] = useState("");
  const [newPasswordValue, setNewPasswordValue] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Delete/deactivate user state
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteUserId, setDeleteUserId] = useState("");
  const [deleteUserName, setDeleteUserName] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteMode, setDeleteMode] = useState<"deactivate" | "delete">("deactivate");
  const [showInactive, setShowInactive] = useState(false);

  const resetAgreementForm = () => {
    setAgName(""); setAgSector(""); setAgRegion("Nacional");
    setAgWeeklyHours("40"); setAgAnnualHours("1760"); setAgVacationDays("22");
    setAgFridayHours(""); setAgSummerIntensive(false);
    setAgSummerStart(""); setAgSummerEnd(""); setAgNotes("");
    setEditingAgreement(null);
  };

  const openNewAgreement = () => {
    resetAgreementForm();
    setAgreementOpen(true);
  };

  const openEditAgreement = (a: WorkAgreement) => {
    setEditingAgreement(a);
    setAgName(a.name); setAgSector(a.sector); setAgRegion(a.region);
    setAgWeeklyHours(String(a.weekly_hours)); setAgAnnualHours(String(a.annual_hours));
    setAgVacationDays(String(a.vacation_days));
    setAgFridayHours(a.friday_reduced_hours ? String(a.friday_reduced_hours) : "");
    setAgSummerIntensive(a.summer_intensive);
    setAgSummerStart(a.summer_start_month ? String(a.summer_start_month) : "");
    setAgSummerEnd(a.summer_end_month ? String(a.summer_end_month) : "");
    setAgNotes(a.notes || "");
    setAgreementOpen(true);
  };

  const handleSaveAgreement = async () => {
    if (!agName || !agSector) { toast.error("Nombre y sector son obligatorios"); return; }
    const payload = {
      name: agName,
      sector: agSector,
      region: agRegion || "Nacional",
      weekly_hours: parseFloat(agWeeklyHours) || 40,
      annual_hours: parseFloat(agAnnualHours) || 1760,
      vacation_days: parseInt(agVacationDays) || 22,
      friday_reduced_hours: agFridayHours ? parseFloat(agFridayHours) : null,
      summer_intensive: agSummerIntensive,
      summer_start_month: agSummerStart ? parseInt(agSummerStart) : null,
      summer_end_month: agSummerEnd ? parseInt(agSummerEnd) : null,
      notes: agNotes || null,
      is_template: false,
    };
    try {
      if (editingAgreement) {
        await updateAgreement.mutateAsync({ id: editingAgreement.id, ...payload });
        toast.success("Convenio actualizado");
      } else {
        await createAgreement.mutateAsync(payload);
        toast.success("Convenio creado");
      }
      setAgreementOpen(false);
      resetAgreementForm();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  // --- Handlers ---

  const handleAddHoliday = async () => {
    if (!holidayDate || !holidayName) { toast.error("Fecha y nombre obligatorios"); return; }
    const insertData: any = { date: holidayDate, name: holidayName };
    if (holidayCalendarId) insertData.calendar_id = holidayCalendarId;
    const { error } = await supabase.from("holidays").insert(insertData);
    if (error) { toast.error(error.message); return; }
    toast.success("Festivo añadido");
    qc.invalidateQueries({ queryKey: ["holidays"] });
    setHolidayOpen(false); setHolidayDate(""); setHolidayName(""); setHolidayCalendarId("");
  };

  const handleDeleteHoliday = async (id: string) => {
    await supabase.from("holidays").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["holidays"] });
    toast.success("Festivo eliminado");
  };

  const handleAddDept = async () => {
    if (!deptName) { toast.error("Nombre obligatorio"); return; }
    const { error } = await supabase.from("departments").insert({ name: deptName });
    if (error) { toast.error(error.message); return; }
    toast.success("Departamento creado");
    qc.invalidateQueries({ queryKey: ["departments"] });
    setDeptOpen(false); setDeptName("");
  };

  const handleAddOffice = async () => {
    if (!officeName || !officeLat || !officeLon) { toast.error("Completa todos los campos"); return; }
    const { error } = await supabase.from("offices").insert({
      name: officeName, latitude: Number(officeLat), longitude: Number(officeLon), radius_meters: 150,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Oficina añadida");
    qc.invalidateQueries({ queryKey: ["offices"] });
    setOfficeOpen(false); setOfficeName(""); setOfficeLat(""); setOfficeLon("");
  };

  const handleUpdateLunch = async (userId: string, duration: number) => {
    const { error } = await supabase.from("profiles").update({ lunch_break_duration: duration }).eq("user_id", userId);
    if (error) { toast.error(error.message); return; }
    qc.invalidateQueries({ queryKey: ["all_profiles"] });
    toast.success("Pausa actualizada");
  };

  const handleUpdateRole = async (userId: string, role: AppRole) => {
    await supabase.from("user_roles").delete().eq("user_id", userId);
    const { error } = await supabase.from("user_roles").insert({ user_id: userId, role });
    if (error) { toast.error(error.message); return; }
    qc.invalidateQueries({ queryKey: ["all_user_roles"] });
    toast.success("Rol actualizado");
  };

  const handleUpdateSupervisor = async (userId: string, supervisorId: string) => {
    const { error } = await supabase.from("profiles").update({ 
      supervisor_id: supervisorId || null 
    }).eq("user_id", userId);
    if (error) { toast.error(error.message); return; }
    qc.invalidateQueries({ queryKey: ["all_profiles"] });
    toast.success("Responsable asignado");
  };

  const getRoleForUser = (userId: string): AppRole => {
    const userRoles = allRoles.filter(r => r.user_id === userId).map(r => r.role);
    if (userRoles.includes("admin")) return "admin";
    if (userRoles.includes("supervisor")) return "supervisor";
    return "employee";
  };

  const handleUpdateProfileField = async (userId: string, field: string, value: string) => {
    const updates: Record<string, any> = { [field]: value || null };
    // Keep name in sync when first_name or last_name changes
    if (field === "first_name" || field === "last_name") {
      const p = profiles.find((pr) => pr.user_id === userId);
      const first = field === "first_name" ? value : ((p as any)?.first_name || p?.name || "");
      const last = field === "last_name" ? value : ((p as any)?.last_name || "");
      updates.name = `${first} ${last}`.trim();
    }
    const { error } = await supabase.from("profiles").update(updates as any).eq("user_id", userId);
    if (error) { toast.error(error.message); return; }
    qc.invalidateQueries({ queryKey: ["all_profiles"] });
  };

  const roleLabel = (role: AppRole) => {
    const map: Record<AppRole, string> = { admin: "Admin", supervisor: "Supervisor", employee: "Empleado" };
    return map[role] || role;
  };

  const handleUpdateStartTime = async (userId: string, time: string) => {
    const { error } = await supabase.from("profiles").update({ expected_start_time: time }).eq("user_id", userId);
    if (error) { toast.error(error.message); return; }
    qc.invalidateQueries({ queryKey: ["all_profiles"] });
    toast.success("Hora de entrada actualizada");
  };

  const handleUpdateDepartment = async (userId: string, departmentId: string) => {
    const { error } = await supabase.from("profiles").update({ 
      department_id: departmentId || null 
    }).eq("user_id", userId);
    if (error) { toast.error(error.message); return; }
    qc.invalidateQueries({ queryKey: ["all_profiles"] });
    toast.success("Departamento asignado");
  };

  const handleUpdateOffice = async (userId: string, officeId: string) => {
    const actualOfficeId = officeId === "none" ? null : officeId;
    const selectedOffice = offices.find(o => o.id === actualOfficeId);
    const isAmenabar = selectedOffice?.name?.toLowerCase().includes("amenabar miramon");
    const lunchDuration = actualOfficeId ? (isAmenabar ? 30 : 60) : 60;
    const { error } = await supabase.from("profiles").update({ 
      office_id: actualOfficeId,
      lunch_break_duration: lunchDuration,
    }).eq("user_id", userId);
    if (error) { toast.error(error.message); return; }
    qc.invalidateQueries({ queryKey: ["all_profiles"] });
    toast.success(`Oficina asignada (pausa: ${lunchDuration} min)`);
  };

  const handleUpdateCalendar = async (userId: string, calendarId: string) => {
    const { error } = await supabase.from("profiles").update({ 
      holiday_calendar_id: calendarId || null 
    }).eq("user_id", userId);
    if (error) { toast.error(error.message); return; }
    qc.invalidateQueries({ queryKey: ["all_profiles"] });
    toast.success("Calendario asignado");
  };

  const handleUpdateAgreement = async (userId: string, agreementId: string) => {
    const { error } = await supabase.from("profiles").update({ 
      work_agreement_id: agreementId || null 
    }).eq("user_id", userId);
    if (error) { toast.error(error.message); return; }
    qc.invalidateQueries({ queryKey: ["all_profiles"] });
    toast.success("Convenio asignado");
  };

  const handleToggleReports = async (userId: string, canView: boolean) => {
    const { error } = await supabase.from("profiles").update({ 
      can_view_reports: canView 
    } as any).eq("user_id", userId);
    if (error) { toast.error(error.message); return; }
    qc.invalidateQueries({ queryKey: ["all_profiles"] });
    toast.success(canView ? "Acceso a informes activado" : "Acceso a informes desactivado");
  };

  const handleDeleteUser = async () => {
    setDeleteLoading(true);
    try {
      const action = deleteMode === "deactivate" ? "deactivate_user" : "delete_user";
      const { data, error } = await supabase.functions.invoke("admin-create-user", {
        body: { action, user_id: deleteUserId },
      });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      const msg = deleteMode === "deactivate" 
        ? `Usuario ${deleteUserName} dado de baja` 
        : `Usuario ${deleteUserName} eliminado permanentemente`;
      toast.success(msg);
      qc.invalidateQueries({ queryKey: ["all_profiles"] });
      qc.invalidateQueries({ queryKey: ["all_user_roles"] });
      setDeleteOpen(false);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleReactivateUser = async (userId: string, userName: string) => {
    try {
      const { data, error } = await supabase.functions.invoke("admin-create-user", {
        body: { action: "reactivate_user", user_id: userId },
      });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      toast.success(`Usuario ${userName} reactivado`);
      qc.invalidateQueries({ queryKey: ["all_profiles"] });
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleResetPassword = async () => {
    if (!newPasswordValue || newPasswordValue.length < 6) {
      toast.error("La contraseña debe tener al menos 6 caracteres");
      return;
    }
    setPasswordLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-create-user", {
        body: { action: "reset_password", user_id: passwordUserId, new_password: newPasswordValue },
      });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      toast.success(`Contraseña de ${passwordUserName} actualizada`);
      setPasswordOpen(false);
      setNewPasswordValue("");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleCreateCalendar = async () => {
    if (!calendarRegion) { toast.error("Selecciona una comunidad autónoma"); return; }
    setImportingCalendar(true);
    try {
      const result = await createCalendar.mutateAsync({ name: `Festivos ${calendarRegion}`, region: calendarRegion });
      // Insert national holidays
      const allHolidays = [
        ...NATIONAL_HOLIDAYS_2025.map((h) => ({ ...h, calendar_id: result.id })),
        ...(REGIONAL_HOLIDAYS_2025[calendarRegion] || []).map((h) => ({ ...h, calendar_id: result.id })),
      ];
      if (allHolidays.length > 0) {
        const { error } = await supabase.from("holidays").insert(allHolidays);
        if (error) throw error;
      }
      qc.invalidateQueries({ queryKey: ["holidays"] });
      toast.success(`Calendario de ${calendarRegion} creado con ${allHolidays.length} festivos`);
      setCalendarOpen(false);
      setCalendarRegion("");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setImportingCalendar(false);
    }
  };

  const callCreateUsers = async (users: NewUser[]) => {
    const { data, error } = await supabase.functions.invoke("admin-create-user", {
      body: { users },
    });
    if (error) throw new Error(error.message);
    return data as { results: ImportResult[]; successCount: number; totalCount: number };
  };

  const handleRegisterEmployee = async () => {
    if (!newEmail || !newFirstName || !newLastName) { toast.error("Email, nombre y apellido son obligatorios"); return; }
    setRegisterLoading(true);
    try {
      const fullName = `${newFirstName.trim()} ${newLastName.trim()}`;
      const user: NewUser = {
        email: newEmail.trim(), name: fullName,
        first_name: newFirstName.trim(), last_name: newLastName.trim(),
        employee_code: newEmployeeCode.trim() || undefined,
        password: newPassword || undefined,
        role: newRole, department_id: newDept || undefined, office_id: newOffice || undefined,
        lunch_break_duration: Number(newLunch),
      };
      const result = await callCreateUsers([user]);
      if (result.results[0]?.success) {
        toast.success(`Empleado ${newEmail} registrado correctamente`);
        qc.invalidateQueries({ queryKey: ["all_profiles"] });
        setRegisterOpen(false);
        setNewEmail(""); setNewFirstName(""); setNewLastName(""); setNewEmployeeCode("");
        setNewPassword(""); setNewRole("employee"); setNewDept(""); setNewOffice(""); setNewLunch("30");
      } else {
        toast.error(result.results[0]?.error || "Error al crear el usuario");
      }
    } catch (err: any) { toast.error(err.message); }
    finally { setRegisterLoading(false); }
  };

  const downloadCSVTemplate = () => {
    const header = "email,nombre,apellidos,codigo_empleado,contraseña,rol,departamento,oficina,pausa_comida\n";
    const example = "ejemplo@empresa.es,Nombre,Apellido,EMP001,,employee,,,,\n";
    const blob = new Blob([header + example], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "plantilla_empleados.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  const exportEmployeesCSV = () => {
    const header = "codigo_empleado,nombre,apellidos,email,rol,departamento,oficina,pausa_comida\n";
    const rows = profiles.map((p) => {
      const userRoles = allRoles.filter((r) => r.user_id === p.user_id);
      const role = userRoles.find((r) => r.role === "admin")?.role
        || userRoles.find((r) => r.role === "supervisor")?.role
        || "employee";
      const dept = departments.find((d) => d.id === p.department_id)?.name || "";
      const office = offices.find((o) => o.id === p.office_id)?.name || "";
      return `${(p as any).employee_code || ""},${(p as any).first_name || p.name},${(p as any).last_name || ""},${p.email},${role},${dept},${office},${p.lunch_break_duration}`;
    }).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "empleados.csv"; a.click();
    URL.revokeObjectURL(url);
    toast.success(`${profiles.length} empleados exportados`);
  };

  const parseCSV = (text: string): NewUser[] => {
    const lines = text.split(/\r?\n/).filter((l) => l.trim());
    if (lines.length < 2) return [];
    const headerLine = lines[0].toLowerCase();
    const separator = headerLine.includes(";") ? ";" : ",";
    const headers = headerLine.split(separator).map((h) => h.trim().replace(/^["']|["']$/g, ""));
    const emailIdx = headers.findIndex((h) => h.includes("email") || h.includes("correo"));
    const nameIdx = headers.findIndex((h) => h.includes("nombre") || h.includes("name"));
    const lastNameIdx = headers.findIndex((h) => h.includes("apellido") || h.includes("last_name") || h.includes("apellidos"));
    const codeIdx = headers.findIndex((h) => h.includes("codigo") || h.includes("code") || h.includes("código"));
    const passwordIdx = headers.findIndex((h) => h.includes("password") || h.includes("contraseña"));
    const roleIdx = headers.findIndex((h) => h.includes("rol") || h.includes("role"));
    const deptIdx = headers.findIndex((h) => h.includes("depart") || h.includes("dept"));
    const officeIdx = headers.findIndex((h) => h.includes("oficina") || h.includes("office"));
    const lunchIdx = headers.findIndex((h) => h.includes("comida") || h.includes("lunch") || h.includes("pausa"));
    if (emailIdx === -1 || nameIdx === -1) return [];
    return lines.slice(1).map((line) => {
      const cols = line.split(separator).map((c) => c.trim().replace(/^["']|["']$/g, ""));
      const deptValue = deptIdx >= 0 ? cols[deptIdx] : undefined;
      const officeValue = officeIdx >= 0 ? cols[officeIdx] : undefined;
      const matchedDept = deptValue ? departments.find((d) => d.name.toLowerCase() === deptValue.toLowerCase()) : undefined;
      const matchedOffice = officeValue ? offices.find((o) => o.name.toLowerCase() === officeValue.toLowerCase()) : undefined;
      const firstName = cols[nameIdx] || "";
      const lastName = lastNameIdx >= 0 ? cols[lastNameIdx] || "" : "";
      const fullName = lastName ? `${firstName} ${lastName}` : firstName;
      return {
        email: cols[emailIdx] || "", name: fullName,
        first_name: firstName, last_name: lastName,
        employee_code: codeIdx >= 0 ? cols[codeIdx] : undefined,
        password: passwordIdx >= 0 ? cols[passwordIdx] : undefined,
        role: roleIdx >= 0 ? cols[roleIdx]?.toLowerCase() : undefined,
        department_id: matchedDept?.id, office_id: matchedOffice?.id,
        lunch_break_duration: lunchIdx >= 0 ? Number(cols[lunchIdx]) || 30 : 30,
      } as NewUser;
    }).filter((u) => u.email && u.name);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const users = parseCSV(text);
      if (users.length === 0) { toast.error("No se pudieron leer usuarios."); return; }
      setImportData(users);
      setImportStep("preview");
    };
    reader.readAsText(file);
  };

  const handleImportConfirm = async () => {
    setImportLoading(true);
    try {
      const result = await callCreateUsers(importData);
      setImportResults(result.results);
      setImportStep("results");
      toast.success(`${result.successCount} de ${result.totalCount} empleados importados`);
      qc.invalidateQueries({ queryKey: ["all_profiles"] });
    } catch (err: any) { toast.error(err.message); }
    finally { setImportLoading(false); }
  };

  const resetImport = () => {
    setImportData([]); setImportResults([]); setImportStep("upload");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const roleLabels: Record<AppRole, string> = { employee: "Empleado", supervisor: "Supervisor", admin: "Admin" };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Administración</h1>
          <p className="text-muted-foreground mt-1">Gestiona empleados, calendarios, departamentos y oficinas</p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <a href="/system-overview" target="_blank" className="gap-2">
            <FileSpreadsheet className="h-4 w-4" /> Documento para Dirección
          </a>
        </Button>
      </div>

      <Tabs defaultValue="users">
        <TabsList className="flex-wrap">
          <TabsTrigger value="users" className="gap-2"><Users className="h-4 w-4" /> Empleados</TabsTrigger>
          <TabsTrigger value="agreements" className="gap-2"><Briefcase className="h-4 w-4" /> Convenios</TabsTrigger>
          <TabsTrigger value="calendars" className="gap-2"><Globe className="h-4 w-4" /> Calendarios</TabsTrigger>
          <TabsTrigger value="holidays" className="gap-2"><CalendarDays className="h-4 w-4" /> Festivos</TabsTrigger>
          <TabsTrigger value="departments" className="gap-2"><Building2 className="h-4 w-4" /> Departamentos</TabsTrigger>
          <TabsTrigger value="offices" className="gap-2"><MapPin className="h-4 w-4" /> Oficinas</TabsTrigger>
          <TabsTrigger value="logs" className="gap-2"><ScrollText className="h-4 w-4" /> Logs</TabsTrigger>
        </TabsList>

        {/* ===== USERS TAB ===== */}
        <TabsContent value="users" className="space-y-4">
          <div className="flex flex-wrap gap-2 justify-end">
            <Dialog open={registerOpen} onOpenChange={setRegisterOpen}>
              <DialogTrigger asChild>
                <Button><UserPlus className="h-4 w-4 mr-2" /> Registrar empleado</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>Registrar nuevo empleado</DialogTitle>
                  <DialogDescription>Se creará una cuenta con acceso inmediato.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2"><Label>Código empleado</Label><Input value={newEmployeeCode} onChange={(e) => setNewEmployeeCode(e.target.value)} placeholder="Ej: EMP001" /></div>
                    <div className="space-y-2"><Label>Nombre *</Label><Input value={newFirstName} onChange={(e) => setNewFirstName(e.target.value)} placeholder="Nombre" /></div>
                    <div className="space-y-2"><Label>Apellidos *</Label><Input value={newLastName} onChange={(e) => setNewLastName(e.target.value)} placeholder="Apellidos" /></div>
                  </div>
                  <div className="space-y-2"><Label>Email *</Label><Input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="email@empresa.com" /></div>
                  <div className="space-y-2">
                    <Label>Contraseña</Label>
                    <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Dejar vacío para generar automática" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Rol</Label>
                      <Select value={newRole} onValueChange={setNewRole}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="employee">Empleado</SelectItem>
                          <SelectItem value="supervisor">Supervisor</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Pausa comida</Label>
                      <Select value={newLunch} onValueChange={setNewLunch}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="30">30 min</SelectItem>
                          <SelectItem value="60">60 min</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Departamento</Label>
                      <Select value={newDept} onValueChange={setNewDept}>
                        <SelectTrigger><SelectValue placeholder="Ninguno" /></SelectTrigger>
                        <SelectContent>{departments.map((d) => (<SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>))}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Oficina</Label>
                      <Select value={newOffice} onValueChange={setNewOffice}>
                        <SelectTrigger><SelectValue placeholder="Ninguna" /></SelectTrigger>
                        <SelectContent>{offices.map((o) => (<SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>))}</SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setRegisterOpen(false)}>Cancelar</Button>
                  <Button onClick={handleRegisterEmployee} disabled={registerLoading}>{registerLoading ? "Creando..." : "Registrar"}</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Button variant="outline" onClick={downloadCSVTemplate}><Download className="h-4 w-4 mr-2" /> Plantilla CSV</Button>
            <Button variant="outline" onClick={exportEmployeesCSV}><Download className="h-4 w-4 mr-2" /> Exportar empleados</Button>

            <Dialog open={importOpen} onOpenChange={(open) => { setImportOpen(open); if (!open) resetImport(); }}>
              <DialogTrigger asChild>
                <Button variant="outline"><FileSpreadsheet className="h-4 w-4 mr-2" /> Importar CSV</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Importar empleados</DialogTitle>
                  <DialogDescription>CSV con columnas: <strong>email</strong>, <strong>nombre</strong>. Opcionales: contraseña, rol, departamento, oficina, pausa_comida.</DialogDescription>
                </DialogHeader>
                {importStep === "upload" && (
                  <div className="py-6">
                    <div className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors" onClick={() => fileInputRef.current?.click()}>
                      <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                      <p className="font-medium text-foreground">Haz clic para seleccionar un archivo</p>
                      <p className="text-sm text-muted-foreground mt-1">CSV o TXT</p>
                    </div>
                    <input ref={fileInputRef} type="file" accept=".csv,.txt,.tsv" className="hidden" onChange={handleFileUpload} />
                  </div>
                )}
                {importStep === "preview" && (
                  <div className="py-4 space-y-4">
                    <Badge variant="secondary">{importData.length} empleados</Badge>
                    <div className="overflow-x-auto max-h-60 border rounded-lg">
                      <Table>
                        <TableHeader><TableRow><TableHead>Nombre</TableHead><TableHead>Email</TableHead><TableHead>Rol</TableHead></TableRow></TableHeader>
                        <TableBody>{importData.map((u, i) => (<TableRow key={i}><TableCell>{u.name}</TableCell><TableCell>{u.email}</TableCell><TableCell>{u.role || "employee"}</TableCell></TableRow>))}</TableBody>
                      </Table>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={resetImport}>Volver</Button>
                      <Button onClick={handleImportConfirm} disabled={importLoading}>{importLoading ? "Importando..." : `Importar ${importData.length}`}</Button>
                    </DialogFooter>
                  </div>
                )}
                {importStep === "results" && (
                  <div className="py-4 space-y-4">
                    <div className="flex gap-2">
                      <Badge className="bg-success/15 text-success border-0">{importResults.filter((r) => r.success).length} correctos</Badge>
                      {importResults.some((r) => !r.success) && <Badge className="bg-destructive/15 text-destructive border-0">{importResults.filter((r) => !r.success).length} errores</Badge>}
                    </div>
                    <div className="overflow-x-auto max-h-60 border rounded-lg">
                      <Table>
                        <TableHeader><TableRow><TableHead>Estado</TableHead><TableHead>Email</TableHead><TableHead>Detalle</TableHead></TableRow></TableHeader>
                        <TableBody>{importResults.map((r, i) => (
                          <TableRow key={i}>
                            <TableCell>{r.success ? <CheckCircle2 className="h-4 w-4 text-success" /> : <AlertCircle className="h-4 w-4 text-destructive" />}</TableCell>
                            <TableCell>{r.email}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">{r.success ? "Creado" : r.error}</TableCell>
                          </TableRow>
                        ))}</TableBody>
                      </Table>
                    </div>
                    <DialogFooter><Button onClick={() => { setImportOpen(false); resetImport(); }}>Cerrar</Button></DialogFooter>
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </div>

          {/* Password reset dialog */}
          <Dialog open={passwordOpen} onOpenChange={setPasswordOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Cambiar contraseña</DialogTitle>
                <DialogDescription>Nueva contraseña para {passwordUserName}</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Nueva contraseña</Label>
                  <Input type="password" value={newPasswordValue} onChange={(e) => setNewPasswordValue(e.target.value)} placeholder="Mínimo 6 caracteres" />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setPasswordOpen(false)}>Cancelar</Button>
                <Button onClick={handleResetPassword} disabled={passwordLoading}>{passwordLoading ? "Guardando..." : "Cambiar contraseña"}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Delete/deactivate user dialog */}
          <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Gestionar baja de usuario</DialogTitle>
                <DialogDescription>Selecciona qué hacer con <strong>{deleteUserName}</strong>:</DialogDescription>
              </DialogHeader>
              <div className="space-y-3 py-2">
                <label className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                  <input type="radio" name="deleteMode" checked={deleteMode === "deactivate"} onChange={() => setDeleteMode("deactivate")} className="mt-1" />
                  <div>
                    <p className="font-medium text-foreground">Dar de baja (recomendado)</p>
                    <p className="text-sm text-muted-foreground">El usuario se desactiva pero sus registros de fichaje, ausencias e informes se mantienen. No aparecerá en listados activos.</p>
                  </div>
                </label>
                <label className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors border-destructive/30">
                  <input type="radio" name="deleteMode" checked={deleteMode === "delete"} onChange={() => setDeleteMode("delete")} className="mt-1" />
                  <div>
                    <p className="font-medium text-destructive">Eliminar permanentemente</p>
                    <p className="text-sm text-muted-foreground">Se elimina la cuenta y todos sus datos asociados. Esta acción no se puede deshacer.</p>
                  </div>
                </label>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDeleteOpen(false)}>Cancelar</Button>
                <Button 
                  variant={deleteMode === "delete" ? "destructive" : "default"} 
                  onClick={handleDeleteUser} 
                  disabled={deleteLoading}
                >
                  {deleteLoading ? "Procesando..." : deleteMode === "deactivate" ? "Dar de baja" : "Eliminar permanentemente"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <div className="flex items-center gap-2 mb-3">
            <Switch checked={showInactive} onCheckedChange={setShowInactive} />
            <Label className="text-sm text-muted-foreground">Mostrar usuarios dados de baja</Label>
          </div>
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                     <TableRow>
                      <TableHead>Código</TableHead>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Apellidos</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Rol</TableHead>
                      <TableHead>Departamento</TableHead>
                      <TableHead>Oficina</TableHead>
                      <TableHead>Responsable</TableHead>
                      <TableHead>Hora entrada (límite)</TableHead>
                      <TableHead>Pausa</TableHead>
                      <TableHead>Calendario</TableHead>
                      <TableHead>Convenio</TableHead>
                      <TableHead>Informes</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {profiles
                      .filter((p) => showInactive || (p as any).is_active !== false)
                      .map((p) => {
                      const isInactive = (p as any).is_active === false;
                      const currentRole = getRoleForUser(p.user_id);
                      const supervisors = profiles.filter(sp => {
                        const spRole = getRoleForUser(sp.user_id);
                        return (spRole === "supervisor" || spRole === "admin") && sp.user_id !== p.user_id;
                      });
                      return (
                      <TableRow key={p.id} className={isInactive ? "opacity-60 bg-muted/30" : ""}>
                        <TableCell>
                          <Input className="w-[80px] font-mono text-sm" defaultValue={(p as any).employee_code || ""} 
                            onBlur={(e) => handleUpdateProfileField(p.user_id, "employee_code", e.target.value)} placeholder="—" />
                        </TableCell>
                        <TableCell>
                          <Input className="w-[120px]" defaultValue={(p as any).first_name || p.name} 
                            onBlur={(e) => handleUpdateProfileField(p.user_id, "first_name", e.target.value)} />
                        </TableCell>
                        <TableCell>
                          <Input className="w-[120px]" defaultValue={(p as any).last_name || ""} 
                            onBlur={(e) => handleUpdateProfileField(p.user_id, "last_name", e.target.value)} />
                        </TableCell>
                        <TableCell>
                          {isInactive 
                            ? <Badge variant="destructive" className="text-xs">Baja</Badge>
                            : <Badge variant="outline" className="text-xs text-green-600 border-green-600">Activo</Badge>
                          }
                        </TableCell>
                        <TableCell className="text-sm">{p.email}</TableCell>
                        <TableCell>
                          <Select value={currentRole} onValueChange={(v) => handleUpdateRole(p.user_id, v as AppRole)}>
                            <SelectTrigger className="w-[130px]"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="employee">Empleado</SelectItem>
                              <SelectItem value="supervisor">Supervisor</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Select 
                            value={p.department_id || "none"} 
                            onValueChange={(v) => handleUpdateDepartment(p.user_id, v === "none" ? "" : v)}
                          >
                            <SelectTrigger className="w-[150px]"><SelectValue placeholder="Sin departamento" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Sin departamento</SelectItem>
                              {departments.map((d) => (<SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Select 
                            value={p.office_id || "none"} 
                            onValueChange={(v) => handleUpdateOffice(p.user_id, v)}
                          >
                            <SelectTrigger className="w-[150px]"><SelectValue placeholder="Sin oficina" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Sin oficina</SelectItem>
                              {offices.map((o) => (<SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Select 
                            value={p.supervisor_id || "none"} 
                            onValueChange={(v) => handleUpdateSupervisor(p.user_id, v === "none" ? "" : v)}
                          >
                            <SelectTrigger className="w-[160px]"><SelectValue placeholder="Sin responsable" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Sin responsable</SelectItem>
                              {supervisors.map((s) => (<SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Input
                            type="time"
                            className="w-[110px]"
                            defaultValue={p.expected_start_time || "08:30"}
                            onBlur={(e) => handleUpdateStartTime(p.user_id, e.target.value)}
                          />
                        </TableCell>
                        <TableCell>
                          <Select value={String(p.lunch_break_duration)} onValueChange={(v) => handleUpdateLunch(p.user_id, Number(v))}>
                            <SelectTrigger className="w-[90px]"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="30">30 min</SelectItem>
                              <SelectItem value="60">60 min</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Select 
                            value={p.holiday_calendar_id || "none"} 
                            onValueChange={(v) => handleUpdateCalendar(p.user_id, v === "none" ? "" : v)}
                          >
                            <SelectTrigger className="w-[140px]"><SelectValue placeholder="Ninguno" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Ninguno</SelectItem>
                              {calendars.map((c) => (<SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Select 
                            value={p.work_agreement_id || "none"} 
                            onValueChange={(v) => handleUpdateAgreement(p.user_id, v === "none" ? "" : v)}
                          >
                            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Ninguno" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Ninguno</SelectItem>
                              {agreements.map((a) => (<SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Switch
                            checked={p.can_view_reports ?? true}
                            onCheckedChange={(checked) => handleToggleReports(p.user_id, checked)}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {isInactive ? (
                              <Button variant="outline" size="sm" onClick={() => handleReactivateUser(p.user_id, p.name)}>
                                Reactivar
                              </Button>
                            ) : (
                              <>
                                <Button variant="ghost" size="icon" onClick={() => {
                                  setPasswordUserId(p.user_id);
                                  setPasswordUserName(p.name);
                                  setPasswordOpen(true);
                                }}>
                                  <KeyRound className="h-4 w-4 text-muted-foreground" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => {
                                  setDeleteUserId(p.user_id);
                                  setDeleteUserName(p.name);
                                  setDeleteMode("deactivate");
                                  setDeleteOpen(true);
                                }}>
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===== AGREEMENTS TAB ===== */}
        <TabsContent value="agreements" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={openNewAgreement}><Plus className="h-4 w-4 mr-2" /> Nuevo convenio</Button>
          </div>
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Convenio</TableHead>
                      <TableHead>Sector</TableHead>
                      <TableHead>Región</TableHead>
                      <TableHead>H/semana</TableHead>
                      <TableHead>H/año</TableHead>
                      <TableHead>Vacaciones</TableHead>
                      <TableHead>Viernes</TableHead>
                      <TableHead>Jornada intensiva</TableHead>
                      <TableHead className="w-[100px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {agreements.length === 0 ? (
                      <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground py-8">No hay convenios cargados.</TableCell></TableRow>
                    ) : agreements.map((a) => (
                      <TableRow key={a.id}>
                        <TableCell className="font-medium">{a.name}{a.is_template && <Badge variant="outline" className="ml-2 text-xs">Plantilla</Badge>}</TableCell>
                        <TableCell><Badge variant="secondary">{a.sector}</Badge></TableCell>
                        <TableCell className="text-sm">{a.region}</TableCell>
                        <TableCell>{a.weekly_hours}h</TableCell>
                        <TableCell>{a.annual_hours}h</TableCell>
                        <TableCell>{a.vacation_days} días</TableCell>
                        <TableCell>{a.friday_reduced_hours ? `${a.friday_reduced_hours}h` : "—"}</TableCell>
                        <TableCell>{a.summer_intensive ? `${a.summer_start_month}–${a.summer_end_month}` : "No"}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" onClick={() => openEditAgreement(a)}>
                              <Pencil className="h-4 w-4 text-muted-foreground" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => deleteAgreement.mutate(a.id)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
          <p className="text-xs text-muted-foreground">Asigna un convenio a cada empleado desde la pestaña Empleados.</p>

          {/* Agreement Create/Edit Dialog */}
          <Dialog open={agreementOpen} onOpenChange={(open) => { setAgreementOpen(open); if (!open) resetAgreementForm(); }}>
            <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingAgreement ? "Editar convenio" : "Nuevo convenio"}</DialogTitle>
                <DialogDescription>{editingAgreement ? "Modifica los datos del convenio colectivo." : "Crea un convenio personalizado con las condiciones laborales."}</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Label>Nombre *</Label>
                    <Input value={agName} onChange={e => setAgName(e.target.value)} placeholder="Ej: Convenio Construcción Madrid" />
                  </div>
                  <div>
                    <Label>Sector *</Label>
                    <Select value={agSector} onValueChange={setAgSector}>
                      <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                      <SelectContent>
                        {SECTORS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Región</Label>
                    <Select value={agRegion} onValueChange={setAgRegion}>
                      <SelectTrigger><SelectValue placeholder="Nacional" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Nacional">Nacional</SelectItem>
                        {AGREEMENT_REGIONS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>Horas/semana</Label>
                    <Input type="number" step="0.5" value={agWeeklyHours} onChange={e => setAgWeeklyHours(e.target.value)} />
                  </div>
                  <div>
                    <Label>Horas/año</Label>
                    <Input type="number" value={agAnnualHours} onChange={e => setAgAnnualHours(e.target.value)} />
                  </div>
                  <div>
                    <Label>Días vacaciones</Label>
                    <Input type="number" value={agVacationDays} onChange={e => setAgVacationDays(e.target.value)} />
                  </div>
                </div>
                <div>
                  <Label>Horas viernes reducido (opcional)</Label>
                  <Input type="number" step="0.5" value={agFridayHours} onChange={e => setAgFridayHours(e.target.value)} placeholder="Ej: 6" />
                </div>
                <div className="flex items-center gap-3">
                  <Switch checked={agSummerIntensive} onCheckedChange={setAgSummerIntensive} />
                  <Label>Jornada intensiva de verano</Label>
                </div>
                {agSummerIntensive && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Mes inicio</Label>
                      <Select value={agSummerStart} onValueChange={setAgSummerStart}>
                        <SelectTrigger><SelectValue placeholder="Mes" /></SelectTrigger>
                        <SelectContent>
                          {[6,7,8].map(m => <SelectItem key={m} value={String(m)}>{{6:"Junio",7:"Julio",8:"Agosto"}[m]}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Mes fin</Label>
                      <Select value={agSummerEnd} onValueChange={setAgSummerEnd}>
                        <SelectTrigger><SelectValue placeholder="Mes" /></SelectTrigger>
                        <SelectContent>
                          {[7,8,9].map(m => <SelectItem key={m} value={String(m)}>{{7:"Julio",8:"Agosto",9:"Septiembre"}[m]}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
                <div>
                  <Label>Notas</Label>
                  <Textarea value={agNotes} onChange={e => setAgNotes(e.target.value)} placeholder="Observaciones adicionales..." rows={2} />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setAgreementOpen(false)}>Cancelar</Button>
                <Button onClick={handleSaveAgreement}>{editingAgreement ? "Guardar cambios" : "Crear convenio"}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* ===== CALENDARS TAB ===== */}
        <TabsContent value="calendars" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={calendarOpen} onOpenChange={setCalendarOpen}>
              <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" /> Crear calendario regional</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Nuevo calendario festivo</DialogTitle>
                  <DialogDescription>Se importarán automáticamente los festivos nacionales y autonómicos de 2025.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Comunidad Autónoma</Label>
                    <Select value={calendarRegion} onValueChange={setCalendarRegion}>
                      <SelectTrigger><SelectValue placeholder="Selecciona una región" /></SelectTrigger>
                      <SelectContent>
                        {SPANISH_REGIONS.filter(r => r !== "Nacional").map((r) => (
                          <SelectItem key={r} value={r}>{r}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {calendarRegion && (
                    <div className="bg-muted rounded-lg p-3">
                      <p className="text-xs text-muted-foreground">Se importarán:</p>
                      <p className="text-sm font-medium text-foreground">{NATIONAL_HOLIDAYS_2025.length} festivos nacionales + {(REGIONAL_HOLIDAYS_2025[calendarRegion] || []).length} autonómicos</p>
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setCalendarOpen(false)}>Cancelar</Button>
                  <Button onClick={handleCreateCalendar} disabled={importingCalendar}>{importingCalendar ? "Creando..." : "Crear e importar"}</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader><TableRow><TableHead>Calendario</TableHead><TableHead>Región</TableHead><TableHead className="w-[80px]"></TableHead></TableRow></TableHeader>
                <TableBody>
                  {calendars.length === 0 ? (
                    <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-8">No hay calendarios. Crea uno para importar festivos regionales.</TableCell></TableRow>
                  ) : calendars.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.name}</TableCell>
                      <TableCell>{c.region}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => deleteCalendar.mutate(c.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===== HOLIDAYS TAB ===== */}
        <TabsContent value="holidays" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={holidayOpen} onOpenChange={setHolidayOpen}>
              <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" /> Añadir festivo</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Nuevo festivo</DialogTitle></DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2"><Label>Fecha</Label><Input type="date" value={holidayDate} onChange={(e) => setHolidayDate(e.target.value)} /></div>
                  <div className="space-y-2"><Label>Nombre</Label><Input value={holidayName} onChange={(e) => setHolidayName(e.target.value)} /></div>
                  <div className="space-y-2">
                    <Label>Calendario (opcional)</Label>
                    <Select value={holidayCalendarId} onValueChange={setHolidayCalendarId}>
                      <SelectTrigger><SelectValue placeholder="General (todos)" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">General</SelectItem>
                        {calendars.map((c) => (<SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setHolidayOpen(false)}>Cancelar</Button>
                  <Button onClick={handleAddHoliday}>Añadir</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader><TableRow><TableHead>Fecha</TableHead><TableHead>Festivo</TableHead><TableHead>Calendario</TableHead><TableHead className="w-[80px]"></TableHead></TableRow></TableHeader>
                  <TableBody>
                    {holidays.map((h) => (
                      <TableRow key={h.id}>
                        <TableCell className="font-medium">{h.date}</TableCell>
                        <TableCell>{h.name}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {(h as any).calendar_id ? calendars.find((c) => c.id === (h as any).calendar_id)?.name || "—" : "General"}
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteHoliday(h.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===== DEPARTMENTS TAB ===== */}
        <TabsContent value="departments" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={deptOpen} onOpenChange={setDeptOpen}>
              <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" /> Añadir departamento</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Nuevo departamento</DialogTitle></DialogHeader>
                <div className="space-y-4 py-4"><div className="space-y-2"><Label>Nombre</Label><Input value={deptName} onChange={(e) => setDeptName(e.target.value)} /></div></div>
                <DialogFooter><Button variant="outline" onClick={() => setDeptOpen(false)}>Cancelar</Button><Button onClick={handleAddDept}>Crear</Button></DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader><TableRow><TableHead>Departamento</TableHead></TableRow></TableHeader>
                <TableBody>{departments.map((d) => (<TableRow key={d.id}><TableCell>{d.name}</TableCell></TableRow>))}</TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===== OFFICES TAB ===== */}
        <TabsContent value="offices" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={officeOpen} onOpenChange={setOfficeOpen}>
              <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" /> Añadir oficina</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Nueva oficina</DialogTitle></DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2"><Label>Nombre</Label><Input value={officeName} onChange={(e) => setOfficeName(e.target.value)} /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2"><Label>Latitud</Label><Input type="number" step="any" value={officeLat} onChange={(e) => setOfficeLat(e.target.value)} /></div>
                    <div className="space-y-2"><Label>Longitud</Label><Input type="number" step="any" value={officeLon} onChange={(e) => setOfficeLon(e.target.value)} /></div>
                  </div>
                </div>
                <DialogFooter><Button variant="outline" onClick={() => setOfficeOpen(false)}>Cancelar</Button><Button onClick={handleAddOffice}>Crear</Button></DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader><TableRow><TableHead>Oficina</TableHead><TableHead>Coordenadas</TableHead><TableHead>Radio</TableHead></TableRow></TableHeader>
                <TableBody>{offices.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell className="font-medium">{o.name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{o.latitude}, {o.longitude}</TableCell>
                    <TableCell>{o.radius_meters}m</TableCell>
                  </TableRow>
                ))}</TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs">
          <SystemLogsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
