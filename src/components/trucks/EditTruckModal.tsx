// src/components/trucks/EditTruckModal.tsx
"use client";
import React, { useState, useEffect } from "react";
import { X, Edit2, User } from "lucide-react";
import { updateTruck, assignDriverToTruck } from "@/services/truckService";
import { getDrivers } from "@/services/userService";
import { getGlobalSettings, GlobalSettings } from "@/services/settingsService";
import { Truck } from "@/types/truck";
import toast from "react-hot-toast";
import { UserProfile } from "@/types/user";

interface EditTruckModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  truck: Truck;
}

export const EditTruckModal: React.FC<EditTruckModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  truck,
}) => {
  const [loading, setLoading] = useState(false);
  const [drivers, setDrivers] = useState<UserProfile[]>([]);
  const [config, setConfig] = useState<GlobalSettings | null>(null);

  const [formData, setFormData] = useState({
    licensePlate: "",
    brand: "",
    model: "",
    year: new Date().getFullYear(),
    status: "ACTIVE" as Truck["status"],
    assignedDriverId: "",
  });

  useEffect(() => {
    if (isOpen) {
      getDrivers().then(setDrivers);
      getGlobalSettings().then(setConfig);
    }

    if (truck && isOpen) {
      setFormData({
        licensePlate: truck.licensePlate,
        brand: truck.brand || "",
        model: truck.model || "",
        year: truck.year,
        status: truck.status,
        assignedDriverId: truck.assignedDriverId || "",
      });
    }
  }, [truck, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await updateTruck(truck.id, {
        licensePlate: formData.licensePlate.toUpperCase(),
        brand: formData.brand.toUpperCase(),
        model: formData.model.toUpperCase(),
        year: formData.year,
        status: formData.status,
      });

      const oldDriver = truck.assignedDriverId || null;
      const newDriver = formData.assignedDriverId || null;

      if (oldDriver !== newDriver) {
        await assignDriverToTruck(truck.id, newDriver, oldDriver);
      }

      toast.success("Camión y asignaciones actualizados");
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Error al actualizar el camión.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="bg-amber-100 p-2 rounded-xl text-amber-600">
              <Edit2 className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-black text-slate-800">
              Editar Vehículo
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
              Placa / Matrícula
            </label>
            <input
              type="text"
              required
              value={formData.licensePlate}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  licensePlate: e.target.value.toUpperCase(),
                })
              }
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none uppercase font-black text-slate-900"
            />
          </div>

          {/* MENÚS EN CASCADA: MARCA Y MODELO */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">
                Marca
              </label>
              <select
                required
                value={formData.brand}
                onChange={(e) =>
                  setFormData({ ...formData, brand: e.target.value, model: "" })
                }
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-700 uppercase"
              >
                <option value="">Seleccionar...</option>
                {config?.vehicleBrands.map((b) => (
                  <option key={b.id} value={b.name}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">
                Modelo
              </label>
              <select
                required
                disabled={!formData.brand}
                value={formData.model}
                onChange={(e) =>
                  setFormData({ ...formData, model: e.target.value })
                }
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-700 uppercase disabled:opacity-50"
              >
                <option value="">Seleccionar...</option>
                {config?.vehicleBrands
                  .find((b) => b.name === formData.brand)
                  ?.models.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">
                Año
              </label>
              <input
                type="number"
                required
                value={formData.year}
                onChange={(e) =>
                  setFormData({ ...formData, year: parseInt(e.target.value) })
                }
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none font-medium"
              />
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
                <option value="IN_MAINTENANCE">🟠 En Taller</option>
                <option value="INACTIVE">🔴 Inactivo (Baja)</option>
              </select>
            </div>
          </div>

          <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
            <label className="block text-sm font-black text-blue-900 mb-2 flex items-center gap-2">
              <User className="w-4 h-4" /> Chofer Asignado
            </label>
            <select
              value={formData.assignedDriverId}
              onChange={(e) =>
                setFormData({ ...formData, assignedDriverId: e.target.value })
              }
              className="w-full p-3 bg-white border border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-700"
            >
              <option value="">-- Sin Chofer Asignado --</option>
              {drivers.map((driver) => {
                // Está ocupado si tiene un camión que NO es el camión que estamos editando actualmente
                const isBusy = !!driver.truckId && driver.truckId !== truck.id;

                return (
                  <option
                    key={driver.uid}
                    value={driver.uid}
                    disabled={isBusy} // Bloquea choferes de otros camiones
                  >
                    {driver.displayName}{" "}
                    {isBusy ? `(Ocupado en ${driver.truckId})` : ""}
                  </option>
                );
              })}
            </select>
            <p className="text-xs text-blue-700 mt-2">
              Al seleccionar un chofer, el sistema sincronizará su cuenta móvil
              automáticamente.
            </p>
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
