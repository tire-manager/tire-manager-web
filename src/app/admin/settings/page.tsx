// src/app/admin/settings/page.tsx
"use client";
import React, { useEffect, useState } from "react";
import {
  Save,
  Settings as SettingsIcon,
  ShieldAlert,
  Ruler,
  X,
} from "lucide-react";
import {
  getGlobalSettings,
  updateGlobalSettings,
  GlobalSettings,
  Brand,
} from "@/services/settingsService";
import toast from "react-hot-toast";

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [settings, setSettings] = useState<GlobalSettings>({
    criticalWearLimit: 3.0,
    defaultInitialDepth: 12.0,
    alertEmail: "",
    brands: [],
    positions: [],
  });

  useEffect(() => {
    async function load() {
      const data = await getGlobalSettings();
      setSettings(data);
      setLoading(false);
    }
    load();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    // 2. Usamos toast.promise para que muestre automáticamente el estado de carga, éxito o error
    try {
      await toast.promise(updateGlobalSettings(settings), {
        loading: "Guardando configuración...",
        success: "¡Cambios guardados con éxito!",
        error: "Hubo un problema al guardar.",
      });
    } catch (error) {
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const addBrand = () => {
    const name = prompt("Nombre de la nueva marca:");
    if (name) {
      const newBrand: Brand = { id: Date.now().toString(), name, models: [] };
      setSettings({ ...settings, brands: [...settings.brands, newBrand] });
    }
  };

  const addModel = (brandId: string) => {
    const modelName = prompt("Nombre del modelo:");
    if (modelName) {
      const updatedBrands = settings.brands.map((b) =>
        b.id === brandId ? { ...b, models: [...b.models, modelName] } : b,
      );
      setSettings({ ...settings, brands: updatedBrands });
    }
  };

  const addPosition = () => {
    const pos = prompt("Nombre de la nueva posición (ej: Eje 3 Izquierdo):");
    if (pos && !settings.positions.includes(pos)) {
      setSettings({ ...settings, positions: [...settings.positions, pos] });
    }
  };

  const removePosition = (posToRemove: string) => {
    if (confirm(`¿Eliminar la posición "${posToRemove}"?`)) {
      setSettings({
        ...settings,
        positions: settings.positions.filter((p) => p !== posToRemove),
      });
    }
  };

  if (loading)
    return <div className="p-8 text-slate-500">Cargando preferencias...</div>;

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <SettingsIcon className="w-6 h-6 text-slate-600" />
          Configuración del Sistema
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Define las reglas de negocio y alertas globales.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 space-y-6">
            {/* Parámetro: Límite de Desgaste */}
            <div className="flex items-start gap-4">
              <div className="bg-red-100 p-2 rounded-lg text-red-600">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-bold text-slate-700">
                  Límite de Desgaste Crítico (mm)
                </label>
                <p className="text-xs text-slate-500 mb-2">
                  Define cuándo un neumático aparece en la lista de Alerta Roja.
                </p>
                <input
                  type="number"
                  step="0.1"
                  value={settings.criticalWearLimit}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      criticalWearLimit: parseFloat(e.target.value),
                    })
                  }
                  className="w-32 p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold"
                />
              </div>
            </div>

            <hr className="border-slate-100" />

            {/* Parámetro: Profundidad Inicial */}
            <div className="flex items-start gap-4">
              <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
                <Ruler className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-bold text-slate-700">
                  Profundidad Inicial por Defecto (mm)
                </label>
                <p className="text-xs text-slate-500 mb-2">
                  Valor sugerido al registrar nuevos neumáticos.
                </p>
                <input
                  type="number"
                  step="0.1"
                  value={settings.defaultInitialDepth}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      defaultInitialDepth: parseFloat(e.target.value),
                    })
                  }
                  className="w-32 p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold"
                />
              </div>
            </div>
          </div>

          <div className="p-6 bg-white rounded-2xl shadow-sm border border-slate-200 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-slate-800">
                Catálogo de Marcas y Modelos
              </h3>
              <button
                type="button"
                onClick={addBrand}
                className="text-sm text-blue-600 font-bold"
              >
                + Añadir Marca
              </button>
            </div>

            <div className="space-y-3">
              {settings.brands.map((brand) => (
                <div
                  key={brand.id}
                  className="p-4 bg-slate-50 rounded-xl border border-slate-100"
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-bold text-slate-700">
                      {brand.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => addModel(brand.id)}
                      className="text-xs bg-slate-200 px-2 py-1 rounded"
                    >
                      + Modelo
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {brand.models.map((m, idx) => (
                      <span
                        key={idx}
                        className="text-xs bg-white border border-slate-200 px-2 py-1 rounded text-slate-600"
                      >
                        {m}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-6 bg-white rounded-2xl shadow-sm border border-slate-200 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <Ruler className="w-5 h-5 text-slate-400" />
                Esquema de Posiciones
              </h3>
              <button
                type="button"
                onClick={addPosition}
                className="text-sm text-blue-600 font-bold hover:underline"
              >
                + Añadir Posición
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Estas posiciones aparecerán al momento de asignar neumáticos a un
              vehículo.
            </p>

            <div className="flex flex-wrap gap-2">
              {settings.positions.map((pos) => (
                <div
                  key={pos}
                  className="flex items-center gap-2 bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-lg text-sm text-slate-700"
                >
                  <span>{pos.replace(/_/g, " ")}</span>
                  <button
                    type="button"
                    onClick={() => removePosition(pos)}
                    className="text-slate-400 hover:text-red-500 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-blue-700 transition-all disabled:opacity-50 shadow-md"
            >
              <Save className="w-4 h-4" />
              {saving ? "Guardando..." : "Guardar Configuración"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
