// src/components/trucks/AssignTireModal.tsx
"use client";
import React, { useState, useEffect } from "react";
import { X, Wrench, AlertCircle } from "lucide-react";
import { getAvailableTires, assignTireToTruck } from "@/services/tireService";
import { Tire, TirePosition } from "@/types/tire";
import { getGlobalSettings, GlobalSettings } from "@/services/settingsService";

interface AssignTireModalProps {
  isOpen: boolean;
  onClose: () => void;
  truckId: string;
  onSuccess: () => void;
}

export const AssignTireModal: React.FC<AssignTireModalProps> = ({
  isOpen,
  onClose,
  truckId,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [fetchingTires, setFetchingTires] = useState(true);
  const [availableTires, setAvailableTires] = useState<Tire[]>([]);
  const [error, setError] = useState("");
  const [config, setConfig] = useState<GlobalSettings | null>(null);

  const [formData, setFormData] = useState({
    tireId: "",
    position: "FRONT_LEFT" as TirePosition,
    initialOdometer: "",
  });

  useEffect(() => {
    if (isOpen) {
      const loadConfig = async () => {
        const settings = await getGlobalSettings();
        setConfig(settings);

        // Si hay posiciones, seleccionamos la primera por defecto
        if (settings.positions.length > 0) {
          setFormData((prev) => ({
            ...prev,
            position: settings.positions[0] as any,
          }));
        }
      };
      loadConfig();
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      const loadTires = async () => {
        setFetchingTires(true);
        const tires = await getAvailableTires();
        setAvailableTires(tires);
        if (tires.length > 0) {
          setFormData((prev) => ({ ...prev, tireId: tires[0].id }));
        }
        setFetchingTires(false);
      };
      loadTires();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.tireId) return;

    setLoading(true);
    setError("");

    try {
      await assignTireToTruck(
        formData.tireId,
        truckId,
        formData.position,
        parseFloat(formData.initialOdometer),
      );
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Error al asignar el neumático.");
    } finally {
      setLoading(false);
    }
  };

  const positions: { value: TirePosition; label: string }[] = [
    { value: "FRONT_LEFT", label: "Delantero Izquierdo" },
    { value: "FRONT_RIGHT", label: "Delantero Derecho" },
    { value: "REAR_LEFT_OUTER", label: "Trasero Izquierdo (Exterior)" },
    { value: "REAR_LEFT_INNER", label: "Trasero Izquierdo (Interior)" },
    { value: "REAR_RIGHT_INNER", label: "Trasero Derecho (Interior)" },
    { value: "REAR_RIGHT_OUTER", label: "Trasero Derecho (Exterior)" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
              <Wrench className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-slate-800">
              Montar Neumático
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

          {fetchingTires ? (
            <div className="text-center py-4 text-slate-500 text-sm">
              Buscando stock disponible...
            </div>
          ) : availableTires.length === 0 ? (
            <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
              <p className="text-sm text-amber-800">
                No hay neumáticos en stock (`AVAILABLE`). Registra nuevos
                neumáticos en el Inventario antes de realizar asignaciones.
              </p>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Neumático Disponible
                </label>
                <select
                  required
                  value={formData.tireId}
                  onChange={(e) =>
                    setFormData({ ...formData, tireId: e.target.value })
                  }
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  {availableTires.map((tire) => (
                    <option key={tire.id} value={tire.id}>
                      {tire.serialNumber} - {tire.brand} {tire.model} (
                      {tire.currentTreadDepth}mm)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Posición en el Camión
                </label>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    Posición en el Camión
                  </label>
                  <select
                    required
                    value={formData.position}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        position: e.target.value as any,
                      })
                    }
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    {config?.positions.map((pos) => (
                      <option key={pos} value={pos}>
                        {pos.replace(/_/g, " ")}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* NUEVO CAMPO: Odómetro Inicial */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Odómetro Actual del Camión (KM)
                </label>
                <p className="text-xs text-slate-500 mb-2">
                  Kilometraje exacto al momento de instalar la llanta.
                </p>
                <input
                  type="number"
                  required
                  min="0"
                  value={formData.initialOdometer}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      initialOdometer: e.target.value,
                    })
                  }
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Ej: 145000"
                />
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
                  {loading ? "Asignando..." : "Asignar a Flota"}
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
};
