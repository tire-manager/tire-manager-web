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
      {/* Navegación lateral fija */}
      <Sidebar />

      {/* Área de contenido principal */}
      <main className="flex-1 ml-64 p-8 overflow-y-auto min-h-screen">
        <div className="max-w-7xl mx-auto animate-in fade-in duration-300">
          {children}
        </div>
      </main>
    </div>
  );
}
