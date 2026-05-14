// src/components/trucks/TruckHistoryLog.tsx
"use client";
import React, { useState, useEffect, useRef } from "react";
import {
  Activity,
  Camera,
  Download,
  Filter,
  Calendar,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import { Tire, TireHistory } from "@/types/tire";
import { Truck } from "@/types/truck";
import { getTruckInspectionHistory } from "@/services/tireService";
import { generateInspectionReportPDF } from "@/lib/utils/exportInspectionPDF";
import toast from "react-hot-toast";

interface TruckHistoryLogProps {
  truck: Truck;
  allTires: Tire[];
  tiresHistories: Record<string, TireHistory[]>;
}

export const TruckHistoryLog: React.FC<TruckHistoryLogProps> = ({
  truck,
  allTires,
  tiresHistories,
}) => {
  const [historyEvents, setHistoryEvents] = useState<TireHistory[]>([]);
  const [loading, setLoading] = useState(false);

  // --- ESTADOS DE FILTRADO TIPO POPUP ---
  const [isFilterPopupOpen, setIsFilterPopupOpen] = useState(false);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  // Referencia para cerrar el popup al hacer clic afuera (opcional)
  const popupRef = useRef<HTMLDivElement>(null);

  // --- ESTADOS DE PAGINACIÓN ---
  const [pageIndex, setPageIndex] = useState(0);
  const [cursors, setCursors] = useState<any[]>([null]);
  const [hasNextPage, setHasNextPage] = useState(false);

  // --- ESTADO PARA EXPANDIR ACORDEONES ---
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(
    {},
  );

  const toggleGroup = (odometer: number) => {
    setExpandedGroups((prev) => ({ ...prev, [odometer]: !prev[odometer] }));
  };

  const getSerialNumber = (tireId: string) => {
    const foundTire = allTires.find((t) => t.id === tireId);
    return foundTire ? foundTire.serialNumber : tireId.slice(0, 8);
  };

  // --- CARGA DE DATOS ---
  const loadHistory = async (cursorIndex: number) => {
    setLoading(true);
    try {
      // Traemos 50 eventos (aprox 5 inspecciones completas) para agrupar
      const { events, lastVisible } = await getTruckInspectionHistory(
        truck.id,
        50,
        cursors[cursorIndex],
        startDate,
        endDate,
      );

      setHistoryEvents(events);
      setHasNextPage(!!lastVisible);

      if (lastVisible) {
        setCursors((prev) => {
          const newCursors = [...prev];
          newCursors[cursorIndex + 1] = lastVisible;
          return newCursors;
        });
      }
    } catch (error) {
      console.error("Error cargando bitácora:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory(pageIndex);
  }, [pageIndex, truck.id]);

  const applyDateFilters = () => {
    setPageIndex(0);
    setCursors([null]);
    setIsFilterPopupOpen(false); // Cerramos el popup al aplicar
    loadHistory(0);
  };

  const clearFilters = () => {
    setStartDate("");
    setEndDate("");
    setPageIndex(0);
    setCursors([null]);
    setIsFilterPopupOpen(false);
    // Forzamos la recarga sin fechas
    loadHistory(0);
  };

  // --- AGRUPACIÓN LÓGICA POR ODÓMETRO ---
  const groupedData = historyEvents.reduce(
    (acc, ev) => {
      const odo = ev.currentOdometer || 0;
      if (!acc[odo]) {
        acc[odo] = {
          odometer: odo,
          date: ev.date
            ? ev.date.seconds
              ? new Date(ev.date.seconds * 1000)
              : new Date(ev.date)
            : null,
          events: [],
          hasPhotos: false,
          unmountCount: 0,
        };
      }
      acc[odo].events.push(ev);
      if (ev.imageUrl) acc[odo].hasPhotos = true;
      if (ev.type === "UNMOUNT") acc[odo].unmountCount++;
      return acc;
    },
    {} as Record<number, any>,
  );

  const groupedArray = Object.values(groupedData).sort(
    (a, b) => b.odometer - a.odometer,
  );

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 mt-8 overflow-hidden">
      {/* --- CABECERA Y BOTÓN DE FILTROS --- */}
      <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center relative">
        <h2 className="font-black text-slate-800 flex items-center gap-2">
          <Activity className="w-5 h-5 text-blue-600" />
          Bitácora de Eventos
        </h2>

        {/* BOTÓN PARA ABRIR POPUP */}
        <div ref={popupRef}>
          <button
            onClick={() => setIsFilterPopupOpen(!isFilterPopupOpen)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold border transition-colors ${
              startDate || endDate
                ? "bg-blue-50 border-blue-200 text-blue-700"
                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            <Filter className="w-4 h-4" />
            Filtros
            {(startDate || endDate) && (
              <span className="flex items-center justify-center w-5 h-5 bg-blue-600 text-white text-[10px] rounded-full ml-1">
                1
              </span>
            )}
          </button>

          {/* POPUP DE FILTROS */}
          {isFilterPopupOpen && (
            <div className="absolute top-20 right-6 w-80 bg-white border border-slate-200 shadow-2xl rounded-2xl z-50 animate-in fade-in slide-in-from-top-4">
              <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-2xl">
                <h3 className="font-black text-slate-700 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-600" /> Rango de Fechas
                </h3>
                <button
                  onClick={() => setIsFilterPopupOpen(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5 space-y-4">
                <div>
                  <label className="block text-xs font-black text-slate-500 uppercase mb-1">
                    Desde
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-500 uppercase mb-1">
                    Hasta
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="p-4 border-t border-slate-100 bg-slate-50 rounded-b-2xl flex gap-3">
                <button
                  onClick={clearFilters}
                  className="flex-1 py-2 text-sm font-bold text-slate-600 hover:bg-slate-200 bg-slate-100 rounded-lg transition-colors"
                >
                  Limpiar
                </button>
                <button
                  onClick={applyDateFilters}
                  className="flex-1 py-2 text-sm font-black text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-md transition-colors"
                >
                  Aplicar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* --- TABLA AGRUPADA --- */}
      <div className="overflow-x-auto min-h-[300px]">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-200">
              <th className="px-6 py-4 w-16">Item</th>
              <th className="px-6 py-4">Fecha / Inspección</th>
              <th className="px-6 py-4">Resumen del Evento</th>
              <th className="px-6 py-4 text-right">Descargar Acta</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td
                  colSpan={4}
                  className="p-10 text-center text-slate-500 font-bold"
                >
                  Cargando inspecciones...
                </td>
              </tr>
            ) : groupedArray.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="p-10 text-center text-slate-500 font-medium"
                >
                  No se encontraron inspecciones.
                </td>
              </tr>
            ) : (
              groupedArray.map((group, index) => {
                const isExpanded = expandedGroups[group.odometer];
                const itemNumber = pageIndex * 5 + index + 1; // Aproximado visual

                return (
                  <React.Fragment key={group.odometer}>
                    {/* FILA PRINCIPAL (EL GRUPO) */}
                    <tr
                      onClick={() => toggleGroup(group.odometer)}
                      className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                    >
                      <td className="px-6 py-4">
                        <span className="text-xs font-black text-slate-400 bg-slate-100 px-2 py-1 rounded-md">
                          #{itemNumber}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-800 text-sm flex items-center gap-2">
                          {group.date ? group.date.toLocaleDateString() : "N/D"}
                        </p>
                        <p className="text-xs font-black text-blue-600 bg-blue-50 inline-block px-2 py-0.5 rounded mt-1 border border-blue-100">
                          ODO: {group.odometer.toLocaleString()} KM
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-bold text-slate-600">
                            {group.events.length} neumáticos analizados
                          </span>
                          {group.unmountCount > 0 && (
                            <span className="text-[10px] font-black bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                              {group.unmountCount} Retiros
                            </span>
                          )}
                          {group.hasPhotos && (
                            <span
                              title="Contiene fotos"
                              className="flex items-center"
                            >
                              <Camera className="w-4 h-4 text-amber-500" />
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right flex justify-end gap-2 items-center">
                        <button
                          title="Descargar Acta"
                          onClick={(e) => {
                            e.stopPropagation();
                            const toastId = toast.loading(
                              "Generando Acta Específica...",
                            );
                            generateInspectionReportPDF(
                              truck,
                              group.odometer,
                              allTires,
                              tiresHistories,
                            )
                              .then(() =>
                                toast.success("Acta generada", { id: toastId }),
                              )
                              .catch((err) =>
                                toast.error(err.message, { id: toastId }),
                              );
                          }}
                          className="p-2 text-blue-600 hover:bg-blue-100 bg-blue-50 border border-blue-200 rounded-lg transition-all"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5 text-slate-400" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-slate-400" />
                        )}
                      </td>
                    </tr>

                    {/* FILAS SECUNDARIAS (LOS DETALLES EXPANDIDOS) */}
                    {isExpanded && (
                      <tr className="bg-slate-50/50">
                        <td
                          colSpan={4}
                          className="p-0 border-b border-slate-200"
                        >
                          <div className="px-8 py-4 animate-in fade-in slide-in-from-top-2">
                            <table className="w-full text-left">
                              <tbody>
                                {group.events.map((ev: any) => (
                                  <tr
                                    key={ev.id}
                                    className="border-b border-slate-100 last:border-0"
                                  >
                                    <td className="py-2 pl-4 w-1/3 font-bold text-slate-700 text-xs">
                                      SERIE: {getSerialNumber(ev.tireId)}
                                    </td>
                                    <td className="py-2 w-1/4">
                                      <span
                                        className={`text-[9px] font-black px-2 py-0.5 rounded ${
                                          ev.type === "UNMOUNT"
                                            ? "bg-red-100 text-red-700"
                                            : ev.type === "MOUNT"
                                              ? "bg-emerald-100 text-emerald-700"
                                              : "bg-white border border-slate-200 text-slate-600"
                                        }`}
                                      >
                                        {ev.type}
                                      </span>
                                    </td>
                                    <td className="py-2 text-xs text-slate-500 font-medium">
                                      <div className="flex items-center gap-2">
                                        {ev.imageUrl && (
                                          <Camera className="w-3 h-3 text-amber-500" />
                                        )}
                                        {ev.notes || "Inspección de rutina"}
                                        <span className="font-bold text-slate-700 ml-2">
                                          ({ev.newTreadDepth} mm)
                                        </span>
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* --- FOOTER CON PAGINACIÓN (ANTERIOR / SIGUIENTE) --- */}
      <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
        <button
          onClick={() => setPageIndex((prev) => prev - 1)}
          disabled={pageIndex === 0 || loading}
          className="flex items-center gap-1 text-sm font-bold text-slate-600 bg-white border border-slate-300 px-4 py-2 rounded-xl hover:bg-slate-100 disabled:opacity-40 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" /> Anterior
        </button>

        <span className="text-xs font-black text-slate-400 uppercase tracking-widest bg-white px-3 py-1 rounded-md border border-slate-200 shadow-sm">
          Pág. {pageIndex + 1}
        </span>

        <button
          onClick={() => setPageIndex((prev) => prev + 1)}
          disabled={!hasNextPage || loading}
          className="flex items-center gap-1 text-sm font-bold text-slate-600 bg-white border border-slate-300 px-4 py-2 rounded-xl hover:bg-slate-100 disabled:opacity-40 transition-colors"
        >
          Siguiente <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
