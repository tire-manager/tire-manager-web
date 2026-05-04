// src/components/trucks/AssignDriverModal.tsx
"use client";
import React, { useState, useEffect } from "react";
import { X, UserCheck } from "lucide-react";
import { getDrivers } from "@/services/userService";
import { assignDriverToTruck } from "@/services/truckService";
import { UserProfile } from "@/types/user";

interface AssignDriverModalProps {
  isOpen: boolean;
  onClose: () => void;
  truckId: string;
  currentDriverId?: string | null;
  onSuccess: () => void;
}

export const AssignDriverModal: React.FC<AssignDriverModalProps> = ({
  isOpen,
  onClose,
  truckId,
  currentDriverId,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [drivers, setDrivers] = useState<UserProfile[]>([]);
  const [selectedDriverId, setSelectedDriverId] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      const loadDrivers = async () => {
        const driversList = await getDrivers();
        setDrivers(driversList);

        // Si ya hay un chofer asignado, lo pre-seleccionamos
        if (currentDriverId) {
          setSelectedDriverId(currentDriverId);
        } else if (driversList.length > 0) {
          setSelectedDriverId(driversList[0].uid);
        }
      };
      loadDrivers();
    }
  }, [isOpen, currentDriverId]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDriverId || selectedDriverId === currentDriverId) {
      onClose();
      return; // No hubo cambios
    }

    setLoading(true);
    setError("");

    try {
      await assignDriverToTruck(truckId, selectedDriverId, currentDriverId);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Error al asignar el chofer.");
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
              <UserCheck className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-slate-800">
              {currentDriverId ? "Cambiar Chofer" : "Asignar Chofer"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Selecciona un Chofer
            </label>
            <select
              required
              value={selectedDriverId}
              onChange={(e) => setSelectedDriverId(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
            >
              {drivers.length === 0 && (
                <option value="">No hay choferes registrados</option>
              )}
              {drivers.map((driver) => (
                <option key={driver.uid} value={driver.uid}>
                  {driver.displayName}{" "}
                  {driver.truckId
                    ? `(Actualmente en Camión ${driver.truckId})`
                    : "(Libre)"}
                </option>
              ))}
            </select>
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
              disabled={loading || drivers.length === 0}
              className="flex-1 px-4 py-3 text-white bg-blue-600 hover:bg-blue-700 font-semibold rounded-xl shadow-sm transition-all disabled:opacity-50"
            >
              {loading ? "Guardando..." : "Confirmar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
