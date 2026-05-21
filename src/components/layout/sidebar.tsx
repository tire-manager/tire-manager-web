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
  Smartphone,
  Menu, // <-- Nuevo icono
  X, // <-- Nuevo icono
} from "lucide-react";
import { auth } from "@/lib/firebase/clientApp";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { getUserProfile } from "@/services/userService";
import { UserProfile, UserRole } from "@/types/user";

// Matriz de menú inteligente (RBAC)
const menuGroups = [
  {
    title: "Operaciones",
    items: [
      {
        name: "Dashboard",
        icon: LayoutDashboard,
        path: "/admin/dashboard",
        roles: ["ADMIN", "INSPECTOR"],
      },
    ],
  },
  {
    title: "Logística",
    items: [
      {
        name: "Flota",
        icon: Truck,
        path: "/admin/trucks",
        roles: ["ADMIN", "INSPECTOR"],
      },
      {
        name: "Almacenes",
        icon: MapPin,
        path: "/admin/warehouses",
        roles: ["ADMIN"],
      },
      {
        name: "Inventario",
        icon: Package,
        path: "/admin/inventory",
        roles: ["ADMIN", "INSPECTOR"],
      },
    ],
  },
  {
    title: "Administración",
    items: [
      { name: "Personal", icon: Users, path: "/admin/users", roles: ["ADMIN"] },
      {
        name: "Reportes",
        icon: LineChart,
        path: "/admin/reports",
        roles: ["ADMIN"],
      },
    ],
  },
  {
    title: "Sistema",
    items: [
      {
        name: "Configuración",
        icon: Settings,
        path: "/admin/settings",
        roles: ["ADMIN"],
      },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // <-- NUEVO ESTADO PARA MÓVIL -->
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // <-- CERRAR MENÚ AL CAMBIAR DE PÁGINA EN MÓVIL -->
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setFirebaseUser(user);
        try {
          const profile = await getUserProfile(user.uid);
          setUserProfile(profile);
        } catch (error) {
          console.error("Error obteniendo el perfil:", error);
        }
      } else {
        setFirebaseUser(null);
        setUserProfile(null);
      }
      setLoading(false);
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

  // Identificamos el rol (por seguridad, si no carga, asume el nivel más bajo)
  const currentRole: UserRole = (userProfile?.role as UserRole) || "INSPECTOR";

  // Filtramos el menú según el rol del usuario logueado
  const filteredMenuGroups = menuGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => item.roles.includes(currentRole)),
    }))
    .filter((group) => group.items.length > 0);

  return (
    <>
      {/* --- TOPBAR MÓVIL (Solo visible en pantallas pequeñas) --- */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-slate-200 z-40 flex items-center justify-between px-4 shadow-sm">
        <div className="flex items-center gap-2 text-slate-900 font-black text-xl tracking-wide">
          <div className="bg-blue-600 p-1.5 rounded-lg shadow-sm shadow-blue-200">
            <Truck className="w-5 h-5 text-white" />
          </div>
          <span>FlotaERP</span>
        </div>
        <button
          onClick={() => setIsMobileOpen(true)}
          className="p-2 text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {/* --- BACKDROP MÓVIL (Fondo oscuro) --- */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* --- SIDEBAR PRINCIPAL --- */}
      <aside
        className={`w-64 h-screen bg-white text-slate-600 flex flex-col fixed left-0 top-0 border-r border-slate-200 z-50 transform transition-transform duration-300 ease-in-out md:translate-x-0 ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logotipo */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2 text-slate-900 font-black text-xl tracking-wide">
            <div className="bg-blue-600 p-1.5 rounded-lg shadow-sm shadow-blue-200">
              <Truck className="w-5 h-5 text-white" />
            </div>
            <span>FlotaERP</span>
          </div>
          {/* BOTÓN CERRAR EN MÓVIL */}
          <button
            onClick={() => setIsMobileOpen(false)}
            className="md:hidden p-2 text-slate-400 hover:bg-slate-50 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* BOTÓN DESTACADO: TERMINAL MÓVIL */}
        {!loading && (
          <div className="px-4 pt-6 shrink-0">
            <Link
              href="/inspector"
              className="flex items-center justify-center gap-2 w-full bg-slate-900 hover:bg-black text-white font-black py-3 rounded-xl shadow-lg transition-all"
            >
              <Smartphone className="w-5 h-5 text-blue-400" />
              Terminal Móvil
            </Link>
          </div>
        )}

        {/* Menú Dinámico */}
        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-6 custom-scrollbar">
          {loading ? (
            /* Esqueleto de carga para el menú */
            <div className="space-y-4 animate-pulse">
              <div className="h-4 bg-slate-100 rounded w-1/3 mb-2"></div>
              <div className="h-10 bg-slate-100 rounded-xl w-full"></div>
              <div className="h-10 bg-slate-100 rounded-xl w-full"></div>
            </div>
          ) : (
            filteredMenuGroups.map((group) => (
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
                        className={`w-5 h-5 ${
                          isActive ? "text-blue-600" : "text-slate-400"
                        }`}
                      />
                      {item.name}
                    </Link>
                  );
                })}
              </div>
            ))
          )}
        </nav>

        {/* Perfil Inferior */}
        <div className="p-4 border-t border-slate-100 bg-white shrink-0">
          {loading ? (
            <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-2xl animate-pulse border border-slate-100">
              <div className="w-10 h-10 bg-slate-200 rounded-xl shrink-0"></div>
              <div className="space-y-2 flex-1">
                <div className="h-3 bg-slate-200 rounded w-3/4"></div>
                <div className="h-2 bg-slate-200 rounded w-1/2"></div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between bg-slate-50 p-3 rounded-2xl border border-slate-100">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="bg-white border border-slate-200 p-2 rounded-xl shrink-0 shadow-sm">
                  <UserCircle2 className="w-5 h-5 text-slate-400" />
                </div>
                <div className="truncate">
                  <p
                    className="text-sm font-bold text-slate-800 truncate"
                    title={
                      userProfile?.displayName || firebaseUser?.email || ""
                    }
                  >
                    {userProfile?.displayName ||
                      firebaseUser?.email ||
                      "Usuario"}
                  </p>
                  <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">
                    {userProfile?.role || "INSPECTOR"}
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
    </>
  );
}
