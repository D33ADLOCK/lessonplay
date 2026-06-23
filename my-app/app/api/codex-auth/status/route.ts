import { NextResponse } from "next/server";

import { getCodexAuthStatus } from "@/lib/codex-oauth/sessions";

export async function GET() {
  return NextResponse.json(await getCodexAuthStatus());
}
