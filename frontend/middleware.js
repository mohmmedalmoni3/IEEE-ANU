import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function middleware(request) {
  const cookieStore = cookies();
  const token = cookieStore.get("token");

  if (token) {
    try {
      // Get user data from backend to check show_404
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`, {
        headers: {
          Authorization: `Bearer ${token.value}`,
        },
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
     */
    "/((?!api|_next/static|_next/image|favicon.ico|not-found).*)",
  ],
};
