// src/app/admin/reports/page.tsx
"use client";
import React, { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import {
  Calculator,
  TrendingDown,
  TrendingUp,
  AlertCircle,
  Download,
  FileText,
} from "lucide-react";
import { getInventory } from "@/services/tireService";
import { getTrucks } from "@/services/truckService";
import { getGlobalSettings, GlobalSettings } from "@/services/settingsService";
import { Tire } from "@/types/tire";
import { Truck } from "@/types/truck";
import {
  exportProjectionsToCSV,
  exportProjectionsToPDF,
} from "@/lib/utils/exportReports";

// Interfaz para la tabla matemática
interface TireProjection {
  id: string;
  serialNumber: string;
  brand: string;
  model: string;
  projectedKm: number;
  costPerKm: number;
  wearPercentage: number;
  remainingTread: number;
  statusText: string;
}

export default function ReportsPage() {
  const [loading, setLoading] = useState(true);
  const [projections, setProjections] = useState<TireProjection[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    const generateReport = async () => {
      try {
        const [tires, trucks, config] = await Promise.all([
          getInventory(),
          getTrucks(),
          getGlobalSettings(),
        ]);

        const calculatedProjections: TireProjection[] = [];
        const brandModelAverages: Record<
          string,
          { totalKm: number; count: number }
        > = {};

        tires.forEach((tire) => {
          // Solo podemos proyectar si la llanta está en uso, tiene precio y odómetro inicial
          if (
            tire.status === "IN_USE" &&
            tire.truckId &&
            tire.price &&
            tire.initialOdometer
          ) {
            const truck = trucks.find((t) => t.id === tire.truckId);

            if (
              truck &&
              truck.currentOdometer &&
              truck.currentOdometer > tire.initialOdometer
            ) {
              const originalDepth = config.defaultInitialDepth; // Ej: 12mm
              const currentDepth = tire.currentTreadDepth;
              const criticalLimit = config.criticalWearLimit; // Ej: 3mm

              const mmWorn = originalDepth - currentDepth;
              const kmRun = truck.currentOdometer - tire.initialOdometer;

              // Si ya hubo desgaste, calculamos
              if (mmWorn > 0) {
                const kmPerMm = kmRun / mmWorn; // Rendimiento: KM por cada milímetro
                const usefulTread = originalDepth - criticalLimit; // Milímetros útiles totales

                const projectedKm = kmPerMm * usefulTread;
                const costPerKm = tire.price / projectedKm;
                const wearPercentage = (mmWorn / originalDepth) * 100;

                calculatedProjections.push({
                  id: tire.id,
                  serialNumber: tire.serialNumber,
                  brand: tire.brand,
                  model: tire.model,
                  projectedKm: Math.round(projectedKm),
                  costPerKm: Number(costPerKm.toFixed(4)),
                  wearPercentage: Math.round(wearPercentage),
                  remainingTread: currentDepth,
                  statusText: "Ok",
                });

                // Agrupar para el gráfico (Promedio por Marca/Modelo)
                const groupKey = `${tire.brand} ${tire.model}`;
                if (!brandModelAverages[groupKey]) {
                  brandModelAverages[groupKey] = { totalKm: 0, count: 0 };
                }
                brandModelAverages[groupKey].totalKm += projectedKm;
                brandModelAverages[groupKey].count += 1;
              }
            }
          }
        });

        // Ordenar tabla por KM proyectado (mayor a menor)
        calculatedProjections.sort((a, b) => b.projectedKm - a.projectedKm);
        setProjections(calculatedProjections);

        // Formatear datos para el gráfico
        const finalChartData = Object.keys(brandModelAverages).map((key) => ({
          name: key,
          "KM Proyectado Promedio": Math.round(
            brandModelAverages[key].totalKm / brandModelAverages[key].count,
          ),
        }));
        setChartData(finalChartData);
      } catch (error) {
        console.error("Error generando proyecciones:", error);
      } finally {
        setLoading(false);
      }
    };

    generateReport();
  }, []);

  if (loading)
    return (
      <div className="p-8 text-center text-slate-500">
        Calculando proyecciones financieras...
      </div>
    );

  return (
    <div className="space-y-6">
      {/* Reemplaza el div del encabezado con esto: */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Calculator className="w-6 h-6 text-blue-600" />
            Proyecciones de Rendimiento y Costos
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Análisis financiero basado en el desgaste actual de la flota activa.
          </p>
        </div>

        {/* Solo mostrar botones si hay datos calculados */}
        {projections.length > 0 && (
          <div className="flex gap-3 w-full sm:w-auto">
            <button
              onClick={() => exportProjectionsToCSV(projections)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-xl font-bold hover:bg-slate-50 transition-colors shadow-sm text-sm"
            >
              <FileText className="w-4 h-4" />
              Excel (CSV)
            </button>
            <button
              onClick={() => exportProjectionsToPDF(projections)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-emerald-700 transition-colors shadow-sm text-sm"
            >
              <Download className="w-4 h-4" />
              PDF
            </button>
          </div>
        )}
      </div>

      {projections.length === 0 ? (
        <div className="bg-amber-50 p-6 rounded-2xl border border-amber-200 text-amber-800 flex items-center gap-3">
          <AlertCircle className="w-6 h-6" />
          <p>
            Aún no hay suficientes datos para generar proyecciones. Asegúrate de
            registrar el Precio y Odómetro Inicial, y realizar al menos una
            inspección de desgaste.
          </p>
        </div>
      ) : (
        <>
          {/* Gráfico Comparativo de Marcas (Similar a tu imagen) */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
              Rendimiento Promedio por Diseño (KM)
            </h3>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#f1f5f9"
                  />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#64748b", fontSize: 12 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#64748b", fontSize: 12 }}
                  />
                  <Tooltip
                    cursor={{ fill: "#f8fafc" }}
                    contentStyle={{
                      borderRadius: "12px",
                      border: "1px solid #e2e8f0",
                      boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                    }}
                  />
                  <Legend />
                  <Bar
                    dataKey="KM Proyectado Promedio"
                    fill="#3b82f6"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={60}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Tabla de Datos Reales (Exactamente como tu imagen) */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse whitespace-nowrap">
                <thead>
                  <tr className="bg-blue-50 text-blue-900 text-xs uppercase tracking-wider font-bold">
                    <th className="p-4 border-b border-blue-100">Código</th>
                    <th className="p-4 border-b border-blue-100">Marca</th>
                    <th className="p-4 border-b border-blue-100">Diseño</th>
                    <th className="p-4 border-b border-blue-100 text-right">
                      KM Proyectado
                    </th>
                    <th className="p-4 border-b border-blue-100 text-right">
                      Costo x KM Proy
                    </th>
                    <th className="p-4 border-b border-blue-100 text-center">
                      % Desgaste
                    </th>
                    <th className="p-4 border-b border-blue-100 text-center">
                      Remanente
                    </th>
                    <th className="p-4 border-b border-blue-100">
                      Observación
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {projections.map((tire) => (
                    <tr
                      key={tire.id}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="p-4 font-bold text-slate-800">
                        {tire.serialNumber}
                      </td>
                      <td className="p-4 text-slate-600">{tire.brand}</td>
                      <td className="p-4 text-slate-600">{tire.model}</td>
                      <td className="p-4 text-right font-mono font-bold text-emerald-600">
                        {tire.projectedKm.toLocaleString()}
                      </td>
                      <td className="p-4 text-right font-mono text-slate-700">
                        {tire.costPerKm.toFixed(4)}
                      </td>
                      <td className="p-4 text-center">
                        <span
                          className={`px-2 py-1 rounded font-bold ${
                            tire.wearPercentage > 75
                              ? "bg-red-100 text-red-700"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {tire.wearPercentage}%
                        </span>
                      </td>
                      <td className="p-4 text-center font-bold text-slate-700">
                        {tire.remainingTread}
                      </td>
                      <td className="p-4 text-slate-400 italic text-xs">
                        {tire.statusText}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
