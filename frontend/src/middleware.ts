import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const token = req.cookies.get("auth_token")?.value; // 👈 adjust based on how you store auth

  // Otherwise, continue
  return NextResponse.next();
}
