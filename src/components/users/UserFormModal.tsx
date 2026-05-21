// src/components/users/UserFormModal.tsx
"use client";
import React, { useState, useEffect } from "react";
import { X, UserPlus, UserCog, Eye, EyeOff } from "lucide-react";
import { createUserViaApi, updateUserProfile } from "@/services/userService";
import { useAuth } from "@/context/AuthContext";
import { UserProfile, UserRole } from "@/types/user";
import toast from "react-hot-toast";

interface UserFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  user?: UserProfile | null;
}

export const UserFormModal: React.FC<UserFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  user,
}) => {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const isEditMode = !!user;

  const [formData, setFormData] = useState({
    displayName: "",
    email: "",
    password: "",
    role: "INSPECTOR" as UserRole,
    status: "ACTIVE" as "ACTIVE" | "INACTIVE" | "ON_VACATION",
  });

  useEffect(() => {
    if (isOpen) {
      if (user) {
        setFormData({
          displayName: user.displayName || "",
          email: user.email || "",
          password: "", // En edición no pedimos contraseña
          role:
            (user.role as any) === "DRIVER"
              ? "INSPECTOR"
              : (user.role as "ADMIN" | "INSPECTOR"),
          status: user.status || "ACTIVE",
        });
      } else {
        setFormData({
          displayName: "",
          email: "",
          password: "",
          role: "INSPECTOR",
          status: "ACTIVE",
        });
      }
    }
  }, [isOpen, user]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.companyId)
      return toast.error("Error crítico: Empresa no identificada");
    setLoading(true);

    try {
      if (isEditMode && user) {
        await updateUserProfile(user.uid, {
          displayName: formData.displayName,
          role: formData.role,
          status: formData.status,
        });
        toast.success("Perfil actualizado con éxito");
      } else {
        await createUserViaApi({
          email: formData.email,
          password: formData.password,
          displayName: formData.displayName,
          role: formData.role,
          status: formData.status,
          companyId: profile.companyId, // Magia SaaS
        });
        toast.success("Personal registrado con éxito");
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Error al guardar el usuario");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-xl ${isEditMode ? "bg-amber-100 text-amber-600" : "bg-blue-100 text-blue-600"}`}
            >
              {isEditMode ? (
                <UserCog className="w-5 h-5" />
              ) : (
                <UserPlus className="w-5 h-5" />
              )}
            </div>
            <h2 className="text-xl font-black text-slate-800">
              {isEditMode ? "Editar Personal" : "Registrar Personal"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 bg-white p-2 rounded-full shadow-sm transition-colors"
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
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none font-medium"
              placeholder="Ej: Juan Pérez"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">
              Correo Electrónico
            </label>
            <input
              type="email"
              required
              disabled={isEditMode} // No se puede cambiar el correo de Firebase una vez creado
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none font-medium disabled:opacity-50"
              placeholder="usuario@flota.com"
            />
          </div>

          {!isEditMode && (
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">
                Contraseña Temporal
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={6}
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  className="w-full p-3 pr-10 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                  placeholder="Mínimo 6 caracteres"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">
                Rol
              </label>
              <select
                value={formData.role}
                onChange={(e) =>
                  setFormData({ ...formData, role: e.target.value as UserRole })
                }
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-700"
              >
                <option value="INSPECTOR">Inspector / Sup.</option>
                <option value="ADMIN">Administrador</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">
                Estado
              </label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value as any })
                }
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-700"
              >
                <option value="ACTIVE">🟢 Activo</option>
                <option value="ON_VACATION">🏖️ Vacaciones</option>
                <option value="INACTIVE">🔴 Inactivo</option>
              </select>
            </div>
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
              className={`flex-1 px-4 py-3 text-white font-black rounded-xl shadow-lg transition-all disabled:opacity-50 flex justify-center items-center ${isEditMode ? "bg-amber-600 hover:bg-amber-700 shadow-amber-600/30" : "bg-blue-600 hover:bg-blue-700 shadow-blue-600/30"}`}
            >
              {loading
                ? "Procesando..."
                : isEditMode
                  ? "Guardar Cambios"
                  : "Registrar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
