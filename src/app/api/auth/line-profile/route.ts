import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    // 1. Get the Authorization header (Bearer token) from Supabase
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Missing authorization header" }, { status: 401 });
    }

    // 2. Call the real LINE v2/profile endpoint
    const lineResponse = await fetch("https://api.line.me/v2/profile", {
      method: "GET",
      headers: {
        "Authorization": authHeader,
      },
    });

    if (!lineResponse.ok) {
      const errorText = await lineResponse.text();
      console.error("LINE profile error:", lineResponse.status, errorText);
      return NextResponse.json({ error: "Failed to fetch LINE profile" }, { status: lineResponse.status });
    }

    const lineData = await lineResponse.json();

    // 3. Map LINE's payload to standard OIDC claims expected by Supabase
    // LINE returns: { userId, displayName, pictureUrl, statusMessage }
    // Supabase expects: { sub, name, picture }
    const mappedData = {
      sub: lineData.userId,
      name: lineData.displayName,
      picture: lineData.pictureUrl,
    };

    return NextResponse.json(mappedData);
  } catch (error) {
    console.error("Proxy error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
