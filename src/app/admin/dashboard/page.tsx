// src/app/admin/dashboard/page.tsx
"use client";
import React, { useEffect, useState } from "react";
import {
  Package,
  Truck,
  AlertTriangle,
  DollarSign,
  Activity,
  Archive,
  ArrowRightLeft,
} from "lucide-react";
import { getDashboardMetrics } from "@/services/dashboardService";
import { Tire } from "@/types/tire";
import Link from "next/link";
import toast from "react-hot-toast";

// TIPO DE CAMBIO REFERENCIAL (Puedes moverlo a una configuración global luego)
const EXCHANGE_RATE_USD_TO_PEN = 3.75;

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      setLoading(true);
      try {
        const data = await getDashboardMetrics();
        setMetrics(data);
      } catch (error) {
        toast.error("Error al cargar las métricas gerenciales");
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  if (loading || !metrics) {
    return (
      <div className="flex justify-center items-center h-full min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Calculamos el patrimonio unificado a Soles
  const unifiedTotalPEN =
    metrics.financials.totalPEN +
    metrics.financials.totalUSD * EXCHANGE_RATE_USD_TO_PEN;

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      <div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">
          Dashboard Gerencial
        </h1>
        <p className="text-slate-500 font-medium mt-1">
          Visión unificada del estado operativo y patrimonio de la flota.
        </p>
      </div>

      {/* --- KPIs PRINCIPALES --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* KPI 1: INVERSIÓN MULTIMONEDA */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-between group hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-4">
            <div className="bg-emerald-100 p-3 rounded-2xl group-hover:scale-110 transition-transform">
              <DollarSign className="w-6 h-6 text-emerald-600" />
            </div>
            <div className="text-right">
              <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-1 rounded-lg uppercase">
                Patrimonio Llantas
              </span>
            </div>
          </div>
          <div>
            {/* Patrimonio Unificado */}
            <h3 className="text-2xl font-black text-slate-800 font-mono tracking-tight">
              S/{" "}
              {unifiedTotalPEN.toLocaleString("es-PE", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </h3>

            {/* Desglose por Monedas */}
            <div className="mt-3 pt-3 border-t border-slate-100 space-y-1">
              <div className="flex justify-between items-center text-xs font-bold">
                <span className="text-slate-400">Total Soles:</span>
                <span className="text-slate-700">
                  S/{" "}
                  {metrics.financials.totalPEN.toLocaleString("es-PE", {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs font-bold">
                <span className="text-slate-400">Total Dólares:</span>
                <span className="text-emerald-600">
                  ${" "}
                  {metrics.financials.totalUSD.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>
              <div className="flex justify-between items-center text-[9px] font-black text-slate-300 mt-2">
                <span className="flex items-center gap-1">
                  <ArrowRightLeft className="w-3 h-3" /> TC:{" "}
                  {EXCHANGE_RATE_USD_TO_PEN}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* KPI 2: Flota Activa */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <div className="bg-blue-100 p-3 rounded-2xl">
              <Truck className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
              Unidades Operativas
            </p>
            <h3 className="text-4xl font-black text-slate-800 tracking-tighter">
              {metrics.trucks.active}{" "}
              <span className="text-xl text-slate-300 font-medium tracking-normal">
                / {metrics.trucks.total}
              </span>
            </h3>
            {metrics.trucks.maintenance > 0 && (
              <p className="text-xs text-amber-600 font-bold mt-2 bg-amber-50 inline-block px-2 py-1 rounded">
                {metrics.trucks.maintenance} en taller
              </p>
            )}
          </div>
        </div>

        {/* KPI 3: Llantas Rodando */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <div className="bg-indigo-100 p-3 rounded-2xl">
              <Activity className="w-6 h-6 text-indigo-600" />
            </div>
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
              Llantas en Uso
            </p>
            <h3 className="text-4xl font-black text-slate-800 tracking-tighter">
              {metrics.tires.inUse}
            </h3>
            <p className="text-xs text-slate-400 font-bold mt-2">
              Generando desgaste diario
            </p>
          </div>
        </div>

        {/* KPI 4: Stock Disponible */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <div className="bg-amber-100 p-3 rounded-2xl">
              <Package className="w-6 h-6 text-amber-600" />
            </div>
            <span className="text-[10px] font-black text-amber-700 bg-amber-50 border border-amber-200 px-2 py-1 rounded-lg">
              Almacén
            </span>
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
              Stock Disponible
            </p>
            <h3 className="text-4xl font-black text-slate-800 tracking-tighter">
              {metrics.tires.available}
            </h3>
            {metrics.tires.available < 10 && (
              <p className="text-xs text-red-500 font-bold mt-2 flex items-center gap-1 bg-red-50 inline-block px-2 py-1 rounded">
                <AlertTriangle className="w-3 h-3" /> Reposición sugerida
              </p>
            )}
          </div>
        </div>
      </div>

      {/* --- SECCIÓN INFERIOR --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* PANEL IZQUIERDO: TOP 5 Llantas Críticas */}
        <div className="lg:col-span-2 bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" /> TOP 5: Desgaste
              Crítico
            </h2>
          </div>

          <div className="flex-1">
            {metrics.criticalTires.length === 0 ? (
              <div className="p-12 text-center text-slate-500 font-bold">
                ¡Excelente! No hay llantas operativas por debajo de 4.0 mm.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-white text-slate-400 text-[10px] uppercase font-black tracking-widest border-b border-slate-100">
                    <tr>
                      <th className="p-4">Serie / Modelo</th>
                      <th className="p-4">Remanente Actual</th>
                      <th className="p-4 text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {metrics.criticalTires.map((tire: Tire) => (
                      <tr
                        key={tire.id}
                        className="hover:bg-red-50/30 transition-colors group"
                      >
                        <td className="p-4">
                          <Link
                            href={`/admin/inventory/${tire.id}`}
                            className="font-black text-blue-600 hover:underline"
                          >
                            {tire.serialNumber}
                          </Link>
                          <p className="text-xs text-slate-500 font-bold uppercase mt-0.5">
                            {tire.brand} {tire.model}
                          </p>
                        </td>
                        <td className="p-4">
                          <span
                            className={`font-mono font-black px-3 py-1.5 rounded-lg text-xs ${
                              tire.currentTreadDepth <= 2
                                ? "bg-red-100 text-red-700 border border-red-200 shadow-sm"
                                : "bg-amber-100 text-amber-700 border border-amber-200"
                            }`}
                          >
                            {tire.currentTreadDepth} mm
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <Link
                            href={`/admin/trucks/${tire.truckId}`}
                            className="text-[10px] font-black uppercase tracking-widest text-white bg-slate-800 hover:bg-slate-900 px-3 py-2 rounded-lg transition-colors"
                          >
                            Ver Camión →
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* PANEL DERECHO: Distribución de Flota */}
        <div className="bg-slate-900 rounded-3xl shadow-lg border border-slate-800 p-6 text-white flex flex-col">
          <h2 className="text-lg font-black text-white flex items-center gap-2 mb-8">
            <Archive className="w-5 h-5 text-blue-400" />
            Distribución Global
          </h2>

          <div className="space-y-6 flex-1">
            <div>
              <div className="flex justify-between text-xs mb-2">
                <span className="font-bold text-slate-400 uppercase tracking-widest">
                  En Uso (Rodando)
                </span>
                <span className="font-mono font-black text-white">
                  {metrics.tires.inUse}
                </span>
              </div>
              <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-blue-500 h-full rounded-full"
                  style={{
                    width: `${(metrics.tires.inUse / Math.max(metrics.tires.total, 1)) * 100}%`,
                  }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-2">
                <span className="font-bold text-slate-400 uppercase tracking-widest">
                  En Almacén
                </span>
                <span className="font-mono font-black text-white">
                  {metrics.tires.available}
                </span>
              </div>
              <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-amber-400 h-full rounded-full"
                  style={{
                    width: `${(metrics.tires.available / Math.max(metrics.tires.total, 1)) * 100}%`,
                  }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-2">
                <span className="font-bold text-slate-400 uppercase tracking-widest">
                  Dado de Baja
                </span>
                <span className="font-mono font-black text-white">
                  {metrics.tires.discarded}
                </span>
              </div>
              <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-slate-500 h-full rounded-full"
                  style={{
                    width: `${(metrics.tires.discarded / Math.max(metrics.tires.total, 1)) * 100}%`,
                  }}
                ></div>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-800 text-center bg-slate-800/50 rounded-2xl p-4">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
              Histórico Total
            </p>
            <p className="text-4xl font-black text-white tracking-tighter">
              {metrics.tires.total}{" "}
              <span className="text-sm font-bold text-slate-500 tracking-normal uppercase">
                unidades
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
