// src/components/inventory/TireFormModal.tsx
"use client";
import React, { useState, useEffect } from "react";
import {
  X,
  PackagePlus,
  Edit2,
  MapPin,
  ShieldAlert,
  DollarSign,
} from "lucide-react";
import { addTire, updateTire } from "@/services/tireService";
import { getGlobalSettings, GlobalSettings } from "@/services/settingsService";
import { getWarehouses, Warehouse } from "@/services/warehouseService";
import { useAuth } from "@/context/AuthContext";
import { Tire } from "@/types/tire";
import toast from "react-hot-toast";

interface TireFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  tire?: Tire | null; // MODO EDICIÓN si se envía la llanta, MODO CREACIÓN si es null/undefined
}

export const TireFormModal: React.FC<TireFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  tire,
}) => {
  const { profile } = useAuth(); // Identificamos a la empresa del SaaS
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState<GlobalSettings | null>(null);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);

  const isEditMode = !!tire;

  const [formData, setFormData] = useState({
    serialNumber: "",
    brand: "",
    model: "",
    size: "",
    initialTreadDepth: "", // Solo Creación
    price: "",
    currency: "PEN" as "PEN" | "USD",
    warehouseId: "", // Solo Creación
    historicalKm: "0",
  });

  useEffect(() => {
    if (isOpen) {
      // 1. Cargar Configuración Global
      getGlobalSettings(profile?.companyId as string).then((data) => {
        setConfig(data);
        if (!isEditMode) {
          setFormData((prev) => ({
            ...prev,
            initialTreadDepth: data.defaultInitialDepth.toString(),
          }));
        }
      });

      // 2. Cargar Almacenes (Solo necesario al crear para ubicar la llanta)
      if (!isEditMode) {
        getWarehouses(profile?.companyId as string).then((data) => {
          setWarehouses(data.filter((w) => w.status === "ACTIVE"));
        });
      }

      // 3. Pre-cargar datos si es Edición o limpiar si es Creación
      if (isEditMode && tire) {
        setFormData({
          serialNumber: tire.serialNumber || "",
          brand: tire.brand || "",
          model: tire.model || "",
          size: tire.size || "",
          initialTreadDepth: tire.initialTreadDepth.toString(),
          price: tire.price?.toString() || "0",
          currency: tire.currency || "PEN",
          warehouseId: tire.warehouseId || "",
          historicalKm: tire.historicalKm?.toString() || "0",
        });
      } else {
        setFormData({
          serialNumber: "",
          brand: "",
          model: "",
          size: "",
          initialTreadDepth: config?.defaultInitialDepth.toString() || "12.0",
          price: "",
          currency: "PEN",
          warehouseId: "",
          historicalKm: "0",
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, tire, isEditMode]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!profile?.companyId) {
      return toast.error("Error crítico: Empresa no identificada");
    }

    setLoading(true);
    const toastId = toast.loading(
      isEditMode ? "Actualizando neumático..." : "Registrando neumático...",
    );

    try {
      if (isEditMode && tire) {
        // --- LÓGICA DE EDICIÓN ---
        await updateTire(tire.id, {
          serialNumber: formData.serialNumber.toUpperCase(),
          brand: formData.brand.toUpperCase(),
          model: formData.model.toUpperCase(),
          size: formData.size.toUpperCase(),
          price: parseFloat(formData.price) || 0,
          currency: formData.currency,
          historicalKm: parseInt(formData.historicalKm) || 0,
        });
        toast.success("Información del neumático actualizada", { id: toastId });
      } else {
        // --- LÓGICA DE CREACIÓN ---
        const depth = parseFloat(formData.initialTreadDepth);
        await addTire(
          {
            serialNumber: formData.serialNumber.toUpperCase(),
            brand: formData.brand.toUpperCase(),
            model: formData.model.toUpperCase(),
            size: formData.size.toUpperCase(),
            initialTreadDepth: depth,
            currentTreadDepth: depth, // Al crear, el actual es igual al inicial
            price: parseFloat(formData.price) || 0,
            currency: formData.currency,
            warehouseId: formData.warehouseId,
            historicalKm: parseInt(formData.historicalKm) || 0,
          },
          profile.companyId,
        ); // Inyectamos la empresa SaaS
        toast.success("¡Neumático añadido al inventario!", { id: toastId });
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Error al procesar la solicitud.", {
        id: toastId,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        {/* CABECERA DINÁMICA */}
        <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-xl ${isEditMode ? "bg-amber-100 text-amber-600" : "bg-blue-100 text-blue-600"}`}
            >
              {isEditMode ? (
                <Edit2 className="w-5 h-5" />
              ) : (
                <PackagePlus className="w-5 h-5" />
              )}
            </div>
            <h2 className="text-xl font-black text-slate-800">
              {isEditMode ? "Editar Neumático" : "Añadir Neumático"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 bg-white p-2 rounded-full shadow-sm transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* BANNER DE RESTRICCIÓN (Solo visible en Edición) */}
        {isEditMode && tire && (
          <div className="bg-amber-50 border-y border-amber-100 p-4 flex gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-amber-800">
                Edición Restringida
              </p>
              <p className="text-xs text-amber-700 mt-1">
                Por auditoría, el desgaste actual ({tire.currentTreadDepth} mm)
                y su estado logístico solo pueden ser modificados mediante el
                registro de una inspección o movimiento.
              </p>
            </div>
          </div>
        )}

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

          {/* MARCA Y MODELO */}
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
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-medium uppercase"
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
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 font-medium uppercase"
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

          {/* MEDIDA Y KM PREVIOS */}
          <div
            className={`grid ${isEditMode ? "grid-cols-2" : "grid-cols-3"} gap-3`}
          >
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1 uppercase">
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
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none uppercase text-sm font-bold"
                placeholder="295/80R22.5"
              />
            </div>

            {/* Solo pedimos Profundidad Inicial si la llanta es Nueva (Creación) */}
            {!isEditMode && (
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1 uppercase">
                  Prof. (mm)
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
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm font-black text-blue-600"
                />
              </div>
            )}

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1 uppercase text-amber-700">
                KM Previos
              </label>
              <input
                type="number"
                min="0"
                value={formData.historicalKm}
                onChange={(e) =>
                  setFormData({ ...formData, historicalKm: e.target.value })
                }
                className="w-full p-3 bg-amber-50 border border-amber-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-amber-500 outline-none text-sm font-black text-amber-700 placeholder-amber-300"
                placeholder="0"
              />
            </div>
          </div>

          {/* ALMACÉN DE DESTINO (Solo al crear) */}
          {!isEditMode && (
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
          )}

          {/* PRECIO Y MONEDA */}
          <div className="flex gap-4 p-4 bg-emerald-50 rounded-xl border border-emerald-100">
            <div className="flex-1">
              <label className="block text-sm font-black text-emerald-900 mb-1">
                Costo de Adquisición
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

          {/* BOTONES ACCIÓN */}
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
              className={`flex-1 px-4 py-3 text-white font-black rounded-xl shadow-lg transition-all disabled:opacity-50 flex justify-center items-center ${isEditMode ? "bg-amber-600 hover:bg-amber-700 shadow-amber-600/30" : "bg-blue-600 hover:bg-blue-700 shadow-blue-600/30"}`}
            >
              {loading
                ? "Procesando..."
                : isEditMode
                  ? "Guardar Cambios"
                  : "Guardar en Stock"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
