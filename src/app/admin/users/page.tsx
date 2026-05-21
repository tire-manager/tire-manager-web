// src/app/admin/users/page.tsx
"use client";
import React, { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { getUsers } from "@/services/userService";
import { UserProfile } from "@/types/user";
import { UserFormModal } from "@/components/users/UserFormModal";
import { UsersTable } from "@/components/users/UsersTable";
import { useAuth } from "@/context/AuthContext";
import toast from "react-hot-toast";

export default function UsersPage() {
  const { profile } = useAuth();

  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  // Estados del Modal Unificado
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);

  const loadData = async () => {
    if (!profile?.companyId) return;

    setLoading(true);
    try {
      // Ojo: Asegúrate de que getUsers en userService acepte y filtre por companyId
      const usersData = await getUsers(profile.companyId);
      setUsers(usersData);
    } catch (error) {
      toast.error("Error al cargar el personal.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.companyId]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-6">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-900">
            Gestión de Personal
          </h1>
          <p className="text-slate-500 text-sm mt-1 font-medium">
            Administra los accesos y roles del equipo (Admin e Inspectores).
          </p>
        </div>
        <button
          onClick={() => {
            setSelectedUser(null);
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 bg-blue-600 text-white px-5 py-3 rounded-xl font-black hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20"
        >
          <Plus className="w-5 h-5" /> Nuevo Personal
        </button>
      </div>

      {/* Componente de Tabla (Contiene Vistas y Filtros) */}
      <UsersTable
        users={users}
        loading={loading}
        onEditUser={(user) => {
          setSelectedUser(user);
          setIsModalOpen(true);
        }}
      />

      {/* Componente Unificado de Modal */}
      <UserFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={loadData}
        user={selectedUser}
      />
    </div>
  );
}
