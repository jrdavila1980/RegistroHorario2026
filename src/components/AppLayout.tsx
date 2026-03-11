import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useProfile, useUserRole } from "@/hooks/useProfile";
import {
  Clock, CalendarDays, FileText, Users, Settings, BarChart3,
  CheckSquare, Menu, X, ChevronDown, LogOut, Eye
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import NotificationBell from "./NotificationBell";

const getNavItems = (role: string, canViewReports: boolean) => {
  const base = [
    { to: "/", label: "Fichar", icon: Clock },
    { to: "/calendar", label: "Calendario", icon: CalendarDays },
    { to: "/requests", label: "Solicitudes", icon: FileText },
  ];
  if (canViewReports) {
    // Reports will be added at the end or before admin
  }
  const supervisorItems = [
    { to: "/approvals", label: "Aprobaciones", icon: CheckSquare },
    { to: "/supervision", label: "Supervisión", icon: Eye },
  ];
  const adminItems = [
    { to: "/admin", label: "Administración", icon: Settings },
  ];
  const reportsItem = { to: "/reports", label: "Informes", icon: BarChart3 };

  let items = [...base];
  if (role === "supervisor" || role === "admin") {
    items.push(...supervisorItems);
  }
  if (canViewReports || role === "admin") {
    items.push(reportsItem);
  }
  if (role === "admin") {
    items.push(...adminItems);
  }
  return items;
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { signOut } = useAuth();
  const { data: profile } = useProfile();
  const { data: role } = useUserRole();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const currentRole = role || "employee";
  const canViewReports = (profile as any)?.can_view_reports ?? true;
  const items = getNavItems(currentRole, canViewReports);
  const userName = profile?.name || "Usuario";

  const roleLabels = { employee: "Empleado", supervisor: "Supervisor", admin: "Admin" };

  return (
    <div className="flex min-h-screen">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex w-64 flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
        <div className="p-6">
          <h1 className="text-lg font-bold text-sidebar-primary-foreground tracking-tight">
            ⏱ Registro Horario
          </h1>
          <p className="text-xs text-sidebar-foreground/60 mt-1">Control horario</p>
        </div>
        <nav className="flex-1 px-3 space-y-1">
          {items.map((item) => {
            const Icon = item.icon;
            const active = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-sidebar-border">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="h-8 w-8 rounded-full bg-sidebar-primary flex items-center justify-center text-sidebar-primary-foreground text-xs font-bold">
              {userName.charAt(0)}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-sidebar-foreground">{userName}</p>
              <p className="text-xs text-sidebar-foreground/50">{roleLabels[currentRole]}</p>
            </div>
            <NotificationBell />
            <button onClick={signOut} className="text-sidebar-foreground/50 hover:text-sidebar-foreground">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-card border-b border-border px-4 h-14 flex items-center justify-between">
        <h1 className="text-base font-bold text-foreground">⏱ Registro Horario</h1>
        <div className="flex items-center gap-1">
          <NotificationBell />
          <Button variant="ghost" size="icon" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-30 bg-background/80 backdrop-blur-sm" onClick={() => setMobileOpen(false)}>
          <div className="absolute top-14 left-0 right-0 bg-card border-b border-border p-4 space-y-1" onClick={(e) => e.stopPropagation()}>
            {items.map((item) => {
              const Icon = item.icon;
              const active = location.pathname === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                    active ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:bg-accent"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
            <div className="pt-3 border-t border-border mt-3">
              <button onClick={signOut} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-destructive hover:bg-accent">
                <LogOut className="h-4 w-4" /> Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="flex-1 md:overflow-y-auto">
        <div className="pt-14 md:pt-0 p-4 md:p-8 max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
