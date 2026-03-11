import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type WorkAgreement = {
  id: string;
  name: string;
  sector: string;
  region: string;
  weekly_hours: number;
  annual_hours: number;
  vacation_days: number;
  friday_reduced_hours: number | null;
  summer_intensive: boolean;
  summer_start_month: number | null;
  summer_end_month: number | null;
  notes: string | null;
  is_template: boolean;
  created_at: string;
};

export function useWorkAgreements() {
  return useQuery({
    queryKey: ["work_agreements"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("work_agreements")
        .select("*")
        .order("sector")
        .order("region");
      if (error) throw error;
      return data as WorkAgreement[];
    },
  });
}

export function useCreateWorkAgreement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (agreement: Omit<WorkAgreement, "id" | "created_at">) => {
      const { data, error } = await supabase
        .from("work_agreements")
        .insert(agreement)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["work_agreements"] }),
  });
}

export function useUpdateWorkAgreement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<WorkAgreement> & { id: string }) => {
      const { data, error } = await supabase
        .from("work_agreements")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["work_agreements"] }),
  });
}

export function useDeleteWorkAgreement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("work_agreements").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["work_agreements"] }),
  });
}

export const SECTORS = [
  "Construcción",
  "Metal",
  "Oficinas",
  "Hostelería",
  "Comercio",
  "Tecnología",
  "Transporte",
  "Limpieza",
  "Sanidad",
  "Educación",
];
