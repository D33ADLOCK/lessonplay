import { NextRequest, NextResponse } from "next/server";

import { startCodexLogin } from "@/lib/codex-oauth/sessions";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const { authorizationUrl } = await startCodexLogin({
      origin: request.nextUrl.origin,
    });

    return NextResponse.redirect(authorizationUrl);
  } catch {
    return NextResponse.redirect(
      new URL("/?codexAuth=callback-port-unavailable", request.url),
    );
  }
}
