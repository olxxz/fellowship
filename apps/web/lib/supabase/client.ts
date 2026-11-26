"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { supabaseConfig } from "./config";

let client: SupabaseClient | undefined;

/** Cliente do Supabase no navegador (login, envio de mensagens, tempo real). */
export function getBrowserClient() {
  if (!client) {
    const { url, key } = supabaseConfig();
    client = createBrowserClient(url, key);
  }
  return client;
}
