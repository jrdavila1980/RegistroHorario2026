import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useHolidayCalendars() {
  return useQuery({
    queryKey: ["holiday_calendars"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("holiday_calendars")
        .select("*")
        .order("name");
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateCalendar() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ name, region }: { name: string; region: string }) => {
      const { data, error } = await supabase
        .from("holiday_calendars")
        .insert({ name, region })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["holiday_calendars"] }),
  });
}

export function useDeleteCalendar() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("holiday_calendars").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["holiday_calendars"] });
      qc.invalidateQueries({ queryKey: ["holidays"] });
    },
  });
}

// Spanish official holidays by comunidad autónoma for 2025
export const SPANISH_REGIONS = [
  "Nacional",
  "Andalucía", "Aragón", "Asturias", "Baleares", "Canarias",
  "Cantabria", "Castilla y León", "Castilla-La Mancha", "Cataluña",
  "Comunidad Valenciana", "Extremadura", "Galicia", "Madrid",
  "Murcia", "Navarra", "País Vasco", "La Rioja", "Ceuta", "Melilla",
];

export const NATIONAL_HOLIDAYS_2025 = [
  { date: "2025-01-01", name: "Año Nuevo" },
  { date: "2025-01-06", name: "Epifanía del Señor" },
  { date: "2025-04-18", name: "Viernes Santo" },
  { date: "2025-05-01", name: "Fiesta del Trabajo" },
  { date: "2025-08-15", name: "Asunción de la Virgen" },
  { date: "2025-10-12", name: "Fiesta Nacional de España" },
  { date: "2025-11-01", name: "Todos los Santos" },
  { date: "2025-12-06", name: "Día de la Constitución" },
  { date: "2025-12-08", name: "Inmaculada Concepción" },
  { date: "2025-12-25", name: "Navidad" },
];

export const REGIONAL_HOLIDAYS_2025: Record<string, Array<{ date: string; name: string }>> = {
  "Andalucía": [
    { date: "2025-02-28", name: "Día de Andalucía" },
  ],
  "Aragón": [
    { date: "2025-04-23", name: "Día de Aragón" },
  ],
  "Asturias": [
    { date: "2025-09-08", name: "Día de Asturias" },
  ],
  "Baleares": [
    { date: "2025-03-01", name: "Día de las Islas Baleares" },
  ],
  "Canarias": [
    { date: "2025-05-30", name: "Día de Canarias" },
  ],
  "Cantabria": [
    { date: "2025-07-28", name: "Día de las Instituciones de Cantabria" },
  ],
  "Castilla y León": [
    { date: "2025-04-23", name: "Día de Castilla y León" },
  ],
  "Castilla-La Mancha": [
    { date: "2025-05-31", name: "Día de Castilla-La Mancha" },
  ],
  "Cataluña": [
    { date: "2025-06-24", name: "Sant Joan" },
    { date: "2025-09-11", name: "Diada Nacional de Cataluña" },
  ],
  "Comunidad Valenciana": [
    { date: "2025-03-19", name: "San José" },
    { date: "2025-10-09", name: "Día de la Comunidad Valenciana" },
  ],
  "Extremadura": [
    { date: "2025-09-08", name: "Día de Extremadura" },
  ],
  "Galicia": [
    { date: "2025-07-25", name: "Día Nacional de Galicia" },
  ],
  "Madrid": [
    { date: "2025-05-02", name: "Fiesta de la Comunidad de Madrid" },
  ],
  "Murcia": [
    { date: "2025-06-09", name: "Día de la Región de Murcia" },
  ],
  "Navarra": [
    { date: "2025-12-03", name: "Día de Navarra" },
  ],
  "País Vasco": [
    { date: "2025-10-25", name: "Día del País Vasco" },
  ],
  "La Rioja": [
    { date: "2025-06-09", name: "Día de La Rioja" },
  ],
  "Ceuta": [
    { date: "2025-09-02", name: "Día de Ceuta" },
  ],
  "Melilla": [
    { date: "2025-09-17", name: "Día de Melilla" },
  ],
};
