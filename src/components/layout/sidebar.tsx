"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Truck,
  Users,
  Settings,
  LogOut,
  UserCircle2,
  LineChart,
} from "lucide-react";
import { auth } from "@/lib/firebase/clientApp";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { getUserProfile } from "@/services/userService";
import { UserProfile } from "@/types/user";

// Definimos las rutas del menú en un arreglo para que sea fácil de mantener
const menuItems = [
  { name: "Dashboard", icon: LayoutDashboard, path: "/admin/dashboard" },
  { name: "Inventario", icon: Package, path: "/admin/inventory" },
  { name: "Flota", icon: Truck, path: "/admin/trucks" },
  { name: "Personal", icon: Users, path: "/admin/users" },
  { name: "Reportes", icon: LineChart, path: "/admin/reports" }, // NUEVO BOTÓN AQUÍ
  { name: "Configuración", icon: Settings, path: "/admin/settings" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    // Escuchamos quién está logueado actualmente
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const profile = await getUserProfile(user.uid);
        setUserProfile(profile);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      // Limpiamos las cookies de seguridad
      document.cookie = "firebaseToken=; path=/; max-age=0;";
      document.cookie = "userRole=; path=/; max-age=0;";
      window.location.href = "/login";
    } catch (error) {
      console.error("Error al cerrar sesión", error);
    }
  };

  return (
    <aside className="w-64 h-screen bg-slate-900 text-slate-300 flex flex-col fixed left-0 top-0 border-r border-slate-800 z-50 shadow-2xl">
      {/* Logotipo o Título de la App */}
      <div className="h-16 flex items-center px-6 border-b border-slate-800">
        <div className="flex items-center gap-2 text-white font-black text-xl tracking-wide">
          <div className="bg-blue-600 p-1.5 rounded-lg">
            <Truck className="w-5 h-5 text-white" />
          </div>
          <span>FlotaERP</span>
        </div>
      </div>

      {/* Menú de Navegación Principal */}
      <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
        <p className="px-3 text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">
          Menú Principal
        </p>

        {menuItems.map((item) => {
          const Icon = item.icon;
          // Verificamos si la ruta actual coincide con la del botón para pintarlo de activo
          const isActive = pathname.startsWith(item.path);

          return (
            <Link
              key={item.path}
              href={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-all duration-200 ${
                isActive
                  ? "bg-blue-600 text-white shadow-md shadow-blue-900/20"
                  : "hover:bg-slate-800 hover:text-white"
              }`}
            >
              <Icon
                className={`w-5 h-5 ${isActive ? "text-white" : "text-slate-400"}`}
              />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Footer del Sidebar: Perfil del Usuario Activo */}
      <div className="p-4 border-t border-slate-800 bg-slate-900/50">
        {userProfile ? (
          <div className="flex items-center justify-between bg-slate-800 p-3 rounded-xl border border-slate-700 shadow-inner">
            <div className="flex items-center gap-3 overflow-hidden">
              {/* Avatar genérico */}
              <div className="bg-slate-700 p-2 rounded-lg shrink-0">
                <UserCircle2 className="w-5 h-5 text-slate-300" />
              </div>
              <div className="truncate">
                <p className="text-sm font-bold text-white truncate">
                  {userProfile.displayName || "Administrador"}
                </p>
                <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
                  {userProfile.role}
                </p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              title="Cerrar sesión"
              className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        ) : (
          /* Estado de carga ("Esqueleto") mientras Firebase trae los datos */
          <div className="flex items-center gap-3 bg-slate-800 p-3 rounded-xl animate-pulse">
            <div className="w-9 h-9 bg-slate-700 rounded-lg"></div>
            <div className="space-y-2 flex-1">
              <div className="h-3 bg-slate-700 rounded w-3/4"></div>
              <div className="h-2 bg-slate-700 rounded w-1/2"></div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
