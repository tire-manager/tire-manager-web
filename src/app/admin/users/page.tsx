// src/app/admin/users/page.tsx
"use client";
import React, { useEffect, useState } from "react";
import { Plus, Search, UserCircle, Truck, Filter, Edit2 } from "lucide-react";
import { getUsers } from "@/services/userService";
import { AddUserModal } from "@/components/users/AddUserModal";
import { EditUserModal } from "@/components/users/EditUserModal";
import { UserProfile } from "@/types/user";

export default function UsersPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Modales
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    const data = await getUsers();
    setUsers(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === "ALL" || user.role === roleFilter;
    const matchesStatus =
      statusFilter === "ALL" || (user.status || "ACTIVE") === statusFilter;

    return matchesSearch && matchesRole && matchesStatus;
  });

  const getStatusBadge = (status?: string) => {
    const currentStatus = status || "ACTIVE";
    const styles: any = {
      ACTIVE: "bg-emerald-100 text-emerald-700 border-emerald-200",
      ON_VACATION: "bg-amber-100 text-amber-700 border-amber-200",
      INACTIVE: "bg-red-100 text-red-700 border-red-200",
    };
    const labels: any = {
      ACTIVE: "Activo",
      ON_VACATION: "Vacaciones",
      INACTIVE: "Inactivo",
    };

    return (
      <span
        className={`px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase border ${styles[currentStatus]}`}
      >
        {labels[currentStatus]}
      </span>
    );
  };

  const handleEditClick = (user: UserProfile) => {
    setSelectedUser(user);
    setIsEditModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Gestión de Personal
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Administra los accesos y estados operativos del equipo.
          </p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-sm"
        >
          <Plus className="w-5 h-5" />
          Nuevo Personal
        </button>
      </div>

      {/* Barra de Filtros */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 grid grid-cols-1 md:grid-cols-12 gap-4">
        <div className="md:col-span-6 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar por nombre o correo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium"
          />
        </div>
        <div className="md:col-span-3">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none font-medium text-slate-700"
          >
            <option value="ALL">Todos los roles</option>
            <option value="ADMIN">Administradores</option>
            <option value="DRIVER">Choferes</option>
          </select>
        </div>
        <div className="md:col-span-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none font-medium text-slate-700"
          >
            <option value="ALL">Todos los estados</option>
            <option value="ACTIVE">Activos</option>
            <option value="ON_VACATION">De Vacaciones</option>
            <option value="INACTIVE">Inactivos</option>
          </select>
        </div>
      </div>

      {/* Grid de Usuarios */}
      {loading ? (
        <div className="text-center py-12 text-slate-500 font-bold">
          Cargando personal...
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-300">
          <Filter className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">
            No se encontraron usuarios con estos filtros.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredUsers.map((user) => (
            <div
              key={user.uid}
              className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-all flex flex-col group"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-4">
                  <div className="bg-slate-50 p-3 rounded-full text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                    <UserCircle className="w-10 h-10" />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 truncate max-w-[150px]">
                      {user.displayName}
                    </h3>
                    <p className="text-xs font-medium text-slate-500 truncate max-w-[150px]">
                      {user.email}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleEditClick(user)}
                  className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                  title="Editar Personal"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>

              <div className="mt-auto space-y-3 pt-4 border-t border-slate-100">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500 font-medium">
                    Rol y Estado:
                  </span>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded-md font-black text-[10px] uppercase ${user.role === "ADMIN" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"}`}
                    >
                      {user.role}
                    </span>
                    {getStatusBadge(user.status)}
                  </div>
                </div>

                {user.role === "DRIVER" && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500 font-medium">
                      Unidad Asignada:
                    </span>
                    <span
                      className={`flex items-center gap-1 font-bold text-xs uppercase ${user.truckId ? "text-slate-900" : "text-slate-400 italic"}`}
                    >
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
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={fetchUsers}
      />
      <EditUserModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={fetchUsers}
        user={selectedUser}
      />
    </div>
  );
}
