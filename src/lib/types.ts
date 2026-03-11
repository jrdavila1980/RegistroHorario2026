// Helper functions for time calculations
// Types now come from @/integrations/supabase/types

export function formatTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m.toString().padStart(2, "0")}m`;
}

export function nowTime(): string {
  const now = new Date();
  return `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
}

export function minutesBetween(start: string, end: string): number {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  return (eh * 60 + em) - (sh * 60 + sm);
}

export function getExpectedHours(dayOfWeek: number): number {
  if (dayOfWeek === 0 || dayOfWeek === 6) return 0;
  if (dayOfWeek === 5) return 6 * 60;
  return 8.5 * 60;
}

export function normalizeTime(t: string): string {
  // DB returns HH:MM:SS, normalize to HH:MM
  const parts = t.split(":");
  return `${parts[0].padStart(2, "0")}:${parts[1].padStart(2, "0")}`;
}

export function calculateEstimatedExit(checkIn: string, lunchDuration: number, dayOfWeek: number): string {
  const expectedMinutes = getExpectedHours(dayOfWeek);
  const [h, m] = checkIn.split(":").map(Number);
  let totalMin = h * 60 + m + expectedMinutes + lunchDuration;
  if (totalMin >= 1440) totalMin -= 1440; // wrap past midnight
  const exitH = Math.floor(totalMin / 60);
  const exitM = totalMin % 60;
  return `${exitH.toString().padStart(2, "0")}:${exitM.toString().padStart(2, "0")}`;
}

export function calculateWorkedMinutes(entry: { check_in: string | null; lunch_start: string | null; lunch_end: string | null; check_out: string | null }): number {
  if (!entry.check_in) return 0;
  const end = entry.check_out || nowTime();
  let total = minutesBetween(entry.check_in, end);
  if (entry.lunch_start && entry.lunch_end) {
    total -= minutesBetween(entry.lunch_start, entry.lunch_end);
  } else if (entry.lunch_start && !entry.lunch_end) {
    total -= minutesBetween(entry.lunch_start, nowTime());
  }
  return Math.max(0, total);
}
