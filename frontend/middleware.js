import { NextResponse } from "next/server";
export async function middleware(request) {
  const token = request.cookies.get("ieee_session")?.value || request.cookies.get("token")?.value;

  if (token) {
    try {
      let configuredApiUrl = (process.env.API_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL || "/api").replace(/\/$/, "");
      if (!configuredApiUrl.startsWith("http") && process.env.VERCEL) {
        configuredApiUrl = "https://ieee-anu.onrender.com/api";
      }
      const authUrl = configuredApiUrl.startsWith("http")
        ? `${configuredApiUrl}/auth/me`
        : new URL(`${configuredApiUrl}/auth/me`, request.url);
      const response = await fetch(authUrl, {
        headers: {
          Cookie: `ieee_session=${token}`
        },
        cache: "no-store"
      });

      if (response.ok) {
        const data = await response.json();
        if (data.user && data.user.show404) {
          // Redirect to 404 page if user has show_404 enabled
          return NextResponse.redirect(new URL("/not-found", request.url));
        }
      }
    } catch (error) {
      // If there's an error, continue normally
      console.error("Error checking show_404:", error);
    }
  }

  return NextResponse.next();
}

export const config = {
  // Public pages are served directly from the CDN. Navbar checks restricted
  // accounts after paint; protected pages still check before rendering.
  matcher: ["/admin/:path*", "/profile/:path*", "/applications/:path*"],
};
