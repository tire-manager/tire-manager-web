// src/components/inventory/EditTireModal.tsx
"use client";
import React, { useState, useEffect } from "react";
import { X, Edit2, ShieldAlert, DollarSign } from "lucide-react";
import { updateTire } from "@/services/tireService";
import { getGlobalSettings, GlobalSettings } from "@/services/settingsService";
import { Tire } from "@/types/tire";
import toast from "react-hot-toast";

interface EditTireModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  tire: Tire | null;
}

export const EditTireModal: React.FC<EditTireModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  tire,
}) => {
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState<GlobalSettings | null>(null);

  const [formData, setFormData] = useState({
    serialNumber: "",
    brand: "",
    model: "",
    size: "",
    price: 0,
    currency: "PEN" as "PEN" | "USD",
    historicalKm: 0, // <-- NUEVO ESTADO
  });

  useEffect(() => {
    if (isOpen) {
      getGlobalSettings().then(setConfig);
    }

    if (tire && isOpen) {
      setFormData({
        serialNumber: tire.serialNumber || "",
        brand: tire.brand || "",
        model: tire.model || "",
        size: tire.size || "",
        price: tire.price || 0,
        currency: tire.currency || "PEN",
        historicalKm: tire.historicalKm || 0, // <-- CARGAMOS EL DATO PREVIO
      });
    }
  }, [tire, isOpen]);

  if (!isOpen || !tire) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await updateTire(tire.id, {
        serialNumber: formData.serialNumber.toUpperCase(),
        brand: formData.brand.toUpperCase(),
        model: formData.model.toUpperCase(),
        size: formData.size.toUpperCase(),
        price: formData.price,
        currency: formData.currency,
        historicalKm: formData.historicalKm, // <-- ACTUALIZAMOS EN FIRESTORE
      });

      toast.success("Información del neumático actualizada");
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Error al actualizar.");
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
              Editar Neumático
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 bg-white p-2 rounded-full shadow-sm transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* BANNER DE RESTRICCIÓN LOGÍSTICA */}
        <div className="bg-amber-50 border-y border-amber-100 p-4 flex gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-amber-800">
              Edición Restringida
            </p>
            <p className="text-xs text-amber-700 mt-1">
              Por motivos de auditoría, el desgaste actual (
              {tire.currentTreadDepth} mm) y su estado logístico solo pueden ser
              modificados mediante el registro de una inspección.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-bold text-slate-700 mb-1">
                Número de Serie
              </label>
              <input
                type="text"
                required
                value={formData.serialNumber}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    serialNumber: e.target.value.toUpperCase(),
                  })
                }
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none uppercase font-black text-slate-900"
              />
            </div>

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
                {config?.tireBrands.map((b) => (
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
                {config?.tireBrands
                  .find((b) => b.name === formData.brand)
                  ?.models.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
              </select>
            </div>

            {/* SEPARAMOS MEDIDA Y KM PREVIOS AQUÍ */}
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">
                Medida
              </label>
              <input
                type="text"
                required
                value={formData.size}
                onChange={(e) =>
                  setFormData({ ...formData, size: e.target.value })
                }
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none uppercase font-medium"
                placeholder="Ej: 295/80R22.5"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-amber-700 mb-1">
                KM Previos
              </label>
              <input
                type="number"
                min="0"
                value={formData.historicalKm}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    historicalKm: parseInt(e.target.value) || 0,
                  })
                }
                className="w-full p-3 bg-amber-50 border border-amber-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-amber-500 outline-none font-bold text-amber-800"
              />
            </div>
          </div>

          <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
            <label className="block text-sm font-black text-emerald-900 mb-2 flex items-center gap-2">
              <DollarSign className="w-4 h-4" /> Costo de Adquisición
            </label>
            <div className="flex gap-3">
              <select
                value={formData.currency}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    currency: e.target.value as "PEN" | "USD",
                  })
                }
                className="w-1/3 p-3 bg-white border border-emerald-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-bold text-emerald-800"
              >
                <option value="PEN">Soles (S/)</option>
                <option value="USD">Dólares ($)</option>
              </select>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={formData.price}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    price: parseFloat(e.target.value) || 0,
                  })
                }
                className="w-2/3 p-3 bg-white border border-emerald-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-mono font-bold text-slate-900"
                placeholder="0.00"
              />
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
