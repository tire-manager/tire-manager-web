// src/proxy.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const sessionCookie = request.cookies.get("firebaseToken")?.value;
  const userRole = request.cookies.get("userRole")?.value;
  const { pathname } = request.nextUrl;

  const isAuthPage = pathname.startsWith("/login");
  const isAdminPage = pathname.startsWith("/admin");
  const isDriverPage = pathname.startsWith("/driver");

  // 1. SI NO HAY SESIÓN: Bloqueo total de áreas privadas
  if (!sessionCookie && (isAdminPage || isDriverPage)) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // 2. SI HAY SESIÓN Y ESTÁ EN LOGIN: Mandarlo a su pantalla principal
  if (sessionCookie && isAuthPage) {
    return userRole === "ADMIN"
      ? NextResponse.redirect(new URL("/admin/dashboard", request.url))
      : NextResponse.redirect(new URL("/driver", request.url));
  }

  // 3. SEGURIDAD CRUZADA: Un Driver no puede entrar a /admin
  if (sessionCookie && isAdminPage && userRole !== "ADMIN") {
    return NextResponse.redirect(new URL("/driver", request.url));
  }

  // 4. LIMPIEZA DE RUTAS: Redirigir /driver/dashboard a la nueva vista unificada /driver
  if (sessionCookie && pathname === "/driver/dashboard") {
    return NextResponse.redirect(new URL("/driver", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/login", "/admin/:path*", "/driver/:path*"],
};
