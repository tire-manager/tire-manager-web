// src/app/driver/layout.tsx
"use client";
import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Truck, ClipboardSignature, LogOut } from "lucide-react";
import { auth } from "@/lib/firebase/clientApp";
import { signOut } from "firebase/auth";

export default function DriverLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      document.cookie = "firebaseToken=; path=/; max-age=0;";
      document.cookie = "userRole=; path=/; max-age=0;";
      window.location.href = "/login";
    } catch (error) {
      console.error("Error al cerrar sesión", error);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Cabecera superior (App Bar) */}
      <header className="bg-blue-600 text-white p-4 shadow-md flex justify-between items-center sticky top-0 z-20">
        <h1 className="text-xl font-bold tracking-wide">Mi Camión</h1>
        <button
          onClick={handleLogout}
          className="p-2 bg-blue-700 hover:bg-blue-800 rounded-full transition-colors"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </header>

      {/* Área de contenido principal (con padding inferior para que no lo tape la barra) */}
      <main className="flex-1 pb-20 p-4 max-w-md mx-auto w-full animate-in fade-in duration-300">
        {children}
      </main>

      {/* Barra de Navegación Inferior */}
      <nav className="fixed bottom-0 w-full bg-white border-t border-slate-200 flex justify-around p-2 pb-safe z-20 shadow-[0_-4px_6px_-1px_rgb(0,0,0,0.05)]">
        <Link
          href="/driver/dashboard"
          className={`flex flex-col items-center gap-1 p-2 w-20 rounded-xl transition-colors ${
            pathname === "/driver/dashboard"
              ? "text-blue-600"
              : "text-slate-500 hover:bg-slate-50"
          }`}
        >
          <Truck className="w-6 h-6" />
          <span className="text-[10px] font-semibold uppercase tracking-wider">
            Vehículo
          </span>
        </Link>

        <Link
          href="/driver/inspection"
          className={`flex flex-col items-center gap-1 p-2 w-20 rounded-xl transition-colors ${
            pathname === "/driver/inspection"
              ? "text-blue-600"
              : "text-slate-500 hover:bg-slate-50"
          }`}
        >
          <ClipboardSignature className="w-6 h-6" />
          <span className="text-[10px] font-semibold uppercase tracking-wider">
            Inspección
          </span>
        </Link>
      </nav>
    </div>
  );
}
