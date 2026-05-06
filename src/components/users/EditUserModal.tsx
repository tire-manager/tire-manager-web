// src/components/users/EditUserModal.tsx
"use client";
import React, { useEffect, useState } from "react";
import { X, UserCog } from "lucide-react";
import { updateUserProfile, UserStatus } from "@/services/userService";
import { UserProfile, UserRole } from "@/types/user";
import toast from "react-hot-toast";

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  user: UserProfile | null;
}

export const EditUserModal: React.FC<EditUserModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  user,
}) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    displayName: "",
    role: "DRIVER" as UserRole,
    status: "ACTIVE" as UserStatus,
  });

  useEffect(() => {
    if (user && isOpen) {
      setFormData({
        displayName: user.displayName,
        role: user.role,
        status: user.status || "ACTIVE",
      });
    }
  }, [user, isOpen]);

  if (!isOpen || !user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await toast.promise(
        updateUserProfile(user.uid, {
          displayName: formData.displayName,
          role: formData.role,
        }),
        {
          loading: "Actualizando personal...",
          success: "¡Perfil actualizado con éxito!",
          error: "Error al actualizar.",
        },
      );
      onSuccess();
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="bg-amber-100 p-2 rounded-xl text-amber-600">
              <UserCog className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-black text-slate-800">
              Editar Personal
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors bg-white p-2 rounded-full shadow-sm"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">
              Nombre Completo
            </label>
            <input
              type="text"
              required
              value={formData.displayName}
              onChange={(e) =>
                setFormData({ ...formData, displayName: e.target.value })
              }
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-amber-500 outline-none font-medium"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">
              Rol en el Sistema
            </label>
            <select
              value={formData.role}
              onChange={(e) =>
                setFormData({ ...formData, role: e.target.value as UserRole })
              }
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-amber-500 outline-none font-medium"
            >
              <option value="DRIVER">Chofer (App Móvil)</option>
              <option value="ADMIN">Administrador (Panel Web)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">
              Estado Operativo
            </label>
            <select
              value={formData.status}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  status: e.target.value as UserStatus,
                })
              }
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-amber-500 outline-none font-bold text-slate-700"
            >
              <option value="ACTIVE">🟢 Activo</option>
              <option value="ON_VACATION">🏖️ De Vacaciones</option>
              <option value="INACTIVE">🔴 Inactivo (Baja)</option>
            </select>
          </div>

          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 text-slate-600 bg-slate-100 hover:bg-slate-200 font-bold rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-3 text-white bg-amber-600 hover:bg-amber-700 font-black rounded-xl shadow-lg shadow-amber-600/30 transition-all disabled:opacity-50"
            >
              {loading ? "Guardando..." : "Guardar Cambios"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
