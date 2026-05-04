// src/proxy.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  // Verificamos si existe el token en las cookies
  const sessionCookie = request.cookies.get("firebaseToken")?.value;

  const isAuthPage = request.nextUrl.pathname.startsWith("/login");
  const isAdminPage = request.nextUrl.pathname.startsWith("/admin");
  const isDriverPage = request.nextUrl.pathname.startsWith("/driver");

  // Si no hay sesión y no está en login, redirigir a login
  if (!sessionCookie && (isAdminPage || isDriverPage)) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Si hay sesión y está intentando acceder al login, redirigirlo a su rol
  if (sessionCookie && isAuthPage) {
    const userRole = request.cookies.get("userRole")?.value;

    if (userRole === "ADMIN") {
      return NextResponse.redirect(new URL("/admin/dashboard", request.url));
    } else {
      return NextResponse.redirect(new URL("/driver/dashboard", request.url));
    }
  }

  return NextResponse.next();
}

// La configuración del matcher se mantiene igual en la v16
export const config = {
  matcher: ["/login", "/admin/:path*", "/driver/:path*"],
};
