// src/components/users/UsersTable.tsx
"use client";
import React, { useState } from "react";
import {
  UserCircle,
  Filter,
  Edit2,
  LayoutGrid,
  List,
  Search,
} from "lucide-react";
import { UserProfile } from "@/types/user";

interface UsersTableProps {
  users: UserProfile[];
  loading: boolean;
  onEditUser: (user: UserProfile) => void;
}

export const UsersTable: React.FC<UsersTableProps> = ({
  users,
  loading,
  onEditUser,
}) => {
  const [viewMode, setViewMode] = useState<"grid" | "table">("table");
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());

    // Tratamos a los antiguos DRIVER como INSPECTOR visualmente en el filtro
    const actualRole = user.role;
    const matchesRole = roleFilter === "ALL" || actualRole === roleFilter;

    const matchesStatus =
      statusFilter === "ALL" || (user.status || "ACTIVE") === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const getStatusBadge = (status?: string) => {
    const currentStatus = status || "ACTIVE";
    const styles: Record<string, string> = {
      ACTIVE: "bg-emerald-100 text-emerald-700 border-emerald-200",
      ON_VACATION: "bg-amber-100 text-amber-700 border-amber-200",
      INACTIVE: "bg-red-100 text-red-700 border-red-200",
    };
    const labels: Record<string, string> = {
      ACTIVE: "Activo",
      ON_VACATION: "Vacaciones",
      INACTIVE: "Inactivo",
    };

    return (
      <span
        className={`px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider border ${styles[currentStatus]}`}
      >
        {labels[currentStatus]}
      </span>
    );
  };

  return (
    <div className="space-y-4">
      {/* Barra de Filtros y Vistas */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar por nombre o correo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium"
          />
        </div>

        <div className="flex gap-4 w-full md:w-auto">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="flex-1 md:w-40 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-700"
          >
            <option value="ALL">Todos los roles</option>
            <option value="ADMIN">Administrador</option>
            <option value="INSPECTOR">Inspector</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="flex-1 md:w-40 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-700"
          >
            <option value="ALL">Todos los estados</option>
            <option value="ACTIVE">Activos</option>
            <option value="ON_VACATION">De Vacaciones</option>
            <option value="INACTIVE">Inactivos</option>
          </select>
        </div>

        {/* Toggle de Vistas */}
        <div className="flex bg-slate-100 p-1 rounded-xl shrink-0 w-full md:w-auto">
          <button
            onClick={() => setViewMode("grid")}
            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
              viewMode === "grid"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <LayoutGrid className="w-4 h-4" /> Tarjetas
          </button>
          <button
            onClick={() => setViewMode("table")}
            className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
              viewMode === "table"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <List className="w-4 h-4" /> Tabla
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-500 font-bold bg-white rounded-2xl border border-slate-200">
          Cargando personal...
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-300">
          <Filter className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">
            No se encontraron usuarios con estos filtros.
          </p>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredUsers.map((user) => (
            <div
              key={user.uid}
              className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-all flex flex-col group relative"
            >
              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => onEditUser(user)}
                  className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors border border-transparent hover:border-blue-100"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-start gap-4 mb-5">
                <div className="bg-slate-50 p-3 rounded-full text-slate-400 shrink-0">
                  <UserCircle className="w-10 h-10" />
                </div>
                <div className="truncate pr-6">
                  <h3 className="font-black text-slate-900 truncate">
                    {user.displayName}
                  </h3>
                  <p className="text-xs font-medium text-slate-500 truncate">
                    {user.email}
                  </p>
                </div>
              </div>

              <div className="mt-auto space-y-3 pt-4 border-t border-slate-100">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500 font-bold text-xs uppercase">
                    Rol
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-md font-black text-[10px] uppercase ${user.role === "ADMIN" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"}`}
                  >
                    {user.role}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500 font-bold text-xs uppercase">
                    Estado
                  </span>
                  {getStatusBadge(user.status)}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider">
                  <th className="p-4 font-black">Personal</th>
                  <th className="p-4 font-black">Rol</th>
                  <th className="p-4 font-black">Estado Operativo</th>
                  <th className="p-4 font-black text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredUsers.map((user) => (
                  <tr
                    key={user.uid}
                    className="hover:bg-blue-50/50 transition-colors group"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <UserCircle className="w-8 h-8 text-slate-400" />
                        <div>
                          <div className="font-black text-slate-900">
                            {user.displayName}
                          </div>
                          <div className="font-medium text-slate-500 text-xs">
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-2 py-0.5 rounded-md font-black text-[10px] uppercase ${user.role === "ADMIN" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"}`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="p-4">{getStatusBadge(user.status)}</td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => onEditUser(user)}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
