// src/components/reports/ProjectionsDataView.tsx
"use client";
import React, { useState } from "react";
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
import { TrendingUp, ChevronLeft, ChevronRight } from "lucide-react";
import { TireProjection } from "@/services/reportService";

interface ProjectionsDataViewProps {
  projections: TireProjection[];
  chartData: any[];
}

export const ProjectionsDataView: React.FC<ProjectionsDataViewProps> = ({
  projections,
  chartData,
}) => {
  const [pageIndex, setPageIndex] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  const totalPages = Math.max(1, Math.ceil(projections.length / pageSize));
  const currentProjections = projections.slice(
    pageIndex * pageSize,
    (pageIndex + 1) * pageSize,
  );

  return (
    <>
      {/* GRÁFICO */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 mb-6">
        <h3 className="font-black text-slate-800 mb-6 flex items-center gap-2">
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
                tick={{ fill: "#64748b", fontSize: 11, fontWeight: "bold" }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#64748b", fontSize: 11, fontWeight: "bold" }}
              />
              <Tooltip
                cursor={{ fill: "#f8fafc" }}
                contentStyle={{
                  borderRadius: "12px",
                  border: "1px solid #e2e8f0",
                  boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                  fontWeight: "bold",
                }}
              />
              <Legend wrapperStyle={{ fontSize: "12px", fontWeight: "bold" }} />
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

      {/* TABLA ESTANDARIZADA */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="bg-slate-50 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-200">
                <th className="px-6 py-4 w-16">N°</th>
                <th className="px-6 py-4">Código</th>
                <th className="px-6 py-4">Diseño (Marca/Modelo)</th>
                <th className="px-6 py-4 text-right">Proyección</th>
                <th className="px-6 py-4 text-right">Costo Operativo (CPK)</th>
                <th className="px-6 py-4 text-center">Estado de Desgaste</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {currentProjections.map((tire, idx) => {
                const itemNumber = pageIndex * pageSize + idx + 1;
                return (
                  <tr
                    key={tire.id}
                    className="hover:bg-slate-50/80 transition-colors group"
                  >
                    <td className="px-6 py-4 font-bold text-slate-400">
                      #{itemNumber}
                    </td>
                    <td className="px-6 py-4 font-black text-blue-600">
                      {tire.serialNumber}
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-black text-slate-800 uppercase">
                        {tire.brand}
                      </p>
                      <p className="text-xs font-bold text-slate-400 uppercase">
                        {tire.model}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <p className="font-mono font-black text-emerald-600 text-base">
                        {tire.projectedKm.toLocaleString()} KM
                      </p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span
                        className={`font-mono font-black px-2 py-1 rounded ${tire.currency === "USD" ? "text-emerald-700 bg-emerald-50" : "text-blue-700 bg-blue-50"}`}
                      >
                        {tire.currency === "USD" ? "$" : "S/"}{" "}
                        {tire.costPerKm.toFixed(4)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3 justify-center">
                        <span className="font-bold text-slate-700 text-xs w-10 text-right">
                          {tire.remainingTread} mm
                        </span>
                        <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${tire.wearPercentage > 80 ? "bg-red-500" : tire.wearPercentage > 60 ? "bg-amber-400" : "bg-emerald-500"}`}
                            style={{
                              width: `${Math.min(tire.wearPercentage, 100)}%`,
                            }}
                          ></div>
                        </div>
                        <span
                          className={`px-2 py-0.5 text-[10px] rounded-md font-black ${tire.wearPercentage > 80 ? "bg-red-100 text-red-700" : "bg-slate-100 text-slate-500"}`}
                        >
                          {tire.wearPercentage}%
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* FOOTER: PAGINACIÓN */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
              Mostrar:
            </span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPageIndex(0);
              }}
              className="bg-white border border-slate-200 text-xs font-bold text-slate-700 py-1.5 px-2 rounded-lg outline-none cursor-pointer shadow-sm"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setPageIndex((p) => p - 1)}
              disabled={pageIndex === 0}
              className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 disabled:opacity-40 transition-colors shadow-sm"
            >
              <ChevronLeft className="w-4 h-4 text-slate-600" />
            </button>
            <span className="text-xs font-black text-slate-500 uppercase">
              Pág. {pageIndex + 1} de {totalPages}
            </span>
            <button
              onClick={() => setPageIndex((p) => p + 1)}
              disabled={pageIndex >= totalPages - 1}
              className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 disabled:opacity-40 transition-colors shadow-sm"
            >
              <ChevronRight className="w-4 h-4 text-slate-600" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
