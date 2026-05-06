// src/components/inventory/AddTireModal.tsx
"use client";
import React, { useEffect, useState } from "react";
import { X, PackagePlus, MapPin } from "lucide-react";
import { addTire } from "@/services/tireService";
import { getGlobalSettings, GlobalSettings } from "@/services/settingsService";
import { getWarehouses, Warehouse } from "@/services/warehouseService"; // <-- NUEVA IMPORTACIÓN
import toast from "react-hot-toast";

interface AddTireModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AddTireModal: React.FC<AddTireModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState<GlobalSettings | null>(null);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]); // <-- ESTADO PARA ALMACENES

  const [formData, setFormData] = useState({
    serialNumber: "",
    brand: "",
    model: "",
    size: "",
    initialTreadDepth: "",
    price: "",
    currency: "PEN" as "PEN" | "USD",
    warehouseId: "", // <-- NUEVO CAMPO
  });

  // Cargar configuración global y almacenes al abrir el modal
  useEffect(() => {
    if (isOpen) {
      // Cargar Configuración de Llantas
      getGlobalSettings().then((data) => {
        setConfig(data);
        setFormData((prev) => ({
          ...prev,
          initialTreadDepth: data.defaultInitialDepth.toString(),
        }));
      });

      // Cargar Almacenes Operativos
      getWarehouses().then((data) => {
        // Filtramos para que solo se puedan seleccionar almacenes activos
        setWarehouses(data.filter((w) => w.status === "ACTIVE"));
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const depth = parseFloat(formData.initialTreadDepth);

    try {
      await toast.promise(
        addTire({
          serialNumber: formData.serialNumber.toUpperCase(),
          brand: formData.brand,
          model: formData.model,
          size: formData.size.toUpperCase(),
          initialTreadDepth: depth,
          currentTreadDepth: depth,
          price: parseFloat(formData.price) || 0,
          currency: formData.currency,
          warehouseId: formData.warehouseId, // <-- ENVIAMOS EL ALMACÉN
        }),
        {
          loading: "Registrando neumático...",
          success: "¡Neumático añadido al almacén!",
          error: "Error al registrar el neumático.",
        },
      );

      // Reset del formulario
      setFormData({
        serialNumber: "",
        brand: "",
        model: "",
        size: "",
        initialTreadDepth: config?.defaultInitialDepth.toString() || "12.0",
        price: "",
        currency: "PEN",
        warehouseId: "",
      });

      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error en submit:", error);
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
              <PackagePlus className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-black text-slate-800">
              Añadir Neumático
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
          {/* NÚMERO DE SERIE */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">
              Número de Serie (Folio)
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
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none uppercase font-mono font-bold"
              placeholder="Ej: SN-998877"
            />
          </div>

          {/* MARCA Y MODELO (Desde el maestro de datos) */}
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
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-medium"
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
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 font-medium"
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
          </div>

          {/* MEDIDA Y PROFUNDIDAD */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">
                Medida
              </label>
              <input
                type="text"
                required
                value={formData.size}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    size: e.target.value.toUpperCase(),
                  })
                }
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none uppercase font-medium"
                placeholder="Ej: 11R22.5"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">
                Profundidad (mm)
              </label>
              <input
                type="number"
                step="0.1"
                required
                value={formData.initialTreadDepth}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    initialTreadDepth: e.target.value,
                  })
                }
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none font-bold text-blue-600"
              />
            </div>
          </div>

          {/* NUEVO CAMPO: ALMACÉN DE DESTINO */}
          <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
            <label className="block text-sm font-black text-blue-900 mb-1 flex items-center gap-1.5">
              <MapPin className="w-4 h-4" /> Almacén de Ingreso
            </label>
            <select
              required
              value={formData.warehouseId}
              onChange={(e) =>
                setFormData({ ...formData, warehouseId: e.target.value })
              }
              className="w-full p-3 bg-white border border-blue-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-700 uppercase"
            >
              <option value="">-- Seleccionar Almacén --</option>
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          </div>

          {/* PRECIO Y MONEDA */}
          <div className="flex gap-4 p-4 bg-emerald-50 rounded-xl border border-emerald-100">
            <div className="flex-1">
              <label className="block text-sm font-black text-emerald-900 mb-1">
                Costo de Compra
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.price}
                onChange={(e) =>
                  setFormData({ ...formData, price: e.target.value })
                }
                className="w-full p-3 bg-white border border-emerald-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-mono font-bold"
                placeholder="0.00"
              />
            </div>
            <div className="w-1/3">
              <label className="block text-sm font-black text-emerald-900 mb-1">
                Moneda
              </label>
              <select
                value={formData.currency}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    currency: e.target.value as "PEN" | "USD",
                  })
                }
                className="w-full p-3 bg-white border border-emerald-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-bold text-emerald-800"
              >
                <option value="PEN">S/ (PEN)</option>
                <option value="USD">$ (USD)</option>
              </select>
            </div>
          </div>

          {/* BOTONES */}
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
              {loading ? "Guardando..." : "Guardar en Stock"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
