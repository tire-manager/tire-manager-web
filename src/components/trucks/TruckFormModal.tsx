// src/components/trucks/TruckFormModal.tsx
"use client";
import React, { useState, useEffect } from "react";
import { X, Truck as TruckIcon, Edit2 } from "lucide-react";
import { addTruck, updateTruck } from "@/services/truckService";
import { getGlobalSettings, GlobalSettings } from "@/services/settingsService";
import { useAuth } from "@/context/AuthContext";
import { Truck } from "@/types/truck";
import toast from "react-hot-toast";

interface TruckFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  truck?: Truck | null; // Si enviamos el camión, es MODO EDICIÓN. Si es null, es MODO CREACIÓN.
}

export const TruckFormModal: React.FC<TruckFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  truck,
}) => {
  const { profile } = useAuth(); // <-- Obtenemos la empresa del Admin logueado

  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState<GlobalSettings | null>(null);

  const isEditMode = !!truck;

  const [formData, setFormData] = useState({
    licensePlate: "",
    brand: "",
    model: "",
    year: new Date().getFullYear(),
    status: "ACTIVE" as Truck["status"],
    axleConfig: "3_EJES_10_LLANTAS" as Truck["axleConfig"],
    initialOdometer: "", // Solo se usa al crear
  });

  useEffect(() => {
    if (isOpen) {
      getGlobalSettings(profile?.companyId as string).then(setConfig);

      // Si estamos en modo edición, precargamos los datos
      if (truck) {
        setFormData({
          licensePlate: truck.licensePlate,
          brand: truck.brand || "",
          model: truck.model || "",
          year: truck.year,
          status: truck.status,
          axleConfig: truck.axleConfig || "3_EJES_10_LLANTAS",
          initialOdometer: truck.currentOdometer?.toString() || "0",
        });
      } else {
        // Si es creación, limpiamos el formulario
        setFormData({
          licensePlate: "",
          brand: "",
          model: "",
          year: new Date().getFullYear(),
          status: "ACTIVE",
          axleConfig: "3_EJES_10_LLANTAS",
          initialOdometer: "",
        });
      }
    }
  }, [isOpen, truck]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    console.log("Submitting form with data:", profile, formData); // <-- Debugging
    e.preventDefault();
    if (!profile?.companyId)
      return toast.error("Error crítico: Empresa no identificada");

    setLoading(true);
    const toastId = toast.loading(
      isEditMode ? "Actualizando vehículo..." : "Registrando vehículo...",
    );

    try {
      const truckData = {
        licensePlate: formData.licensePlate.toUpperCase(),
        brand: formData.brand.toUpperCase(),
        model: formData.model.toUpperCase(),
        year: formData.year,
        status: formData.status,
        axleConfig: formData.axleConfig,
      };

      if (isEditMode) {
        // EDICIÓN
        await updateTruck(truck.id, truckData);
        toast.success("Vehículo actualizado con éxito", { id: toastId });
      } else {
        // CREACIÓN (Inyectamos companyId y Odómetro Inicial)
        await addTruck({
          ...truckData,
          companyId: profile.companyId, // <-- Magia SaaS Multi-empresa
          currentOdometer: parseFloat(formData.initialOdometer) || 0,
          assignedDriverId: null, // Ya no usamos choferes
        });
        toast.success("Vehículo registrado con éxito", { id: toastId });
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
                <TruckIcon className="w-5 h-5" />
              )}
            </div>
            <h2 className="text-xl font-black text-slate-800">
              {isEditMode ? "Editar Vehículo" : "Registrar Vehículo"}
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
              placeholder="Ej: ABC-1234"
            />
          </div>

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
                min="1990"
                max={new Date().getFullYear() + 1}
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
                <option value="INACTIVE">🔴 Inactivo</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">
                Config. de Ejes
              </label>
              <select
                required
                value={formData.axleConfig}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    axleConfig: e.target.value as any,
                  })
                }
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none font-medium text-xs"
              >
                <option value="2_EJES">2 EJES</option>
                <option value="3_EJES_10_LLANTAS">3 EJES (10 Llantas)</option>
                <option value="3_EJES_BALON">3 EJES BALÓN</option>
                <option value="3_EJES_12_LLANTAS">3 EJES (12 Llantas)</option>
                <option value="4_EJES">4 EJES</option>
              </select>
            </div>

            {/* Solo mostramos el Odómetro inicial si estamos CREANDO un camión */}
            {!isEditMode && (
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">
                  Odómetro (KM)
                </label>
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
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none font-mono font-bold"
                  placeholder="Ej: 15000"
                />
              </div>
            )}
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
                  : "Registrar Camión"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
