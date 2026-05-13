// src/components/trucks/TruckHistoryLog.tsx
"use client";
import React, { useState, useEffect } from "react";
import { Activity, Camera, Download, Filter } from "lucide-react";
import { Tire, TireHistory } from "@/types/tire";
import { Truck } from "@/types/truck";
import { getTruckInspectionHistory } from "@/services/tireService";
import { generateInspectionReportPDF } from "@/lib/utils/exportInspectionPDF";
import toast from "react-hot-toast";
import * as htmlToImage from "html-to-image";

interface TruckHistoryLogProps {
  truck: Truck;
  allTires: Tire[]; // Para buscar el número de serie real
  tiresHistories: Record<string, TireHistory[]>; // Para mandar al PDF
}

export const TruckHistoryLog: React.FC<TruckHistoryLogProps> = ({
  truck,
  allTires,
  tiresHistories,
}) => {
  const [historyEvents, setHistoryEvents] = useState<TireHistory[]>([]);
  const [lastDoc, setLastDoc] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Filtros y Paginación
  const [eventTypeFilter, setEventTypeFilter] = useState<string>("ALL");
  const [pageSize, setPageSize] = useState<number>(5);

  const loadHistory = async (isFirstLoad = true) => {
    setLoading(true);
    try {
      const { events, lastVisible } = await getTruckInspectionHistory(
        truck.id,
        pageSize,
        isFirstLoad ? undefined : lastDoc,
      );

      setHistoryEvents((prev) => (isFirstLoad ? events : [...prev, ...events]));
      setLastDoc(lastVisible);
    } catch (error) {
      console.error("Error cargando bitácora:", error);
    } finally {
      setLoading(false);
    }
  };

  // Recargar si cambia el tamaño de página (reinicia desde cero)
  useEffect(() => {
    loadHistory(true);
  }, [pageSize, truck.id]);

  // Función para obtener la serie real usando el ID de Firebase
  const getSerialNumber = (tireId: string) => {
    const foundTire = allTires.find((t) => t.id === tireId);
    return foundTire ? foundTire.serialNumber : tireId.slice(0, 8);
  };

  // Filtro local por tipo de evento
  const filteredEvents = historyEvents.filter((ev) =>
    eventTypeFilter === "ALL" ? true : ev.type === eventTypeFilter,
  );

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 mt-8 overflow-hidden">
      {/* CABECERA Y FILTROS */}
      <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50/50">
        <h2 className="font-black text-slate-800 flex items-center gap-2">
          <Activity className="w-5 h-5 text-blue-600" />
          Bitácora de Eventos e Inspecciones
        </h2>

        <div className="flex items-center gap-2 bg-white border border-slate-200 p-1.5 rounded-lg shadow-sm">
          <Filter className="w-4 h-4 text-slate-400 ml-2" />
          <select
            value={eventTypeFilter}
            onChange={(e) => setEventTypeFilter(e.target.value)}
            className="p-1.5 text-sm font-bold text-slate-600 outline-none cursor-pointer bg-transparent"
          >
            <option value="ALL">Todos los Eventos</option>
            <option value="INSPECTION">Solo Inspecciones</option>
            <option value="UNMOUNT">Solo Retiros</option>
            <option value="MOUNT">Solo Montajes</option>
          </select>
        </div>
      </div>

      {/* TABLA DE RESULTADOS */}
      <div className="overflow-x-auto min-h-[300px]">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-200">
              <th className="px-6 py-4">Fecha / Odo</th>
              <th className="px-6 py-4">Tipo</th>
              <th className="px-6 py-4">Neumático</th>
              <th className="px-6 py-4">Detalle / Evidencia</th>
              <th className="px-6 py-4 text-right">Acta</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredEvents.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="p-10 text-center text-slate-500 font-medium"
                >
                  {loading
                    ? "Cargando registros..."
                    : "No hay eventos registrados con estos filtros."}
                </td>
              </tr>
            ) : (
              filteredEvents.map((event) => (
                <tr
                  key={event.id}
                  className="hover:bg-slate-50/80 transition-colors group"
                >
                  <td className="px-6 py-4">
                    <p className="font-bold text-slate-700 text-sm">
                      {event.date
                        ? new Date(
                            event.date.seconds * 1000,
                          ).toLocaleDateString()
                        : "N/D"}
                    </p>
                    <p className="text-xs font-mono text-blue-600">
                      {event.currentOdometer?.toLocaleString()} KM
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`text-[10px] font-black px-2 py-1 rounded-md ${
                        event.type === "UNMOUNT"
                          ? "bg-red-100 text-red-700"
                          : event.type === "MOUNT"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      {event.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-bold text-slate-800 text-sm">
                    {/* AQUÍ CORREGIMOS EL ID POR EL SERIAL REAL */}
                    SERIE: {getSerialNumber(event.tireId)}
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-500 font-medium">
                    <div className="flex items-center gap-2">
                      {event.imageUrl && (
                        <Camera className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                      )}
                      <span className="truncate max-w-[150px] sm:max-w-[250px]">
                        {event.notes || "Control regular"}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      title="Descargar Acta de esta Inspección"
                      onClick={async () => {
                        const toastId = toast.loading(
                          "Generando Acta Específica...",
                        );
                        try {
                          // Capturamos el gráfico visible en la pantalla
                          const chartElement =
                            document.getElementById("chart-container");
                          let chartImage = undefined;
                          if (chartElement) {
                            chartImage = await htmlToImage.toPng(chartElement, {
                              pixelRatio: 2,
                              backgroundColor: "#ffffff",
                            });
                          }

                          await generateInspectionReportPDF(
                            truck,
                            event.currentOdometer,
                            allTires,
                            tiresHistories,
                            chartImage, // Pasamos la gráfica
                          );
                          toast.success("Acta generada", { id: toastId });
                        } catch (err: any) {
                          toast.error(err.message, { id: toastId });
                        }
                      }}
                      className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all inline-block"
                    >
                      <Download className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* FOOTER CON PAGINACIÓN */}
      <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-500">Mostrar:</span>
          <select
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
            className="p-1.5 text-xs font-bold text-slate-700 border border-slate-200 rounded outline-none"
          >
            <option value={5}>5 filas</option>
            <option value={10}>10 filas</option>
            <option value={20}>20 filas</option>
            <option value={50}>50 filas</option>
          </select>
        </div>

        {lastDoc && (
          <button
            onClick={() => loadHistory(false)}
            disabled={loading}
            className="text-xs font-black text-white bg-slate-800 hover:bg-slate-900 px-4 py-2 rounded-lg uppercase tracking-widest disabled:opacity-50 transition-colors"
          >
            {loading ? "Cargando..." : "Cargar más eventos ↓"}
          </button>
        )}
      </div>
    </div>
  );
};
