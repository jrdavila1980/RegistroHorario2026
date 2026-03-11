import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function verifyAdmin(req: Request) {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

  const authHeader = req.headers.get("Authorization") ?? req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) throw new Error("No autenticado");

  const userResponse = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: {
      Authorization: authHeader,
      apikey: anonKey,
    },
  });

  if (!userResponse.ok) {
    const authError = await userResponse.text();
    console.error("admin-create-user auth failed", authError);
    throw new Error("No autenticado");
  }

  const caller = await userResponse.json();
  const callerId = caller?.id as string | undefined;
  if (!callerId) throw new Error("No autenticado");

  const adminClient = createClient(supabaseUrl, serviceRoleKey);
  const { data: roles } = await adminClient.from("user_roles").select("role").eq("user_id", callerId);
  const isAdmin = roles?.some((r: any) => r.role === "admin");
  if (!isAdmin) throw new Error("No autorizado");

  return { adminClient, callerId };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { adminClient } = await verifyAdmin(req);
    const body = await req.json();
    const { action } = body;

    // === RESET PASSWORD ===
    if (action === "reset_password") {
      const { user_id, new_password } = body;
      if (!user_id || !new_password) {
        return new Response(JSON.stringify({ error: "user_id y new_password son obligatorios" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (new_password.length < 6) {
        return new Response(JSON.stringify({ error: "La contraseña debe tener al menos 6 caracteres" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const { error } = await adminClient.auth.admin.updateUser(user_id, { password: new_password });
      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // === DEACTIVATE USER (soft delete / baja) ===
    if (action === "deactivate_user") {
      const { user_id } = body;
      if (!user_id) {
        return new Response(JSON.stringify({ error: "user_id es obligatorio" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const { error } = await adminClient.from("profiles").update({ is_active: false }).eq("user_id", user_id);
      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // === REACTIVATE USER ===
    if (action === "reactivate_user") {
      const { user_id } = body;
      if (!user_id) {
        return new Response(JSON.stringify({ error: "user_id es obligatorio" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const { error } = await adminClient.from("profiles").update({ is_active: true }).eq("user_id", user_id);
      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // === DELETE USER (permanent) ===
    if (action === "delete_user") {
      const { user_id } = body;
      if (!user_id) {
        return new Response(JSON.stringify({ error: "user_id es obligatorio" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const { error } = await adminClient.auth.admin.deleteUser(user_id);
      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // === CREATE USERS (default action) ===
    const { users } = body as { users: Array<{ email: string; name: string; first_name?: string; last_name?: string; employee_code?: string; password?: string; role?: string; department_id?: string; office_id?: string; lunch_break_duration?: number }> };

    if (!users || !Array.isArray(users) || users.length === 0) {
      return new Response(JSON.stringify({ error: "Se requiere un array de usuarios" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const results: Array<{ email: string; success: boolean; error?: string }> = [];

    for (const u of users) {
      try {
        if (!u.email || !u.name) {
          results.push({ email: u.email || "desconocido", success: false, error: "Email y nombre obligatorios" });
          continue;
        }
        const password = u.password || Math.random().toString(36).slice(-10) + "A1!";
        const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
          email: u.email, password, email_confirm: true, user_metadata: { name: u.name, first_name: u.first_name, last_name: u.last_name, employee_code: u.employee_code },
        });
        if (authError) { results.push({ email: u.email, success: false, error: authError.message }); continue; }

        const userId = authData.user.id;
        const profileUpdate: Record<string, any> = {};
        if (u.department_id) profileUpdate.department_id = u.department_id;
        if (u.office_id) profileUpdate.office_id = u.office_id;
        if (u.lunch_break_duration) profileUpdate.lunch_break_duration = u.lunch_break_duration;
        if (u.first_name) profileUpdate.first_name = u.first_name;
        if (u.last_name) profileUpdate.last_name = u.last_name;
        if (u.employee_code) profileUpdate.employee_code = u.employee_code;
        if (Object.keys(profileUpdate).length > 0) {
          await adminClient.from("profiles").update(profileUpdate).eq("user_id", userId);
        }
        if (u.role && u.role !== "employee") {
          await adminClient.from("user_roles").delete().eq("user_id", userId);
          await adminClient.from("user_roles").insert({ user_id: userId, role: u.role });
        }
        results.push({ email: u.email, success: true });
      } catch (err: any) {
        results.push({ email: u.email || "desconocido", success: false, error: err.message });
      }
    }

    const successCount = results.filter((r) => r.success).length;
    return new Response(JSON.stringify({ results, successCount, totalCount: users.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    const status = err.message.includes("autenticado") ? 401 : err.message.includes("autorizado") ? 403 : 500;
    return new Response(JSON.stringify({ error: err.message }), {
      status, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
