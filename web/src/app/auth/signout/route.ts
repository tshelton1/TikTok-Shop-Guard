import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { getURL } from "@/lib/utils";

export async function POST() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return NextResponse.redirect(`${getURL()}/login`);
}

export async function GET() {
  return POST();
}
