import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useMyRequests, useHolidays } from "@/hooks/useRequests";

export default function CalendarPage() {
  const { data: requests = [] } = useMyRequests();
  const { data: holidays = [] } = useHolidays();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  const approvedRequests = requests.filter((r) => r.status === "approved");
  const selectedDateStr = selectedDate?.toISOString().split("T")[0];

  const eventsOnDate = [
    ...approvedRequests
      .filter((r) => selectedDateStr && r.start_date <= selectedDateStr && r.end_date >= selectedDateStr)
      .map((r) => ({
        type: r.type,
        label: r.type === "vacation" ? "Vacaciones" : r.type === "sick_leave" ? "Baja enfermedad" : r.type === "absence" ? "Ausencia" : r.type === "personal_day" ? "Día libre" : "Horas extra",
      })),
    ...holidays
      .filter((h) => h.date === selectedDateStr)
      .map((h) => ({ type: "holiday" as const, label: h.name })),
  ];

  const holidayDates = holidays.map((h) => new Date(h.date + "T00:00:00"));
  const vacationDates: Date[] = [];
  const sickDates: Date[] = [];
  const absenceDates: Date[] = [];
  const personalDayDates: Date[] = [];

  approvedRequests.forEach((r) => {
    const start = new Date(r.start_date + "T00:00:00");
    const end = new Date(r.end_date + "T00:00:00");
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateCopy = new Date(d);
      if (r.type === "vacation") vacationDates.push(dateCopy);
      else if (r.type === "sick_leave") sickDates.push(dateCopy);
      else if (r.type === "absence") absenceDates.push(dateCopy);
      else if (r.type === "personal_day") personalDayDates.push(dateCopy);
    }
  });

  const redStyle = { backgroundColor: "hsl(0 72% 51% / 0.2)", color: "hsl(0 72% 51%)", fontWeight: 600 };
  const warningStyle = { backgroundColor: "hsl(38 92% 50% / 0.15)" };

  const typeColors: Record<string, string> = {
    vacation: "bg-destructive/15 text-destructive",
    sick_leave: "bg-destructive/15 text-destructive",
    absence: "bg-warning/15 text-warning",
    overtime: "bg-success/15 text-success",
    holiday: "bg-destructive/15 text-destructive",
    personal_day: "bg-destructive/15 text-destructive",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Calendario</h1>
        <p className="text-muted-foreground mt-1">Visualiza tus ausencias, vacaciones y festivos</p>
      </div>
      <div className="grid gap-6 md:grid-cols-[1fr_320px]">
        <Card>
          <CardContent className="p-4">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              className="pointer-events-auto w-full"
              modifiers={{
                holiday: holidayDates,
                vacation: vacationDates,
                sick: sickDates,
                absence: absenceDates,
                personalDay: personalDayDates,
              }}
              modifiersStyles={{
                holiday: redStyle,
                vacation: redStyle,
                sick: redStyle,
                absence: warningStyle,
                personalDay: redStyle,
              }}
            />
          </CardContent>
        </Card>
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">
                {selectedDate?.toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {eventsOnDate.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sin eventos este día</p>
              ) : (
                <div className="space-y-2">
                  {eventsOnDate.map((ev, i) => (
                    <Badge key={i} className={cn("border-0", typeColors[ev.type])}>{ev.label}</Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Leyenda</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center gap-2"><div className="h-3 w-3 rounded-sm bg-destructive/30" /><span className="text-sm text-foreground">Vacaciones / Festivo / Día libre</span></div>
              <div className="flex items-center gap-2"><div className="h-3 w-3 rounded-sm bg-warning/30" /><span className="text-sm text-foreground">Ausencia</span></div>
              <div className="flex items-center gap-2"><div className="h-3 w-3 rounded-sm bg-success/30" /><span className="text-sm text-foreground">Horas extra</span></div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
