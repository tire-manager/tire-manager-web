// src/app/admin/settings/page.tsx
"use client";
import React, { useEffect, useState } from "react";
import {
  Save,
  Settings as SettingsIcon,
  ShieldAlert,
  Ruler,
  Truck,
  CircleDot,
} from "lucide-react";
import {
  getGlobalSettings,
  updateGlobalSettings,
  Brand,
} from "@/services/settingsService";
import toast from "react-hot-toast";
import { useAuth } from "@/context/AuthContext";

export default function SettingsPage() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Estado limpio: Solo parámetros operativos
  const [settings, setSettings] = useState<any>({
    criticalWearLimit: 3.0,
    defaultInitialDepth: 12.0,
    tireBrands: [],
    vehicleBrands: [],
  });

  useEffect(() => {
    async function load() {
      if (!profile?.companyId) return;

      const data = await getGlobalSettings(profile.companyId);
      setSettings({
        criticalWearLimit: data?.criticalWearLimit || 3.0,
        defaultInitialDepth: data?.defaultInitialDepth || 12.0,
        tireBrands: data?.tireBrands || [],
        vehicleBrands: data?.vehicleBrands || [],
      });
      setLoading(false);
    }
    load();
  }, [profile]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.companyId) return toast.error("Error de sesión");

    setSaving(true);
    try {
      await toast.promise(updateGlobalSettings(profile.companyId, settings), {
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

  // Función unificada para añadir marcas
  const addBrand = (type: "tire" | "vehicle") => {
    const name = prompt(
      type === "tire"
        ? "Nombre de la marca de LLANTA:"
        : "Nombre de la marca de VEHÍCULO:",
    );
    if (name) {
      const newBrand: Brand = {
        id: Date.now().toString(),
        name: name.toUpperCase(),
        models: [],
      };

      if (type === "tire") {
        setSettings({
          ...settings,
          tireBrands: [...settings.tireBrands, newBrand],
        });
      } else {
        setSettings({
          ...settings,
          vehicleBrands: [...settings.vehicleBrands, newBrand],
        });
      }
    }
  };

  // Función unificada para añadir modelos
  const addModel = (type: "tire" | "vehicle", brandId: string) => {
    const modelName = prompt("Nombre del modelo:");
    if (modelName) {
      const targetList =
        type === "tire" ? settings.tireBrands : settings.vehicleBrands;

      const updatedBrands = targetList.map((b: Brand) =>
        b.id === brandId
          ? { ...b, models: [...b.models, modelName.toUpperCase()] }
          : b,
      );

      if (type === "tire") {
        setSettings({ ...settings, tireBrands: updatedBrands });
      } else {
        setSettings({ ...settings, vehicleBrands: updatedBrands });
      }
    }
  };

  if (loading)
    return (
      <div className="p-8 text-slate-500 font-bold">
        Cargando preferencias operativas...
      </div>
    );

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <SettingsIcon className="w-6 h-6 text-slate-600" />
          Configuración Operativa
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Administra las reglas de desgaste de tu flota y los catálogos
          maestros.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 space-y-6">
            <h3 className="font-bold text-slate-800 border-b border-slate-100 pb-2">
              Reglas de Taller y Desgaste
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-start gap-4">
                <div className="bg-red-100 p-3 rounded-lg text-red-600">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-bold text-slate-700">
                    Límite de Desgaste Crítico
                  </label>
                  <p className="text-xs text-slate-500 mb-2">
                    Umbral rojo para alertas automáticas.
                  </p>
                  <div className="flex items-center gap-2">
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
                      className="w-24 p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold"
                    />
                    <span className="text-slate-500 font-bold text-sm">mm</span>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="bg-blue-100 p-3 rounded-lg text-blue-600">
                  <Ruler className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-bold text-slate-700">
                    Profundidad Inicial Base
                  </label>
                  <p className="text-xs text-slate-500 mb-2">
                    Valor sugerido al ingresar llantas.
                  </p>
                  <div className="flex items-center gap-2">
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
                      className="w-24 p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold"
                    />
                    <span className="text-slate-500 font-bold text-sm">mm</span>
                  </div>
                </div>
              </div>
            </div>

            {/* SECCIÓN DE CATÁLOGOS DIVIDIDA */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-slate-100">
              {/* CATÁLOGO DE LLANTAS */}
              <div className="space-y-4">
                <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <h4 className="font-black text-sm text-slate-800 flex items-center gap-2">
                    <CircleDot className="w-5 h-5 text-emerald-600" /> Marcas de
                    Llantas
                  </h4>
                  <button
                    type="button"
                    onClick={() => addBrand("tire")}
                    className="text-xs bg-white border border-slate-200 shadow-sm text-slate-700 hover:bg-slate-50 px-3 py-1.5 rounded-lg font-bold transition-colors"
                  >
                    + Añadir Marca
                  </button>
                </div>
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                  {settings.tireBrands.map((brand: Brand) => (
                    <div
                      key={brand.id}
                      className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm"
                    >
                      <div className="flex justify-between items-center mb-3">
                        <span className="font-black text-slate-700 uppercase">
                          {brand.name}
                        </span>
                        <button
                          type="button"
                          onClick={() => addModel("tire", brand.id)}
                          className="text-[10px] uppercase tracking-wider bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md font-bold hover:bg-slate-200 transition-colors"
                        >
                          + Modelo
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {brand.models.map((m: string, idx: number) => (
                          <span
                            key={idx}
                            className="text-xs bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-md text-emerald-700 font-bold uppercase"
                          >
                            {m}
                          </span>
                        ))}
                        {brand.models.length === 0 && (
                          <span className="text-xs text-slate-400 italic">
                            Sin modelos
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* CATÁLOGO DE VEHÍCULOS */}
              <div className="space-y-4">
                <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <h4 className="font-black text-sm text-slate-800 flex items-center gap-2">
                    <Truck className="w-5 h-5 text-blue-600" /> Marcas de Flota
                  </h4>
                  <button
                    type="button"
                    onClick={() => addBrand("vehicle")}
                    className="text-xs bg-white border border-slate-200 shadow-sm text-slate-700 hover:bg-slate-50 px-3 py-1.5 rounded-lg font-bold transition-colors"
                  >
                    + Añadir Marca
                  </button>
                </div>
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                  {settings.vehicleBrands.map((brand: Brand) => (
                    <div
                      key={brand.id}
                      className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm"
                    >
                      <div className="flex justify-between items-center mb-3">
                        <span className="font-black text-slate-700 uppercase">
                          {brand.name}
                        </span>
                        <button
                          type="button"
                          onClick={() => addModel("vehicle", brand.id)}
                          className="text-[10px] uppercase tracking-wider bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md font-bold hover:bg-slate-200 transition-colors"
                        >
                          + Modelo
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {brand.models.map((m: string, idx: number) => (
                          <span
                            key={idx}
                            className="text-xs bg-blue-50 border border-blue-100 px-2.5 py-1 rounded-md text-blue-700 font-bold uppercase"
                          >
                            {m}
                          </span>
                        ))}
                        {brand.models.length === 0 && (
                          <span className="text-xs text-slate-400 italic">
                            Sin modelos
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end items-center">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 bg-blue-600 text-white px-8 py-3 rounded-xl font-black hover:bg-blue-700 transition-all disabled:opacity-50 shadow-lg shadow-blue-600/30"
            >
              <Save className="w-5 h-5" />
              {saving ? "Guardando..." : "Guardar Configuración"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
