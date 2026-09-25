import { createClient, type SupabaseClient } from "@supabase/supabase-js";

function lerEnv(): { url: string; anon: string; service: string } {
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    anon: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
    service: process.env.SUPABASE_SERVICE_ROLE_KEY ?? ""
  };
}

/** Cliente servidor (service_role): ignora RLS. Exigido por /api/sync. */
export function supabaseAdmin(): SupabaseClient {
  const { url, service } = lerEnv();
  if (!url || !service || service.includes("trocar")) {
    throw new Error(
      "Supabase não configurado no servidor: defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env."
    );
  }
  return createClient(url, service, { auth: { persistSession: false } });
}
