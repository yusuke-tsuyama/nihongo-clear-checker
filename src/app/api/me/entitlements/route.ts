import { NextResponse } from "next/server";
import { createClient as createServerSupabaseClient } from "@/lib/supabase/server";
import { getUserEntitlements } from "@/lib/user-entitlements";

export async function GET() {
  const serverSupabase = await createServerSupabaseClient();
  const entitlements = await getUserEntitlements(serverSupabase);
  return NextResponse.json(entitlements);
}
