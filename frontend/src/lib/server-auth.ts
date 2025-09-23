// frontend/src/lib/server-auth.ts
import { cookies } from "next/headers";

const BACKEND_API_URL = "http://192.168.1.1:8085/api";

export async function getServerUser() {
  const accessToken =  (await cookies()).get("access_token")?.value;
  if (!accessToken) return null;

  try {
    const response = await fetch(`${BACKEND_API_URL}/auth/validate`, {
      method: "GET",
      headers: {
        'Cookie': `access_token=${accessToken}`, 
      },
    });

    if (!response.ok) return null;

    const data = await response.json();
    return data.user ?? null; 
  } catch (err) {
    console.error("Server-side token validation failed:", err);
    return null;
  }
}
