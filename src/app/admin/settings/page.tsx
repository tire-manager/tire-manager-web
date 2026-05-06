// src/app/admin/settings/page.tsx
"use client";
import React, { useEffect, useState } from "react";
import {
  Save,
  Settings as SettingsIcon,
  ShieldAlert,
  Ruler,
  Building2,
  DollarSign,
  FileText,
  MapPin,
  Briefcase,
  Truck,
  CircleDot,
} from "lucide-react";
import {
  getGlobalSettings,
  updateGlobalSettings,
  GlobalSettings,
  Brand,
} from "@/services/settingsService";
import toast from "react-hot-toast";

type TabType = "empresa" | "finanzas" | "operaciones";

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("operaciones");

  const [settings, setSettings] = useState<any>({
    companyName: "",
    companyRuc: "",
    companyAddress: "",
    exchangeRateUSD: 3.75,
    criticalWearLimit: 3.0,
    defaultInitialDepth: 12.0,
    alertEmail: "",
    tireBrands: [],
    vehicleBrands: [],
  });

  useEffect(() => {
    async function load() {
      const data = await getGlobalSettings();
      setSettings({
        companyName: data?.companyName || "",
        companyRuc: data?.companyRuc || "",
        companyAddress: data?.companyAddress || "",
        exchangeRateUSD: data?.exchangeRateUSD || 3.75,
        criticalWearLimit: data?.criticalWearLimit || 3.0,
        defaultInitialDepth: data?.defaultInitialDepth || 12.0,
        alertEmail: data?.alertEmail || "",
        tireBrands: data?.tireBrands || [],
        vehicleBrands: data?.vehicleBrands || [],
      });
      setLoading(false);
    }
    load();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
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
        Cargando preferencias...
      </div>
    );

  return (
    <div className="max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <SettingsIcon className="w-6 h-6 text-slate-600" />
          Configuración del Sistema
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Administra las reglas de negocio, perfiles financieros y catálogos
          maestros.
        </p>
      </div>

      {/* NAVEGACIÓN POR PESTAÑAS */}
      <div className="flex space-x-2 bg-slate-200/50 p-1 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab("empresa")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-bold text-sm transition-all ${
            activeTab === "empresa"
              ? "bg-white text-blue-600 shadow-sm"
              : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
          }`}
        >
          <Building2 className="w-4 h-4" /> Empresa
        </button>
        <button
          onClick={() => setActiveTab("finanzas")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-bold text-sm transition-all ${
            activeTab === "finanzas"
              ? "bg-white text-emerald-600 shadow-sm"
              : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
          }`}
        >
          <DollarSign className="w-4 h-4" /> Finanzas
        </button>
        <button
          onClick={() => setActiveTab("operaciones")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-bold text-sm transition-all ${
            activeTab === "operaciones"
              ? "bg-white text-slate-800 shadow-sm"
              : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
          }`}
        >
          <SettingsIcon className="w-4 h-4" /> Operaciones
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          {/* CONTENIDO: EMPRESA */}
          {activeTab === "empresa" && (
            <div className="p-6 space-y-6 animate-in fade-in slide-in-from-bottom-2">
              <h3 className="font-bold text-slate-800 border-b border-slate-100 pb-2">
                Datos Legales de la Compañía
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-slate-400" /> Razón
                    Social
                  </label>
                  <input
                    type="text"
                    value={settings.companyName}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        companyName: e.target.value.toUpperCase(),
                      })
                    }
                    placeholder="Ej: TRANSPORTES LOGÍSTICOS S.A.C."
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none uppercase"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-slate-400" /> RUC
                  </label>
                  <input
                    type="text"
                    maxLength={11}
                    value={settings.companyRuc}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        companyRuc: e.target.value.replace(/\D/g, ""),
                      })
                    }
                    placeholder="Ej: 20123456789"
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-slate-400" /> Dirección
                    Principal
                  </label>
                  <input
                    type="text"
                    value={settings.companyAddress}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        companyAddress: e.target.value,
                      })
                    }
                    placeholder="Ej: Av. Principal 123, Lima"
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* CONTENIDO: FINANZAS */}
          {activeTab === "finanzas" && (
            <div className="p-6 space-y-6 animate-in fade-in slide-in-from-bottom-2">
              <h3 className="font-bold text-slate-800 border-b border-slate-100 pb-2">
                Parámetros Financieros
              </h3>

              <div className="flex items-start gap-4 p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                <div className="bg-emerald-100 p-3 rounded-lg text-emerald-600">
                  <DollarSign className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-black text-emerald-900">
                    Tipo de Cambio Base (USD a PEN)
                  </label>
                  <p className="text-xs text-emerald-700 mb-3">
                    Se utilizará para proyectar costos y reportes consolidados
                    cuando se mezclen compras en Soles y Dólares.
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-emerald-700">S/</span>
                    <input
                      type="number"
                      step="0.001"
                      value={settings.exchangeRateUSD}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          exchangeRateUSD: parseFloat(e.target.value),
                        })
                      }
                      className="w-32 p-2.5 bg-white border border-emerald-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-mono font-bold text-emerald-900"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* CONTENIDO: OPERACIONES */}
          {activeTab === "operaciones" && (
            <div className="p-6 space-y-6 animate-in fade-in slide-in-from-bottom-2">
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
                      <span className="text-slate-500 font-bold text-sm">
                        mm
                      </span>
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
                      <span className="text-slate-500 font-bold text-sm">
                        mm
                      </span>
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
                      <CircleDot className="w-5 h-5 text-emerald-600" /> Marcas
                      de Llantas
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
                      <Truck className="w-5 h-5 text-blue-600" /> Marcas de
                      Flota
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
          )}

          <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end items-center">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 bg-blue-600 text-white px-8 py-3 rounded-xl font-black hover:bg-blue-700 transition-all disabled:opacity-50 shadow-lg shadow-blue-600/30"
            >
              <Save className="w-5 h-5" />
              {saving ? "Guardando..." : "Guardar Toda la Configuración"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
