// src/app/admin/reports/page.tsx
"use client";
import React, { useEffect, useState } from "react";
import { Calculator, AlertCircle, Download, FileText } from "lucide-react";
import {
  generateProjectionsData,
  TireProjection,
} from "@/services/reportService";
import {
  exportProjectionsToCSV,
  exportProjectionsToPDF,
} from "@/lib/utils/exportReports";
import toast from "react-hot-toast";
import { ProjectionsDataView } from "@/components/reports/ProjectionsDataView";

export default function ReportsPage() {
  const [loading, setLoading] = useState(true);
  const [projections, setProjections] = useState<TireProjection[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    const loadReport = async () => {
      setLoading(true);
      try {
        const { projections: projData, chartData: cData } =
          await generateProjectionsData();
        setProjections(projData);
        setChartData(cData);
      } catch (error) {
        console.error(error);
        toast.error("Error al cargar las proyecciones financieras.");
      } finally {
        setLoading(false);
      }
    };

    loadReport();
  }, []);

  if (loading)
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* ENCABEZADO Y ACCIONES */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3 tracking-tight">
            <Calculator className="w-8 h-8 text-blue-600" />
            Proyecciones y Costos
          </h1>
          <p className="text-slate-500 text-sm mt-1 font-medium">
            Análisis financiero basado en el desgaste actual de la flota activa.
          </p>
        </div>

        {projections.length > 0 && (
          <div className="flex gap-3 w-full sm:w-auto">
            <button
              onClick={() => exportProjectionsToCSV(projections)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-700 px-5 py-2.5 rounded-xl font-bold hover:bg-slate-50 transition-colors shadow-sm text-sm"
            >
              <FileText className="w-4 h-4 text-emerald-600" /> Excel
            </button>
            <button
              onClick={() => exportProjectionsToPDF(projections)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-slate-800 transition-colors shadow-sm text-sm"
            >
              <Download className="w-4 h-4" /> PDF Reporte
            </button>
          </div>
        )}
      </div>

      {/* CONTENIDO PRINCIPAL */}
      {projections.length === 0 ? (
        <div className="bg-amber-50 p-6 rounded-3xl border border-amber-200 text-amber-800 flex items-start gap-4 shadow-sm">
          <AlertCircle className="w-8 h-8 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-lg font-black tracking-tight">
              Insuficientes datos operativos
            </h3>
            <p className="text-sm mt-2 font-medium">
              Aún no hay suficientes datos para proyectar. El sistema necesita
              que las llantas estén en estado <b>"Rodando"</b>, tengan un{" "}
              <b>"Precio"</b> asignado, y se haya registrado al menos un control
              de desgaste con cambio en el odómetro.
            </p>
          </div>
        </div>
      ) : (
        <ProjectionsDataView projections={projections} chartData={chartData} />
      )}
    </div>
  );
}
