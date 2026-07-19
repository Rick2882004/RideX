import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

export async function proxy(request: NextRequest) {
  const sessionCookie = getSessionCookie(request);
  const { pathname } = request.nextUrl;

  const isRiderRoute = pathname.startsWith("/rider");
  const isDriverRoute = pathname.startsWith("/driver");
  const isAdminRoute = pathname.startsWith("/admin");
  const isAuthRoute = pathname === "/login" || pathname === "/register";

  // 1. Redirect unauthenticated users from protected routes
  if ((isRiderRoute || isDriverRoute || isAdminRoute) && !sessionCookie) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  // 2. Perform role-based access validation
  if (sessionCookie) {
    try {
      // Validate session via Better Auth internal API
      const response = await fetch(new URL("/api/auth/get-session", request.url), {
        headers: {
          cookie: request.headers.get("cookie") || "",
        },
      });

      if (response.ok) {
        const sessionData = await response.json();
        const user = sessionData?.user;

        if (user) {
          const userRole = user.role;

          // Redirect already logged-in users away from login/register pages
          if (isAuthRoute) {
            if (userRole === "DRIVER") {
              return NextResponse.redirect(new URL("/driver", request.url));
            } else if (userRole === "ADMIN") {
              return NextResponse.redirect(new URL("/admin", request.url));
            } else {
              return NextResponse.redirect(new URL("/rider", request.url));
            }
          }

          // Restrict non-riders from /rider
          if (isRiderRoute && userRole !== "RIDER" && userRole !== "ADMIN") {
            const dest = userRole === "DRIVER" ? "/driver" : "/login";
            return NextResponse.redirect(new URL(dest, request.url));
          }

          // Restrict non-drivers from /driver
          if (isDriverRoute && userRole !== "DRIVER" && userRole !== "ADMIN") {
            const dest = userRole === "RIDER" ? "/rider" : "/login";
            return NextResponse.redirect(new URL(dest, request.url));
          }

          // Restrict non-admins from /admin
          if (isAdminRoute && userRole !== "ADMIN") {
            const dest = userRole === "RIDER" ? "/rider" : userRole === "DRIVER" ? "/driver" : "/login";
            return NextResponse.redirect(new URL(dest, request.url));
          }
        }
      } else {
        // Clear session if invalid
        if (isRiderRoute || isDriverRoute || isAdminRoute) {
          return NextResponse.redirect(new URL("/login", request.url));
        }
      }
    } catch (err) {
      console.error("Proxy session fetch failed:", err);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/rider/:path*",
    "/driver/:path*",
    "/admin/:path*",
    "/login",
    "/register",
  ],
};
