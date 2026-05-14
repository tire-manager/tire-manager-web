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
  MapPin,
} from "lucide-react";
import { auth } from "@/lib/firebase/clientApp";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { getUserProfile } from "@/services/userService";
import { UserProfile } from "@/types/user";

const menuGroups = [
  {
    title: "Operaciones",
    items: [
      { name: "Dashboard", icon: LayoutDashboard, path: "/admin/dashboard" },
    ],
  },
  {
    title: "Logística",
    items: [
      { name: "Flota", icon: Truck, path: "/admin/trucks" },
      { name: "Almacenes", icon: MapPin, path: "/admin/warehouses" },
      { name: "Inventario", icon: Package, path: "/admin/inventory" },
    ],
  },
  {
    title: "Administración",
    items: [
      { name: "Personal", icon: Users, path: "/admin/users" },
      { name: "Reportes", icon: LineChart, path: "/admin/reports" },
    ],
  },
  {
    title: "Sistema",
    items: [{ name: "Configuración", icon: Settings, path: "/admin/settings" }],
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  // SEPARAMOS LOS ESTADOS PARA MAYOR CONTROL
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true); // <-- Nuevo estado de carga explícito

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setFirebaseUser(user); // Guardamos el usuario de Auth como respaldo
        try {
          const profile = await getUserProfile(user.uid);
          setUserProfile(profile);
        } catch (error) {
          console.error(
            "Error obteniendo el perfil de la base de datos:",
            error,
          );
        }
      } else {
        setFirebaseUser(null);
        setUserProfile(null);
      }
      setLoading(false); // Sin importar si falló o fue exitoso, quitamos el esqueleto
    });

    return () => unsubscribe();
  }, []);

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
    <aside className="w-64 h-screen bg-white text-slate-600 flex flex-col fixed left-0 top-0 border-r border-slate-200 z-50">
      {/* Logotipo o Título de la App */}
      <div className="h-16 flex items-center px-6 border-b border-slate-100 shrink-0">
        <div className="flex items-center gap-2 text-slate-900 font-black text-xl tracking-wide">
          <div className="bg-blue-600 p-1.5 rounded-lg shadow-sm shadow-blue-200">
            <Truck className="w-5 h-5 text-white" />
          </div>
          <span>FlotaERP</span>
        </div>
      </div>

      {/* Menú de Navegación Principal Agrupado */}
      <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-6 custom-scrollbar">
        {menuGroups.map((group) => (
          <div key={group.title} className="space-y-1">
            <p className="px-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
              {group.title}
            </p>
            {group.items.map((item) => {
              const Icon = item.icon;
              const isActive = pathname.startsWith(item.path);

              return (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-semibold transition-all duration-200 ${
                    isActive
                      ? "bg-blue-50 text-blue-700"
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 ${isActive ? "text-blue-600" : "text-slate-400"}`}
                  />
                  {item.name}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer del Sidebar: Perfil del Usuario Activo */}
      <div className="p-4 border-t border-slate-100 bg-white shrink-0">
        {loading ? (
          /* Estado de carga ("Esqueleto") Light - Solo se muestra mientras consulta a la BD */
          <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-2xl animate-pulse border border-slate-100">
            <div className="w-10 h-10 bg-slate-200 rounded-xl shrink-0"></div>
            <div className="space-y-2 flex-1">
              <div className="h-3 bg-slate-200 rounded w-3/4"></div>
              <div className="h-2 bg-slate-200 rounded w-1/2"></div>
            </div>
          </div>
        ) : (
          /* Usuario Cargado - Se muestra incluso si el Perfil falló, usando el correo como respaldo */
          <div className="flex items-center justify-between bg-slate-50 p-3 rounded-2xl border border-slate-100">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="bg-white border border-slate-200 p-2 rounded-xl shrink-0 shadow-sm">
                <UserCircle2 className="w-5 h-5 text-slate-400" />
              </div>
              <div className="truncate">
                <p
                  className="text-sm font-bold text-slate-800 truncate"
                  title={userProfile?.displayName || firebaseUser?.email || ""}
                >
                  {/* MAGIA AQUÍ: Intenta Nombre -> Si no hay, usa el Correo -> Si no hay, dice Administrador */}
                  {userProfile?.displayName ||
                    firebaseUser?.email ||
                    "Administrador"}
                </p>
                <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">
                  {userProfile?.role || "ADMIN"}
                </p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              title="Cerrar sesión"
              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors shrink-0"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
