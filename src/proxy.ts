// src/proxy.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const sessionCookie = request.cookies.get("firebaseToken")?.value;
  const userRole = request.cookies.get("userRole")?.value;
  const { pathname } = request.nextUrl;

  const isAuthPage = pathname.startsWith("/login");
  const isAdminPage = pathname.startsWith("/admin");
  const isInspectorPage = pathname.startsWith("/inspector");

  // 1. SI NO HAY SESIÓN: Bloqueo total de áreas privadas
  if (!sessionCookie && (isAdminPage || isInspectorPage)) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // 2. SI HAY SESIÓN Y ESTÁ EN LOGIN: Mandarlo al Dashboard unificado
  if (sessionCookie && isAuthPage) {
    return NextResponse.redirect(new URL("/admin/dashboard", request.url));
  }

  // 3. SEGURIDAD RBAC (Protección de rutas sensibles para el Inspector)
  if (sessionCookie && userRole === "INSPECTOR") {
    const forbiddenPaths = [
      "/admin/users",
      "/admin/settings",
      "/admin/warehouses",
      "/admin/reports",
    ];

    // Si el inspector intenta escribir estas URLs a la fuerza, lo regresamos al Dashboard
    if (forbiddenPaths.some((path) => pathname.startsWith(path))) {
      return NextResponse.redirect(new URL("/admin/dashboard", request.url));
    }
  }

  // 4. LIMPIEZA: Redirigir rutas huérfanas antiguas al nuevo Dashboard
  if (pathname.startsWith("/driver")) {
    return NextResponse.redirect(new URL("/admin/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/login", "/admin/:path*", "/inspector/:path*", "/driver/:path*"],
};
