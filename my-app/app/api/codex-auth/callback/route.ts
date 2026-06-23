import { NextRequest, NextResponse } from "next/server";

import { completeCodexLogin } from "@/lib/codex-oauth/sessions";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");

  if (!code || !state) {
    return NextResponse.redirect(new URL("/?codexAuth=missing-code", request.url));
  }

  try {
    await completeCodexLogin({
      code,
      state,
      origin: request.nextUrl.origin,
    });

    return NextResponse.redirect(new URL("/?codexAuth=connected", request.url));
  } catch {
    return NextResponse.redirect(new URL("/?codexAuth=failed", request.url));
  }
}
