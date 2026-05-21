// src/components/trucks/MassInspectionModal.tsx
"use client";
import React, { useState, useEffect } from "react";
import { X, Save, Gauge, Activity } from "lucide-react";
import { Tire } from "@/types/tire";
import { Truck } from "@/types/truck";
import { recordMassInspection } from "@/services/tireService";
import { useAuth } from "@/context/AuthContext";
import toast from "react-hot-toast";

interface MassInspectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  truck: Truck;
  mountedTires: Tire[];
}

export const MassInspectionModal: React.FC<MassInspectionModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  truck,
  mountedTires,
}) => {
  const { user } = useAuth();
  const [odometer, setOdometer] = useState<number | "">("");
  const [readings, setReadings] = useState<
    Record<string, { depth: string; pressure: string; notes: string }>
  >({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Inicializar el formulario cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      setOdometer(truck.currentOdometer || "");
      const initialReadings: any = {};

      // Ordenamos las llantas por posición (N1, N2, etc.)
      const sortedTires = [...mountedTires].sort((a, b) =>
        (a.position || "").localeCompare(b.position || ""),
      );

      sortedTires.forEach((t) => {
        initialReadings[t.id] = { depth: "", pressure: "", notes: "" };
      });
      setReadings(initialReadings);
    }
  }, [isOpen, truck, mountedTires]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!odometer || odometer <= (truck.currentOdometer || 0)) {
      return toast.error("El nuevo odómetro debe ser mayor al actual.");
    }

    const inspectionsToSave = mountedTires
      .map((t) => ({
        tireId: t.id,
        newTreadDepth: parseFloat(readings[t.id].depth),
        pressure: parseFloat(readings[t.id].pressure),
        notes: readings[t.id].notes || "Ok",
      }))
      .filter((insp) => !isNaN(insp.newTreadDepth)); // Solo procesa las filas que tengan remanente digitado

    if (inspectionsToSave.length === 0) {
      return toast.error("Ingresa al menos el remanente de una llanta.");
    }

    setIsSubmitting(true);
    const toastId = toast.loading("Registrando inspección masiva...");
    try {
      await recordMassInspection(
        truck.id,
        user!.uid, // Trazabilidad: ID del Administrador que digitó
        Number(odometer),
        inspectionsToSave,
      );
      toast.success("Hoja de inspección registrada con éxito", { id: toastId });
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.message || "Error al guardar", { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Llantas ordenadas para la tabla
  const sortedTires = [...mountedTires].sort((a, b) =>
    (a.position || "").localeCompare(b.position || ""),
  );

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <div className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-5 border-b border-slate-100 bg-slate-50 flex justify-between items-center shrink-0">
          <div>
            <h3 className="font-black text-slate-800 flex items-center gap-2 text-lg">
              <Activity className="w-5 h-5 text-blue-600" /> Digitar Hoja de
              Inspección
            </h3>
            <p className="text-xs font-bold text-slate-400 mt-1 uppercase">
              UNIDAD: {truck.licensePlate}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 bg-white rounded-xl shadow-sm text-slate-400 hover:text-slate-600 border border-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col flex-1 overflow-hidden"
        >
          <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-6">
            {/* ODÓMETRO GLOBAL */}
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 flex gap-6 items-center">
              <div className="bg-blue-100 p-3 rounded-xl shrink-0">
                <Gauge className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-black text-slate-500 uppercase mb-1">
                  Odómetro de la Hoja (KM / HRS)
                </label>
                <input
                  type="number"
                  required
                  value={odometer}
                  onChange={(e) =>
                    setOdometer(e.target.value ? Number(e.target.value) : "")
                  }
                  className="w-full max-w-xs p-3 bg-white border border-slate-300 rounded-xl font-mono font-black text-lg outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-[10px] text-slate-400 font-bold mt-1">
                  KM Anterior: {truck.currentOdometer}
                </p>
              </div>
            </div>

            {/* TABLA TIPO EXCEL */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden">
              <table className="w-full text-left bg-white">
                <thead className="bg-slate-800 text-white text-[10px] uppercase font-black tracking-widest">
                  <tr>
                    <th className="px-4 py-3 text-center">POS</th>
                    <th className="px-4 py-3">Serie / Diseño</th>
                    <th className="px-4 py-3 w-32 text-center">
                      Remanente (mm)
                    </th>
                    <th className="px-4 py-3 w-32 text-center">
                      Presión (PSI)
                    </th>
                    <th className="px-4 py-3">Observaciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {sortedTires.map((tire) => (
                    <tr
                      key={tire.id}
                      className="hover:bg-blue-50/30 transition-colors"
                    >
                      <td className="px-4 py-2 text-center">
                        <span className="bg-slate-100 text-slate-600 font-black px-2 py-1 rounded text-xs">
                          {tire.position || "-"}
                        </span>
                      </td>
                      <td className="px-4 py-2">
                        <p className="font-black text-blue-600">
                          {tire.serialNumber}
                        </p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">
                          {tire.brand} {tire.model}
                        </p>
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="number"
                          step="0.1"
                          placeholder="mm"
                          value={readings[tire.id]?.depth}
                          onChange={(e) =>
                            setReadings({
                              ...readings,
                              [tire.id]: {
                                ...readings[tire.id],
                                depth: e.target.value,
                              },
                            })
                          }
                          className="w-full p-2 text-center bg-slate-50 border border-slate-200 rounded-lg font-mono font-black focus:bg-white focus:border-blue-500 outline-none"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="number"
                          placeholder="PSI"
                          value={readings[tire.id]?.pressure}
                          onChange={(e) =>
                            setReadings({
                              ...readings,
                              [tire.id]: {
                                ...readings[tire.id],
                                pressure: e.target.value,
                              },
                            })
                          }
                          className="w-full p-2 text-center bg-slate-50 border border-slate-200 rounded-lg font-mono font-black focus:bg-white focus:border-blue-500 outline-none"
                        />
                      </td>
                      <td className="px-4 py-2">
                        <input
                          type="text"
                          placeholder="Opcional..."
                          value={readings[tire.id]?.notes}
                          onChange={(e) =>
                            setReadings({
                              ...readings,
                              [tire.id]: {
                                ...readings[tire.id],
                                notes: e.target.value,
                              },
                            })
                          }
                          className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-medium text-xs focus:bg-white focus:border-blue-500 outline-none"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="p-5 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-2.5 text-sm font-black text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md transition-all uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4" />{" "}
              {isSubmitting ? "Guardando..." : "Guardar Inspección"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
