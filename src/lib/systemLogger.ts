import { supabase } from "@/integrations/supabase/client";

type LogEventType = "error" | "login_failure" | "gps_failure" | "geo_block" | "auth_error";

export async function logSystemEvent(
  eventType: LogEventType,
  message: string,
  metadata: Record<string, any> = {},
  userId?: string
) {
  try {
    await supabase.from("system_logs" as any).insert({
      user_id: userId || null,
      event_type: eventType,
      message,
      metadata,
      user_agent: navigator.userAgent,
    });
  } catch {
    // Silent fail — don't break the app for logging
    console.error("[SystemLog] Failed to log:", eventType, message);
  }
}
