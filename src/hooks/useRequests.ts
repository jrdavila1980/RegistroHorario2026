import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";
import type { Tables, Enums } from "@/integrations/supabase/types";

export type AbsenceRequest = Tables<"absence_requests">;
export type RequestType = Enums<"request_type">;
export type RequestStatus = Enums<"request_status">;

export function useMyRequests() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["my_requests", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("absence_requests")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useAllRequests() {
  return useQuery({
    queryKey: ["all_requests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("absence_requests")
        .select("*, profiles!absence_requests_user_id_fkey(name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateRequest() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (req: { type: RequestType; start_date: string; end_date: string; hours?: number; reason?: string; overtime_start_time?: string; overtime_end_time?: string }) => {
      if (!user) throw new Error("No autenticado");
      const { error } = await supabase.from("absence_requests").insert({
        user_id: user.id,
        ...req,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my_requests"] });
      qc.invalidateQueries({ queryKey: ["all_requests"] });
      toast.success("Solicitud enviada");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useUpdateRequestStatus() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: RequestStatus }) => {
      if (!user) throw new Error("No autenticado");
      const { error } = await supabase
        .from("absence_requests")
        .update({ status, approved_by: user.id })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["all_requests"] });
      qc.invalidateQueries({ queryKey: ["my_requests"] });
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useEditRequest() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (req: { id: string; type: RequestType; start_date: string; end_date: string; hours?: number; reason?: string; overtime_start_time?: string; overtime_end_time?: string }) => {
      if (!user) throw new Error("No autenticado");
      const { id, ...updates } = req;
      const { error } = await supabase
        .from("absence_requests")
        .update({ ...updates, status: "pending" as RequestStatus, approved_by: null })
        .eq("id", id)
        .eq("user_id", user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my_requests"] });
      qc.invalidateQueries({ queryKey: ["all_requests"] });
      toast.success("Solicitud actualizada (pendiente de aprobación)");
    },
    onError: (err: Error) => toast.error(err.message),
  });
}

export function useHolidays() {
  return useQuery({
    queryKey: ["holidays"],
    queryFn: async () => {
      const { data, error } = await supabase.from("holidays").select("*").order("date");
      if (error) throw error;
      return data;
    },
  });
}
