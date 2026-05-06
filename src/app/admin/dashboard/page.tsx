// src/app/admin/dashboard/page.tsx
"use client";
import React, { useEffect, useState } from "react";
import {
  TrendingUp,
  Package,
  Truck,
  AlertTriangle,
  DollarSign,
  Activity,
  Archive,
} from "lucide-react";
import { getInventory } from "@/services/tireService";
import { getTrucks } from "@/services/truckService";
import { Tire } from "@/types/tire";
import { Truck as TruckType } from "@/types/truck";
import Link from "next/link";

export default function DashboardPage() {
  const [tires, setTires] = useState<Tire[]>([]);
  const [trucks, setTrucks] = useState<TruckType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      setLoading(true);
      try {
        const [tiresData, trucksData] = await Promise.all([
          getInventory(),
          getTrucks(),
        ]);
        setTires(tiresData);
        setTrucks(trucksData);
      } catch (error) {
        console.error("Error loading dashboard", error);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  // --- CÁLCULOS GERENCIALES ---

  // 1. Salud de Flota
  const activeTrucks = trucks.filter((t) => t.status === "ACTIVE").length;
  const maintenanceTrucks = trucks.filter(
    (t) => t.status === "IN_MAINTENANCE",
  ).length;

  // 2. Inventario de Neumáticos
  const tiresInUse = tires.filter((t) => t.status === "IN_USE").length;
  const tiresInStock = tires.filter((t) => t.status === "AVAILABLE").length;
  const tiresDiscarded = tires.filter((t) => t.status === "DISCARDED").length;

  // 3. Valorización Financiera (Patrimonio en Llantas)
  const totalInvestment = tires.reduce((acc, tire) => {
    // Para simplificar el demo, asumimos que todo se suma en una sola moneda,
    // en un entorno real habría que aplicar tipo de cambio si es USD/PEN mezclado.
    return acc + (tire.price || 0);
  }, 0);

  // 4. Llantas en Estado Crítico (Menos de 4mm de remanente y en uso)
  const criticalTires = tires.filter(
    (t) => t.status === "IN_USE" && t.currentTreadDepth <= 4,
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-slate-900">
          Dashboard Gerencial
        </h1>
        <p className="text-slate-500 font-medium mt-1">
          Resumen operativo y financiero de la flota.
        </p>
      </div>

      {/* METRICAS PRINCIPALES (KPIs) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* KPI 1: Inversión */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <div className="bg-emerald-100 p-3 rounded-2xl">
              <DollarSign className="w-6 h-6 text-emerald-600" />
            </div>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
              Total Acumulado
            </span>
          </div>
          <div>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">
              Valor en Llantas
            </p>
            <h3 className="text-3xl font-black text-slate-800 font-mono">
              S/{" "}
              {totalInvestment.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </h3>
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
            <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">
              Unidades Operativas
            </p>
            <h3 className="text-3xl font-black text-slate-800">
              {activeTrucks}{" "}
              <span className="text-lg text-slate-400 font-medium">
                / {trucks.length}
              </span>
            </h3>
            {maintenanceTrucks > 0 && (
              <p className="text-xs text-amber-600 font-bold mt-2">
                {maintenanceTrucks} en taller
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
            <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">
              Llantas en Uso
            </p>
            <h3 className="text-3xl font-black text-slate-800">{tiresInUse}</h3>
            <p className="text-xs text-slate-500 font-bold mt-2">
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
            <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-lg">
              Almacén
            </span>
          </div>
          <div>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">
              Llantas Disponibles
            </p>
            <h3 className="text-3xl font-black text-slate-800">
              {tiresInStock}
            </h3>
            {tiresInStock < 10 && (
              <p className="text-xs text-red-500 font-bold mt-2 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> Stock bajo
              </p>
            )}
          </div>
        </div>
      </div>

      {/* SECCIÓN INFERIOR: Alertas y Gráficos Básicos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* PANEL IZQUIERDO: Alertas Críticas */}
        <div className="lg:col-span-2 bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              Llantas Críticas (Próximas a Reemplazo)
            </h2>
            <span className="bg-red-100 text-red-700 font-black text-xs px-3 py-1 rounded-full">
              {criticalTires.length} Alertas
            </span>
          </div>

          <div className="p-0">
            {criticalTires.length === 0 ? (
              <div className="p-8 text-center text-slate-500 font-bold">
                No hay llantas con desgaste crítico (todas {">"} 4mm).
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-slate-400 text-xs uppercase font-black">
                    <tr>
                      <th className="p-4">Folio / Serie</th>
                      <th className="p-4">Unidad</th>
                      <th className="p-4">Remanente</th>
                      <th className="p-4 text-right">Acción</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {criticalTires.slice(0, 5).map((tire) => {
                      // BUSCAMOS EL CAMIÓN CORRESPONDIENTE PARA OBTENER LA PLACA
                      const assignedTruck = trucks.find(
                        (t) => t.id === tire.truckId,
                      );
                      const displayPlate = assignedTruck
                        ? assignedTruck.licensePlate
                        : "ID: " + tire.truckId;

                      return (
                        <tr
                          key={tire.id}
                          className="hover:bg-red-50/30 transition-colors"
                        >
                          <td className="p-4">
                            <Link
                              href={`/admin/inventory/${tire.id}`}
                              className="font-bold text-blue-600 hover:underline"
                            >
                              {tire.serialNumber}
                            </Link>
                            <p className="text-xs text-slate-500 font-medium uppercase">
                              {tire.brand}
                            </p>
                          </td>
                          <td className="p-4">
                            {/* AHORA MOSTRAMOS LA PLACA CON UN ESTILO MÁS LIMPIO */}
                            <div className="flex items-center gap-2">
                              <span className="font-black text-slate-700 uppercase bg-slate-100 px-2 py-1 rounded border border-slate-200">
                                {displayPlate}
                              </span>
                            </div>
                          </td>
                          <td className="p-4">
                            <span
                              className={`font-mono font-black px-2 py-1 rounded-lg ${tire.currentTreadDepth <= 2 ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}
                            >
                              {tire.currentTreadDepth} mm
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <Link
                              href={`/admin/trucks/${tire.truckId}`}
                              className="text-xs font-bold text-blue-600 hover:text-blue-800"
                            >
                              Ir al Camión →
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* PANEL DERECHO: Resumen de Estados */}
        <div className="bg-slate-900 rounded-3xl shadow-lg border border-slate-800 p-6 text-white flex flex-col">
          <h2 className="text-lg font-black text-white flex items-center gap-2 mb-6">
            <Archive className="w-5 h-5 text-slate-400" />
            Distribución Global
          </h2>

          <div className="space-y-6 flex-1">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="font-bold text-slate-300">
                  En Uso (Rodando)
                </span>
                <span className="font-mono font-bold text-white">
                  {tiresInUse}
                </span>
              </div>
              <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden">
                <div
                  className="bg-blue-500 h-full rounded-full"
                  style={{
                    width: `${(tiresInUse / Math.max(tires.length, 1)) * 100}%`,
                  }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="font-bold text-slate-300">
                  En Almacén (Disponibles)
                </span>
                <span className="font-mono font-bold text-white">
                  {tiresInStock}
                </span>
              </div>
              <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden">
                <div
                  className="bg-amber-400 h-full rounded-full"
                  style={{
                    width: `${(tiresInStock / Math.max(tires.length, 1)) * 100}%`,
                  }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="font-bold text-slate-300">
                  Descartadas (Baja)
                </span>
                <span className="font-mono font-bold text-white">
                  {tiresDiscarded}
                </span>
              </div>
              <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden">
                <div
                  className="bg-slate-500 h-full rounded-full"
                  style={{
                    width: `${(tiresDiscarded / Math.max(tires.length, 1)) * 100}%`,
                  }}
                ></div>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-800 text-center">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">
              Total Histórico Registrado
            </p>
            <p className="text-4xl font-black text-white">
              {tires.length}{" "}
              <span className="text-lg text-slate-500">unidades</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
