import { NextResponse } from "next/server";

import { logoutCodexAuth } from "@/lib/codex-oauth/sessions";

export async function POST() {
  await logoutCodexAuth();

  return NextResponse.json({ ok: true });
}
