import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useOffices } from "./useProfile";
import { getCurrentPosition, isWithinGeofence, isSuspiciousAccuracy } from "@/lib/geolocation";
import { toast } from "sonner";
import { nowTime, calculateWorkedMinutes as calcWorked } from "@/lib/types";
import type { Tables } from "@/integrations/supabase/types";
import { logSystemEvent } from "@/lib/systemLogger";

export type TimeEntry = Tables<"time_entries">;

const today = () => new Date().toISOString().split("T")[0];

async function hasRemotePermission(userId: string): Promise<boolean> {
  const { data } = await supabase
    .from("remote_clock_permissions" as any)
    .select("id")
    .eq("user_id", userId)
    .eq("permission_date", today())
    .maybeSingle();
  return !!data;
}

export function useTodayEntry() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["today_entry", user?.id, today()],
    enabled: !!user,
    refetchInterval: 30000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("time_entries")
        .select("*")
        .eq("user_id", user!.id)
        .eq("date", today())
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useTimeEntries(userId?: string, from?: string, to?: string) {
  return useQuery({
    queryKey: ["time_entries", userId, from, to],
    enabled: !!userId && !!from && !!to,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("time_entries")
        .select("*")
        .eq("user_id", userId!)
        .gte("date", from!)
        .lte("date", to!)
        .order("date", { ascending: true });
      if (error) throw error;
      return data as TimeEntry[];
    },
  });
}

async function getGeoAndValidate(offices: any[], userId?: string) {
  // Check if user has remote permission for today
  if (userId) {
    const hasPermission = await hasRemotePermission(userId);
    if (hasPermission) {
      toast.info("Fichaje remoto autorizado para hoy");
      try {
        const pos = await getCurrentPosition();
        return { ...pos, isWithinGeofence: false };
      } catch {
        return { latitude: null, longitude: null, accuracy: null, isWithinGeofence: false };
      }
    }
  }

  try {
    const pos = await getCurrentPosition();
    if (isSuspiciousAccuracy(pos.accuracy)) {
      toast.warning(`Precisión GPS baja: ${Math.round(pos.accuracy)}m`);
    }
    const withinFence = offices.some((o) =>
      isWithinGeofence(pos, o.latitude, o.longitude, o.radius_meters)
    );
    return { ...pos, isWithinGeofence: withinFence };
  } catch (err: any) {
    await logSystemEvent("gps_failure", err.message, { offices: offices.map((o: any) => o.name) });
    throw new Error("No se pudo verificar tu ubicación. Activa el GPS o solicita un permiso de fichaje remoto a tu supervisor.");
  }
}

async function logPresence(
  userId: string,
  timeEntryId: string,
  eventType: string,
  geo: any
) {
  await supabase.from("presence_logs").insert({
    user_id: userId,
    time_entry_id: timeEntryId,
    event_type: eventType,
    latitude: geo.latitude,
    longitude: geo.longitude,
    gps_accuracy: geo.accuracy,
    is_within_geofence: geo.isWithinGeofence,
    user_agent: navigator.userAgent,
  });
}

export function useClockIn() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data: offices } = useOffices();

  return useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("No autenticado");
      // Anti-fraud: check duplicate
      const { data: existing } = await supabase
        .from("time_entries")
        .select("id, check_in")
        .eq("user_id", user.id)
        .eq("date", today())
        .maybeSingle();
      if (existing?.check_in) throw new Error("Ya has fichado entrada hoy.");

      const geo = await getGeoAndValidate(offices || [], user.id);
      const time = nowTime();

      let entryId: string;
      if (existing) {
        const { error } = await supabase
          .from("time_entries")
          .update({ check_in: time, status: "checked_in" as any })
          .eq("id", existing.id);
        if (error) throw error;
        entryId = existing.id;
      } else {
        const { data, error } = await supabase
          .from("time_entries")
          .insert({ user_id: user.id, date: today(), check_in: time, status: "checked_in" as any })
          .select("id")
          .single();
        if (error) throw error;
        entryId = data.id;
      }
      await logPresence(user.id, entryId, "check_in", geo);

      // If outside geofence, notify supervisor
      if (geo.isWithinGeofence === false) {
        await supabase.rpc("notify_supervisor_unknown_location", {
          _user_id: user.id,
          _event_type: "entrada",
        });
        return { outsideGeofence: true };
      }
      return { outsideGeofence: false };
    },
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: ["today_entry"] });
      if (result?.outsideGeofence) {
        toast.warning(
          "⚠️ Fichaje registrado desde ubicación desconocida. Este fichaje NO es válido al no registrarse en un centro de trabajo. Contacte con RRHH.",
          { duration: 10000 }
        );
      } else {
        toast.success("Entrada fichada correctamente");
      }
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useStartLunch() {
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("No autenticado");
      const { data: entry } = await supabase
        .from("time_entries")
        .select("id")
        .eq("user_id", user.id)
        .eq("date", today())
        .single();
      if (!entry) throw new Error("No hay entrada registrada");
      const { error } = await supabase
        .from("time_entries")
        .update({ lunch_start: nowTime(), status: "lunch_started" as any })
        .eq("id", entry.id);
      if (error) throw error;
      await logPresence(user.id, entry.id, "lunch_start", { latitude: null, longitude: null, accuracy: null, isWithinGeofence: null });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["today_entry"] });
      toast.success("Pausa comida iniciada");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useEndLunch() {
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("No autenticado");
      const { data: entry } = await supabase
        .from("time_entries")
        .select("id")
        .eq("user_id", user.id)
        .eq("date", today())
        .single();
      if (!entry) throw new Error("No hay entrada registrada");
      const { error } = await supabase
        .from("time_entries")
        .update({ lunch_end: nowTime(), status: "lunch_ended" as any })
        .eq("id", entry.id);
      if (error) throw error;
      await logPresence(user.id, entry.id, "lunch_end", { latitude: null, longitude: null, accuracy: null, isWithinGeofence: null });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["today_entry"] });
      toast.success("Pausa comida finalizada");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useClockOut() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data: offices } = useOffices();

  return useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("No autenticado");
      const { data: entry } = await supabase
        .from("time_entries")
        .select("*")
        .eq("user_id", user.id)
        .eq("date", today())
        .single();
      if (!entry) throw new Error("No hay entrada registrada");
      if (entry.check_out) throw new Error("Ya has fichado salida hoy.");

      const geo = await getGeoAndValidate(offices || [], user.id);
      const time = nowTime();
      const workedMinutes = calcWorked({
        check_in: entry.check_in,
        lunch_start: entry.lunch_start,
        lunch_end: entry.lunch_end,
        check_out: time,
      } as any);

      const { error } = await supabase
        .from("time_entries")
        .update({
          check_out: time,
          status: "checked_out" as any,
          total_worked_minutes: workedMinutes,
        })
        .eq("id", entry.id);
      if (error) throw error;
      await logPresence(user.id, entry.id, "check_out", geo);

      if (geo.isWithinGeofence === false) {
        await supabase.rpc("notify_supervisor_unknown_location", {
          _user_id: user.id,
          _event_type: "salida",
        });
        return { outsideGeofence: true };
      }
      return { outsideGeofence: false };
    },
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: ["today_entry"] });
      if (result?.outsideGeofence) {
        toast.warning(
          "⚠️ Fichaje de salida registrado desde ubicación desconocida. Este fichaje NO es válido. Contacte con RRHH.",
          { duration: 10000 }
        );
      } else {
        toast.success("Salida fichada correctamente");
      }
    },
    onError: (err: Error) => toast.error(err.message),
  });
}
