// src/app/admin/dashboard/page.tsx
"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Package,
  Truck,
  AlertTriangle,
  Activity,
  ArrowRight,
  PieChart as ChartIcon,
} from "lucide-react";
import { getInventory } from "@/services/tireService";
import { getTrucks } from "@/services/truckService";
import { getGlobalSettings, GlobalSettings } from "@/services/settingsService";
import { Tire } from "@/types/tire";
// Nuevas importaciones de Recharts
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState<GlobalSettings | null>(null);

  // Guardamos todos los neumáticos para procesar los gráficos
  const [allTires, setAllTires] = useState<Tire[]>([]);

  const [metrics, setMetrics] = useState({
    totalTires: 0,
    tiresInUse: 0,
    activeTrucks: 0,
    criticalTires: [] as Tire[],
  });

  useEffect(() => {
    const loadDashboardData = async () => {
      setLoading(true);
      try {
        const [tires, trucks, globalConfig] = await Promise.all([
          getInventory(),
          getTrucks(),
          getGlobalSettings(),
        ]);

        setConfig(globalConfig);
        setAllTires(tires); // Guardamos la data cruda para los gráficos

        const inUse = tires.filter((t) => t.status === "IN_USE");
        const critical = tires.filter(
          (t) =>
            t.currentTreadDepth <= globalConfig.criticalWearLimit &&
            t.status !== "DISCARDED",
        );
        const active = trucks.filter((t) => t.status === "ACTIVE");

        setMetrics({
          totalTires: tires.length,
          tiresInUse: inUse.length,
          activeTrucks: active.length,
          criticalTires: critical,
        });
      } catch (error) {
        console.error("Error cargando el dashboard:", error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  if (loading || !config) {
    return (
      <div className="flex h-[50vh] items-center justify-center text-slate-500">
        Sincronizando con la nube...
      </div>
    );
  }

  // --- PREPARACIÓN DE DATOS PARA GRÁFICOS ---

  // 1. Datos para el Gráfico de Torta (Estado)
  const statusData = [
    {
      name: "En Uso",
      value: allTires.filter((t) => t.status === "IN_USE").length,
      color: "#10b981",
    }, // Emerald
    {
      name: "En Almacén",
      value: allTires.filter((t) => t.status === "AVAILABLE").length,
      color: "#3b82f6",
    }, // Blue
    {
      name: "Descartados",
      value: allTires.filter((t) => t.status === "DISCARDED").length,
      color: "#94a3b8",
    }, // Slate
  ].filter((item) => item.value > 0); // Ocultar los que tienen 0

  // 2. Datos para el Gráfico de Barras (Salud / Desgaste)
  const warningLimit = config.criticalWearLimit + 3; // Si el crítico es 3, warning es <= 6
  const healthData = [
    {
      name: "Óptimo",
      cantidad: allTires.filter(
        (t) => t.currentTreadDepth > warningLimit && t.status !== "DISCARDED",
      ).length,
      fill: "#10b981",
    },
    {
      name: "Advertencia",
      cantidad: allTires.filter(
        (t) =>
          t.currentTreadDepth > config.criticalWearLimit &&
          t.currentTreadDepth <= warningLimit &&
          t.status !== "DISCARDED",
      ).length,
      fill: "#f59e0b", // Amber
    },
    {
      name: "Crítico",
      cantidad: metrics.criticalTires.length,
      fill: "#ef4444", // Red
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Panel de Control</h1>
        <p className="text-slate-500 text-sm mt-1">
          Métricas calculadas con un límite crítico de{" "}
          <span className="font-bold text-slate-700">
            {config.criticalWearLimit}mm
          </span>
          .
        </p>
      </div>

      {/* Tarjetas de Métricas (Mantienen su diseño) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex justify-between items-start mb-4">
            <div className="bg-blue-50 p-3 rounded-xl text-blue-600">
              <Package className="w-6 h-6" />
            </div>
          </div>
          <div>
            <p className="text-slate-500 text-sm font-medium">
              Total Neumáticos
            </p>
            <h3 className="text-2xl font-bold text-slate-900">
              {metrics.totalTires}
            </h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex justify-between items-start mb-4">
            <div className="bg-emerald-50 p-3 rounded-xl text-emerald-600">
              <Activity className="w-6 h-6" />
            </div>
          </div>
          <div>
            <p className="text-slate-500 text-sm font-medium">
              Neumáticos Rodando
            </p>
            <h3 className="text-2xl font-bold text-slate-900">
              {metrics.tiresInUse}
            </h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex justify-between items-start mb-4">
            <div className="bg-purple-50 p-3 rounded-xl text-purple-600">
              <Truck className="w-6 h-6" />
            </div>
          </div>
          <div>
            <p className="text-slate-500 text-sm font-medium">
              Camiones Activos
            </p>
            <h3 className="text-2xl font-bold text-slate-900">
              {metrics.activeTrucks}
            </h3>
          </div>
        </div>

        <div className="bg-red-50 p-6 rounded-2xl shadow-sm border border-red-200">
          <div className="flex justify-between items-start mb-4">
            <div className="bg-red-100 p-3 rounded-xl text-red-600">
              <AlertTriangle className="w-6 h-6" />
            </div>
          </div>
          <div>
            <p className="text-red-800 text-sm font-medium">
              Alertas (&le;{config.criticalWearLimit}mm)
            </p>
            <h3 className="text-2xl font-bold text-red-700">
              {metrics.criticalTires.length}
            </h3>
          </div>
        </div>
      </div>

      {/* SECCIÓN DE GRÁFICOS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Distribución */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
            <ChartIcon className="w-5 h-5 text-blue-600" />
            Distribución de Inventario
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => [`${value} neumáticos`, "Cantidad"]}
                  contentStyle={{
                    borderRadius: "8px",
                    border: "none",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                  }}
                />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfico de Salud (Desgaste) */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-emerald-600" />
            Salud de la Flota (Desgaste)
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={healthData}
                margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
              >
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis
                  allowDecimals={false}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  cursor={{ fill: "#f8fafc" }}
                  contentStyle={{
                    borderRadius: "8px",
                    border: "none",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                  }}
                />
                <Bar dataKey="cantidad" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Tabla de Alertas (Mantener tu código actual aquí) */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {/* ... El mismo código de la tabla que ya tenías ... */}
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h2 className="font-bold text-slate-800 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            Neumáticos bajo el límite de {config.criticalWearLimit}mm
          </h2>
        </div>

        {metrics.criticalTires.length === 0 ? (
          <div className="p-8 text-center text-slate-500 italic">
            No hay neumáticos en estado crítico según la configuración actual.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-sm">
                  <th className="p-4 font-semibold">N° Serie</th>
                  <th className="p-4 font-semibold">Desgaste</th>
                  <th className="p-4 font-semibold">Ubicación</th>
                  <th className="p-4 font-semibold">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {metrics.criticalTires.map((tire) => (
                  <tr key={tire.id} className="hover:bg-slate-50">
                    <td className="p-4 font-medium text-slate-900">
                      {tire.serialNumber}
                    </td>
                    <td className="p-4">
                      <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-sm font-bold">
                        {tire.currentTreadDepth} mm
                      </span>
                    </td>
                    <td className="p-4 text-sm text-slate-600">
                      {tire.truckId ? `Camión ${tire.truckId}` : "Stock"}
                    </td>
                    <td className="p-4">
                      {tire.truckId && (
                        <Link
                          href={`/admin/trucks/${tire.truckId}`}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium inline-flex items-center gap-1"
                        >
                          Ver Camión <ArrowRight className="w-4 h-4" />
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
