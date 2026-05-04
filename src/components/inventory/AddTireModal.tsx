// src/components/inventory/AddTireModal.tsx
"use client";
import React, { useEffect, useState } from "react";
import { X } from "lucide-react";
import { addTire } from "@/services/tireService";
import { getGlobalSettings, GlobalSettings } from "@/services/settingsService";

interface AddTireModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void; // Para recargar la tabla tras guardar
}

export const AddTireModal: React.FC<AddTireModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    serialNumber: "",
    brand: "",
    model: "",
    initialTreadDepth: "12.0", // Valor por defecto común para nuevos
    price: "",
  });
  const [config, setConfig] = useState<GlobalSettings | null>(null);

  useEffect(() => {
    getGlobalSettings().then(setConfig);
  }, []);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await addTire({
        ...formData,
        initialTreadDepth: parseFloat(formData.initialTreadDepth),
        price: parseFloat(formData.price),
      });
      onSuccess(); // Recarga los datos en la tabla padre
      onClose(); // Cierra el modal
    } catch (error) {
      alert("Error al guardar el neumático");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-6 border-b border-slate-100">
          <h2 className="text-xl font-bold text-slate-800">
            Añadir Nuevo Neumático
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
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
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Ej: SN-998877"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                Marca
              </label>
              <select
                required
                value={formData.brand}
                onChange={(e) =>
                  setFormData({ ...formData, brand: e.target.value, model: "" })
                }
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl"
              >
                <option value="">Seleccionar marca...</option>
                {config?.brands.map((b) => (
                  <option key={b.id} value={b.name}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                Modelo
              </label>
              <select
                required
                disabled={!formData.brand}
                value={formData.model}
                onChange={(e) =>
                  setFormData({ ...formData, model: e.target.value })
                }
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl disabled:opacity-50"
              >
                <option value="">Seleccionar modelo...</option>
                {config?.brands
                  .find((b) => b.name === formData.brand)
                  ?.models.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          {/* NUEVO CAMPO: Precio de Compra */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              Precio de Compra ($ o S/)
            </label>
            <input
              type="number"
              step="0.01"
              required
              value={formData.price}
              onChange={(e) =>
                setFormData({ ...formData, price: e.target.value })
              }
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Ej: 350.50"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              Profundidad Inicial (mm)
            </label>
            <input
              type="number"
              step="0.1"
              required
              value={formData.initialTreadDepth}
              onChange={(e) =>
                setFormData({ ...formData, initialTreadDepth: e.target.value })
              }
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
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
              {loading ? "Guardando..." : "Guardar en Stock"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
