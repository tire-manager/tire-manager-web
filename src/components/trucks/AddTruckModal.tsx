// src/components/trucks/AddTruckModal.tsx
"use client";
import React, { useState } from "react";
import { X, Truck as TruckIcon } from "lucide-react";
import { addTruck } from "@/services/truckService";

interface AddTruckModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AddTruckModal: React.FC<AddTruckModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    licensePlate: "",
    brand: "",
    model: "",
    year: new Date().getFullYear(),
    status: "ACTIVE" as "ACTIVE" | "IN_MAINTENANCE" | "INACTIVE",
    assignedDriverId: null, // Al crearlo, entra sin chofer asignado
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await addTruck({
        licensePlate: formData.licensePlate.toUpperCase(),
        brand: formData.brand,
        model: formData.model,
        year: formData.year,
        status: formData.status,
        assignedDriverId: formData.assignedDriverId,
      });

      onSuccess();
      onClose();
      // Reset form
      setFormData({
        licensePlate: "",
        brand: "",
        model: "",
        year: new Date().getFullYear(),
        status: "ACTIVE",
        assignedDriverId: null,
      });
    } catch (err: any) {
      setError(err.message || "Error al registrar el camión.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
              <TruckIcon className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-slate-800">
              Registrar Vehículo
            </h2>
          </div>
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
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none uppercase placeholder:normal-case"
              placeholder="Ej: ABC-1234"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                Marca
              </label>
              <input
                type="text"
                required
                value={formData.brand}
                onChange={(e) =>
                  setFormData({ ...formData, brand: e.target.value })
                }
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Ej: Volvo"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                Modelo
              </label>
              <input
                type="text"
                required
                value={formData.model}
                onChange={(e) =>
                  setFormData({ ...formData, model: e.target.value })
                }
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Ej: FH16"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                Año
              </label>
              <input
                type="number"
                required
                min="1990"
                max={new Date().getFullYear() + 1}
                value={formData.year}
                onChange={(e) =>
                  setFormData({ ...formData, year: parseInt(e.target.value) })
                }
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                Estado Inicial
              </label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value as any })
                }
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="ACTIVE">Activo</option>
                <option value="IN_MAINTENANCE">En Taller</option>
                <option value="INACTIVE">Inactivo</option>
              </select>
            </div>
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
              {loading ? "Guardando..." : "Registrar Camión"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
