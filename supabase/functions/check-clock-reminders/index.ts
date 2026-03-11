import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const client = createClient(supabaseUrl, serviceRoleKey);

    const now = new Date();
    const dayOfWeek = now.getDay(); // 0=Sun, 6=Sat
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return new Response(JSON.stringify({ message: "Weekend, skipping" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const todayStr = now.toISOString().split("T")[0];
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTimeStr = `${String(currentHour).padStart(2, "0")}:${String(currentMinute).padStart(2, "0")}`;

    // Get all profiles
    const { data: profiles } = await client.from("profiles").select("user_id, name, expected_start_time, lunch_break_duration");
    if (!profiles || profiles.length === 0) {
      return new Response(JSON.stringify({ message: "No profiles" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get today's time entries
    const { data: entries } = await client.from("time_entries").select("id, user_id, check_in, check_out, status").eq("date", todayStr);
    const entryMap = new Map((entries || []).map((e: any) => [e.user_id, e]));

    let notificationsCreated = 0;
    let autoClosedEntries = 0;

    const DEADLINE_MINUTES = 8 * 60 + 30; // 08:30 — hora límite de entrada

    for (const profile of profiles) {
      const entry = entryMap.get(profile.user_id);
      const expectedStart = profile.expected_start_time || "08:30";
      const [expectedH, expectedM] = expectedStart.split(":").map(Number);
      const expectedMinutesRaw = expectedH * 60 + expectedM;
      // El recordatorio no se envía antes de las 08:30 (hora límite)
      const reminderMinutes = Math.max(expectedMinutesRaw, DEADLINE_MINUTES) + 5;

      // CHECK-IN REMINDER: if current time is past deadline and no check-in
      if (!entry || !entry.check_in) {
        const currentMinutes = currentHour * 60 + currentMinute;
        
        if (currentMinutes >= reminderMinutes && currentMinutes < reminderMinutes + 30) {
          const { data: existing } = await client.from("notifications")
            .select("id")
            .eq("user_id", profile.user_id)
            .eq("type", "clock_in_reminder")
            .gte("created_at", todayStr + "T00:00:00")
            .limit(1);

          if (!existing || existing.length === 0) {
            const deadlineTime = expectedMinutesRaw >= DEADLINE_MINUTES ? expectedStart : "08:30";
            await client.from("notifications").insert({
              user_id: profile.user_id,
              title: "⏰ Recuerda fichar entrada",
              message: `Tu hora límite de entrada es a las ${deadlineTime}. No olvides fichar.`,
              type: "clock_in_reminder",
            });
            notificationsCreated++;
          }
        }
      }

      // CHECK-OUT REMINDER & AUTO-CLOSE
      if (entry?.check_in && !entry?.check_out) {
        const [ciH, ciM] = entry.check_in.split(":").map(Number);
        const lunchDuration = profile.lunch_break_duration || 30;
        const expectedWorkedMinutes = dayOfWeek === 5 ? 360 : 510; // 6h Friday, 8.5h others
        const expectedExitMinutes = ciH * 60 + ciM + expectedWorkedMinutes + lunchDuration;
        const currentMinutes = currentHour * 60 + currentMinute;
        const reminderAtMinutes = expectedExitMinutes + 5;
        const autoCloseAtMinutes = reminderAtMinutes + 10; // 15 min after expected exit

        // Send reminder 5 min after expected exit
        if (currentMinutes >= reminderAtMinutes) {
          const { data: existing } = await client.from("notifications")
            .select("id")
            .eq("user_id", profile.user_id)
            .eq("type", "clock_out_reminder")
            .gte("created_at", todayStr + "T00:00:00")
            .limit(1);

          if (!existing || existing.length === 0) {
            const exitH = Math.floor(expectedExitMinutes / 60);
            const exitM = expectedExitMinutes % 60;
            const exitTime = `${String(exitH).padStart(2, "0")}:${String(exitM).padStart(2, "0")}`;
            await client.from("notifications").insert({
              user_id: profile.user_id,
              title: "🏁 Recuerda fichar salida",
              message: `Ya has cumplido tu jornada (salida estimada: ${exitTime}). Recuerda fichar la salida.`,
              type: "clock_out_reminder",
            });
            notificationsCreated++;
          }
        }

        // Auto-close 15 min after expected exit (10 min after notification)
        if (currentMinutes >= autoCloseAtMinutes) {
          const exitH = Math.floor(expectedExitMinutes / 60);
          const exitM = expectedExitMinutes % 60;
          const exitTime = `${String(exitH).padStart(2, "0")}:${String(exitM).padStart(2, "0")}`;
          
          // Calculate total worked minutes (excluding lunch)
          const totalWorked = expectedExitMinutes - (ciH * 60 + ciM) - lunchDuration;

          await client.from("time_entries").update({
            check_out: exitTime,
            status: "checked_out",
            total_worked_minutes: totalWorked,
          }).eq("id", entry.id);

          // Notify user of auto-close
          await client.from("notifications").insert({
            user_id: profile.user_id,
            title: "🔒 Fichaje cerrado automáticamente",
            message: `Tu fichaje se ha cerrado automáticamente a las ${exitTime} (hora estimada de salida).`,
            type: "auto_close",
          });
          autoClosedEntries++;
        }
      }
    }

    return new Response(JSON.stringify({ message: `Created ${notificationsCreated} notifications, auto-closed ${autoClosedEntries} entries` }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
