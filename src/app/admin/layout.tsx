// src/app/admin/layout.tsx
import Sidebar from "@/components/layout/sidebar";
import React from "react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Navegación lateral y superior (Responsive) */}
      <Sidebar />

      {/* Área de contenido principal adaptada para móvil */}
      <main className="flex-1 md:ml-64 pt-20 p-4 md:p-8 md:pt-8 min-h-screen overflow-x-hidden">
        <div className="max-w-7xl mx-auto animate-in fade-in duration-300">
          {children}
        </div>
      </main>
    </div>
  );
}
