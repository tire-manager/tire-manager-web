// src/components/users/AddUserModal.tsx
"use client";
import React, { useState } from "react";
import { X, Eye, EyeOff } from "lucide-react";
import { createUserViaApi } from "@/services/userService";
import { UserRole } from "@/types/user";

interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AddUserModal: React.FC<AddUserModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    displayName: "",
    email: "",
    password: "",
    role: "DRIVER" as UserRole,
    truckId: "",
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await createUserViaApi({
        ...formData,
        // Si es ADMIN, nos aseguramos de que el truckId vaya nulo
        truckId: formData.role === "ADMIN" ? null : formData.truckId,
      });

      onSuccess();
      onClose();
      // Limpiamos el formulario tras el éxito
      setFormData({
        displayName: "",
        email: "",
        password: "",
        role: "DRIVER",
        truckId: "",
      });
    } catch (err: any) {
      setError(err.message || "Error al crear el usuario. Verifica los datos.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-6 border-b border-slate-100">
          <h2 className="text-xl font-bold text-slate-800">
            Registrar Personal
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              Nombre Completo
            </label>
            <input
              type="text"
              required
              value={formData.displayName}
              onChange={(e) =>
                setFormData({ ...formData, displayName: e.target.value })
              }
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Ej: Juan Pérez"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              Correo Electrónico
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="chofer@flota.com"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
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
                className="w-full p-3 pr-10 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                Rol
              </label>
              <select
                value={formData.role}
                onChange={(e) =>
                  setFormData({ ...formData, role: e.target.value as UserRole })
                }
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="DRIVER">Chofer</option>
                <option value="ADMIN">Administrador</option>
              </select>
            </div>

            {formData.role === "DRIVER" && (
              <div className="animate-in fade-in slide-in-from-right-2">
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Camión Asignado
                </label>
                <input
                  type="text"
                  value={formData.truckId}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      truckId: e.target.value.toUpperCase(),
                    })
                  }
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Placa o ID"
                />
              </div>
            )}
          </div>

          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 text-slate-600 bg-slate-100 hover:bg-slate-200 font-semibold rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-3 text-white bg-blue-600 hover:bg-blue-700 font-semibold rounded-xl shadow-sm transition-all disabled:opacity-50"
            >
              {loading ? "Creando..." : "Registrar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
