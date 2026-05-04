// src/app/admin/users/page.tsx
"use client";
import React, { useEffect, useState } from "react";
import { Plus, Search, UserCircle, Truck } from "lucide-react";
import { getUsers, UserProfile } from "@/services/userService";
import { AddUserModal } from "@/components/users/AddUserModal";

export default function UsersPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    const data = await getUsers();
    setUsers(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = users.filter(
    (user) =>
      user.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Gestión de Personal
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Administra los accesos de choferes y otros administradores.
          </p>
        </div>
        <button
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl font-medium hover:bg-blue-700 transition-all shadow-sm"
          onClick={() => setIsModalOpen(true)}
        >
          <Plus className="w-5 h-5" />
          Nuevo Chofer
        </button>
      </div>

      {/* Barra de Búsqueda */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar por nombre o correo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
          />
        </div>
      </div>

      {/* Grid de Usuarios (Mejor que una tabla para perfiles) */}
      {loading ? (
        <div className="text-center py-12 text-slate-500">
          Cargando personal...
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="text-center py-12 text-slate-500">
          No se encontraron usuarios.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredUsers.map((user) => (
            <div
              key={user.uid}
              className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-all flex flex-col"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="bg-slate-100 p-3 rounded-full text-slate-400">
                  <UserCircle className="w-10 h-10" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">
                    {user.displayName}
                  </h3>
                  <p className="text-sm text-slate-500">{user.email}</p>
                </div>
              </div>

              <div className="mt-auto space-y-3 pt-4 border-t border-slate-100">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500">Rol asignado:</span>
                  <span
                    className={`px-2 py-1 rounded-md font-semibold text-xs ${
                      user.role === "ADMIN"
                        ? "bg-purple-100 text-purple-700"
                        : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    {user.role}
                  </span>
                </div>

                {user.role === "DRIVER" && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500">Camión asignado:</span>
                    <span className="flex items-center gap-1 font-medium text-slate-700">
                      <Truck className="w-4 h-4" />
                      {user.truckId ? user.truckId : "Sin asignar"}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <AddUserModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchUsers}
      />
    </div>
  );
}
