// src/components/users/AddUserModal.tsx
"use client";
import React, { useState, useEffect } from "react";
import { X, Eye, EyeOff, UserPlus } from "lucide-react";
import { createUserViaApi, UserStatus } from "@/services/userService";
import { getTrucks } from "@/services/truckService"; // <-- NUEVA IMPORTACIÓN
import { Truck as TruckType } from "@/types/truck"; // <-- NUEVA IMPORTACIÓN
import { UserRole } from "@/types/user";
import toast from "react-hot-toast";

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
  const [showPassword, setShowPassword] = useState(false);
  const [trucks, setTrucks] = useState<TruckType[]>([]); // <-- ESTADO DE CAMIONES

  const [formData, setFormData] = useState({
    displayName: "",
    email: "",
    password: "",
    role: "DRIVER" as UserRole,
    truckId: "",
    status: "ACTIVE" as UserStatus,
  });

  // <-- CARGAMOS LOS CAMIONES AL ABRIR EL MODAL -->
  useEffect(() => {
    if (isOpen) {
      getTrucks().then((data) => {
        // Opcional: Puedes filtrar para que solo salgan camiones activos
        setTrucks(data.filter((t) => t.status !== "DISCARDED"));
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await toast.promise(
        createUserViaApi({
          ...formData,
          // Guardamos el ID del camión si es chofer
          truckId: formData.role === "ADMIN" ? null : formData.truckId || null,
        }),
        {
          loading: "Registrando personal...",
          success: "¡Personal registrado con éxito!",
          error: (err) =>
            err.message || "Error al crear el usuario. Verifica los datos.",
        },
      );

      onSuccess();
      onClose();
      setFormData({
        displayName: "",
        email: "",
        password: "",
        role: "DRIVER",
        truckId: "",
        status: "ACTIVE",
      });
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-2 rounded-xl text-blue-600">
              <UserPlus className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-black text-slate-800">
              Registrar Personal
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
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none font-medium"
              placeholder="chofer@flota.com"
            />
          </div>

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
                <option value="DRIVER">Chofer</option>
                <option value="ADMIN">Administrador</option>
              </select>
            </div>

            {formData.role === "DRIVER" && (
              <div className="animate-in fade-in slide-in-from-right-2">
                <label className="block text-sm font-bold text-slate-700 mb-1">
                  Camión Asignado
                </label>
                {/* <-- AHORA ES UN SELECT CON LOS CAMIONES REALES --> */}
                <select
                  value={formData.truckId}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      truckId: e.target.value,
                    })
                  }
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-700"
                >
                  <option value="">-- Seleccionar --</option>
                  {trucks.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.licensePlate}
                    </option>
                  ))}
                </select>
              </div>
            )}
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
              className="flex-1 px-4 py-3 text-white bg-blue-600 hover:bg-blue-700 font-black rounded-xl shadow-lg shadow-blue-600/30 transition-all disabled:opacity-50 flex justify-center items-center"
            >
              {loading ? "Registrando..." : "Registrar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
