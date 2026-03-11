import { Button } from "@/components/ui/button";
import { Printer, Shield, Clock, MapPin, FileText, Users, BarChart3, Bell, Globe, Database, Lock, CheckCircle2 } from "lucide-react";

const Section = ({ icon: Icon, title, children }: { icon: any; title: string; children: React.ReactNode }) => (
  <div className="mb-8 break-inside-avoid">
    <div className="flex items-center gap-3 mb-3">
      <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center print:bg-blue-50">
        <Icon className="h-5 w-5 text-primary print:text-blue-600" />
      </div>
      <h2 className="text-xl font-bold text-foreground print:text-gray-900">{title}</h2>
    </div>
    <div className="pl-[52px] text-sm text-muted-foreground leading-relaxed print:text-gray-600">{children}</div>
  </div>
);

const BulletList = ({ items }: { items: string[] }) => (
  <ul className="space-y-1.5 mt-2">
    {items.map((item, i) => (
      <li key={i} className="flex items-start gap-2">
        <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0 print:text-blue-600" />
        <span>{item}</span>
      </li>
    ))}
  </ul>
);

export default function SystemOverviewPage() {
  return (
    <div className="max-w-4xl mx-auto py-8 px-6 print:px-0 print:py-0">
      {/* Print button - hidden on print */}
      <div className="flex justify-end mb-6 print:hidden">
        <Button onClick={() => window.print()} variant="outline" className="gap-2">
          <Printer className="h-4 w-4" /> Imprimir / Guardar PDF
        </Button>
      </div>

      {/* Header */}
      <div className="text-center mb-10 pb-8 border-b border-border print:border-gray-200">
        <div className="text-4xl mb-2">⏱</div>
        <h1 className="text-3xl font-bold text-foreground print:text-gray-900 mb-2">
          Sistema de Registro Horario
        </h1>
        <p className="text-lg text-muted-foreground print:text-gray-500 mb-1">
          Plataforma de control de jornada laboral
        </p>
        <p className="text-sm text-muted-foreground print:text-gray-400">
          Cumplimiento del Real Decreto-ley 8/2019 · Documento generado el {new Date().toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })}
        </p>
      </div>

      {/* Sections */}
      <Section icon={Clock} title="Control de fichajes">
        <p>Sistema de fichaje digital con registro de entrada, pausa para comida y salida. Cada empleado ficha desde su dispositivo con validación en tiempo real.</p>
        <BulletList items={[
          "Registro de entrada y salida con hora exacta",
          "Control automático de pausa para comida (configurable por empleado)",
          "Cálculo automático de horas trabajadas",
          "Prevención de fichajes duplicados",
          "Estimación de hora de salida según convenio",
        ]} />
      </Section>

      <Section icon={MapPin} title="Geolocalización y anti-fraude">
        <p>Cada fichaje registra la ubicación del empleado para garantizar que se realiza desde un lugar autorizado.</p>
        <BulletList items={[
          "Captura de latitud, longitud y precisión GPS en cada fichaje",
          "Validación de geofence: solo permite fichar dentro del radio de la oficina (150m configurable)",
          "Registro de IP y dispositivo (user agent) en cada acción",
          "Detección de precisión GPS sospechosa (>100m)",
          "Logs de presencia inmutables para auditoría",
        ]} />
      </Section>

      <Section icon={Users} title="Gestión de empleados y roles">
        <p>Administración completa de empleados con sistema de roles jerárquico.</p>
        <BulletList items={[
          "Tres roles: Empleado, Supervisor y Administrador",
          "Creación de empleados individual o por importación CSV masiva",
          "Asignación de departamento, oficina, convenio y calendario festivo por empleado",
          "Asignación de supervisor responsable para cada empleado",
          "Configuración individual de hora de entrada esperada y pausa de comida",
          "Exportación de listado de empleados en CSV",
        ]} />
      </Section>

      <Section icon={Shield} title="Supervisión en tiempo real">
        <p>Panel de supervisión con visión completa del cumplimiento horario del equipo.</p>
        <BulletList items={[
          "Detección de llegadas tarde (después de la hora configurada)",
          "Control de horas insuficientes (empleados que no completan su jornada)",
          "Listado de empleados que no han fichado",
          "Ubicación de fichajes por oficina con estado de geofence",
          "Filtros por fecha, departamento y búsqueda por empleado",
          "Supervisores limitados a sus empleados asignados",
        ]} />
      </Section>

      <Section icon={FileText} title="Solicitudes de ausencia">
        <p>Gestión digital de vacaciones, ausencias, permisos y horas extra.</p>
        <BulletList items={[
          "Tipos: vacaciones, ausencia, baja médica, día personal, horas extra",
          "Flujo de aprobación: pendiente → aprobada/rechazada",
          "Los empleados crean solicitudes, los supervisores las aprueban",
          "Historial completo de solicitudes con estado",
        ]} />
      </Section>

      <Section icon={BarChart3} title="Informes y reportes">
        <p>Generación de informes mensuales de jornada con firma digital.</p>
        <BulletList items={[
          "Informe mensual con detalle diario de horas trabajadas",
          "Firma digital del empleado para validar el informe",
          "Cálculo de total de horas mensuales vs. esperadas",
          "Acceso configurable a informes por empleado",
          "Exportación para presentación ante la Inspección de Trabajo",
        ]} />
      </Section>

      <Section icon={Globe} title="Convenios colectivos y calendarios">
        <p>Configuración de convenios colectivos y calendarios festivos por comunidad autónoma.</p>
        <BulletList items={[
          "Convenios con horas semanales, anuales y días de vacaciones",
          "Soporte para jornada reducida los viernes",
          "Jornada intensiva de verano configurable",
          "Calendarios festivos por comunidad autónoma (nacionales + regionales)",
          "Asignación de convenio y calendario por empleado",
        ]} />
      </Section>

      <Section icon={Database} title="Auditoría completa">
        <p>Registro inmutable de todos los cambios para cumplimiento normativo.</p>
        <BulletList items={[
          "Registro automático de toda modificación en fichajes (trigger de base de datos)",
          "Datos almacenados: usuario, acción, fecha, valor anterior, valor nuevo",
          "Logs del sistema: fallos de login, bloqueos geográficos, errores GPS",
          "Exportación de logs en CSV para inspecciones laborales",
          "Solo accesible por administradores",
        ]} />
      </Section>

      <Section icon={Lock} title="Seguridad">
        <p>Múltiples capas de seguridad para proteger los datos de la organización.</p>
        <BulletList items={[
          "Registro de usuarios deshabilitado: solo el administrador crea empleados",
          "Restricción geográfica: acceso limitado a territorio español",
          "Autenticación por email y contraseña con tokens JWT",
          "Políticas de seguridad a nivel de base de datos (RLS) en todas las tablas",
          "Supervisores solo acceden a datos de sus empleados asignados",
          "Índices optimizados para rendimiento con millones de registros",
        ]} />
      </Section>

      <Section icon={Bell} title="Notificaciones">
        <p>Sistema de notificaciones integrado para mantener informados a los empleados.</p>
        <BulletList items={[
          "Recordatorios de fichaje",
          "Notificaciones de estado de solicitudes",
          "Centro de notificaciones con marcado de lectura",
        ]} />
      </Section>

      {/* Footer */}
      <div className="mt-12 pt-6 border-t border-border print:border-gray-200 text-center">
        <p className="text-xs text-muted-foreground print:text-gray-400">
          Este documento ha sido generado automáticamente por el sistema de Registro Horario.
          <br />
          Cumple con los requisitos del Real Decreto-ley 8/2019, de 8 de marzo, de medidas urgentes de protección social y de lucha contra la precariedad laboral en la jornada de trabajo.
        </p>
      </div>
    </div>
  );
}
