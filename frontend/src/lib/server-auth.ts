// frontend/src/lib/server-auth.ts

import { cookies } from "next/headers";

const BACKEND_API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8085/api";

export async function getServerUser() {
  const token = (await cookies()).get("auth_token")?.value;

  if (!token) {
    return null;
  }

  try {
    const response = await fetch(`${BACKEND_API_URL}/auth/validate`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.user;
  } catch (error) {
    console.error("Server-side token validation failed:", error);
    return null;
  }
}
