import { NextResponse } from "next/server";
export async function middleware(request) {
  const token = request.cookies.get("ieee_session")?.value || request.cookies.get("token")?.value;

  if (token) {
    try {
      const configuredApiUrl = (process.env.NEXT_PUBLIC_API_URL || "/api").replace(/\/$/, "");
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
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - not-found (404 page itself)
     * - paths containing a file extension (public images, fonts, and other assets)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|not-found|.*\\..*).*)",
  ],
};
