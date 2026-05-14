// src/components/inventory/InventoryTable.tsx
"use client";
import React, { useState, useEffect } from "react";
import {
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Edit2,
  Archive,
  X,
} from "lucide-react";
import { Tire } from "@/types/tire";
import {
  getPaginatedInventory,
  updateTireStatus,
} from "@/services/tireService";
import Link from "next/link";
import toast from "react-hot-toast";

interface InventoryTableProps {
  truckMap: Record<string, string>;
  onEditTire: (tire: Tire) => void;
  onRefreshNeeded: () => void;
}

export const InventoryTable: React.FC<InventoryTableProps> = ({
  truckMap,
  onEditTire,
  onRefreshNeeded,
}) => {
  const [tires, setTires] = useState<Tire[]>([]);
  const [loading, setLoading] = useState(true);

  // Estados de Filtros y Búsqueda
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [isFilterPopupOpen, setIsFilterPopupOpen] = useState(false);

  // Estados de Paginación Escalable
  const [pageSize, setPageSize] = useState(10);
  const [pageIndex, setPageIndex] = useState(0);
  const [cursors, setCursors] = useState<any[]>([null]);
  const [hasNextPage, setHasNextPage] = useState(false);

  const loadData = async (
    cursorIdx: number,
    currentSearch: string,
    currentStatus: string,
    currentSize: number,
  ) => {
    setLoading(true);
    try {
      const { tires: newTires, lastVisible } = await getPaginatedInventory(
        currentSize,
        cursors[cursorIdx],
        currentStatus,
        currentSearch,
      );

      setTires(newTires);
      setHasNextPage(!!lastVisible);

      if (lastVisible) {
        setCursors((prev) => {
          const newCursors = [...prev];
          newCursors[cursorIdx + 1] = lastVisible;
          return newCursors;
        });
      }
    } catch (error) {
      toast.error("Error al cargar inventario");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delay = setTimeout(() => {
      setPageIndex(0);
      setCursors([null]);
      loadData(0, searchTerm, statusFilter, pageSize);
    }, 500);
    return () => clearTimeout(delay);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, statusFilter, pageSize]);

  useEffect(() => {
    if (pageIndex > 0) {
      loadData(pageIndex, searchTerm, statusFilter, pageSize);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageIndex]);

  const handleDiscardClick = async (tire: Tire) => {
    if (tire.status === "IN_USE")
      return toast.error("Desmonta la llanta primero.");
    if (tire.status === "DISCARDED")
      return toast.error("Ya está dada de baja.");

    if (window.confirm(`¿Dar de baja el neumático ${tire.serialNumber}?`)) {
      setLoading(true);
      try {
        await updateTireStatus(tire.id, "DISCARDED");
        toast.success("Baja exitosa.");
        loadData(pageIndex, searchTerm, statusFilter, pageSize);
        onRefreshNeeded();
      } catch (error: any) {
        toast.error(error.message);
      } finally {
        setLoading(false);
      }
    }
  };

  const getStatusBadge = (status: Tire["status"]) => {
    const styles: Record<string, string> = {
      AVAILABLE: "bg-emerald-100 text-emerald-700",
      IN_USE: "bg-blue-100 text-blue-700",
      MAINTENANCE: "bg-amber-100 text-amber-700",
      DISCARDED: "bg-slate-100 text-slate-700",
    };
    const labels: Record<string, string> = {
      AVAILABLE: "En Stock",
      IN_USE: "Rodando",
      MAINTENANCE: "Taller",
      DISCARDED: "Baja",
    };
    return (
      <span
        className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${styles[status]}`}
      >
        {labels[status]}
      </span>
    );
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      {/* BARRA DE HERRAMIENTAS */}
      <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row gap-4 justify-between items-center relative">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Buscar por serie (Ej. SERIE-123)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setIsFilterPopupOpen(!isFilterPopupOpen)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border transition-colors ${statusFilter !== "ALL" ? "bg-blue-50 border-blue-200 text-blue-700" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 shadow-sm"}`}
          >
            <Filter className="w-4 h-4" /> Filtros
          </button>

          {isFilterPopupOpen && (
            <div className="absolute top-16 right-4 w-64 bg-white border border-slate-200 shadow-2xl rounded-2xl z-50 animate-in fade-in slide-in-from-top-2">
              <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-2xl">
                <h3 className="font-black text-slate-700 text-sm">
                  Estado Operativo
                </h3>
                <button
                  onClick={() => setIsFilterPopupOpen(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-2">
                {["ALL", "AVAILABLE", "IN_USE", "MAINTENANCE", "DISCARDED"].map(
                  (status) => (
                    <button
                      key={status}
                      onClick={() => {
                        setStatusFilter(status);
                        setIsFilterPopupOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2.5 rounded-lg text-sm font-bold transition-colors ${statusFilter === status ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-50"}`}
                    >
                      {status === "ALL"
                        ? "Todos los estados"
                        : getStatusBadge(status as any)}
                    </button>
                  ),
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* TABLA DE DATOS */}
      <div className="overflow-x-auto min-h-[400px]">
        <table className="w-full text-left border-collapse">
          <thead>
            {/* CERO COMENTARIOS DENTRO DEL TR */}
            <tr className="bg-slate-50 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-200">
              <th className="px-6 py-4 w-16">N°</th>
              <th className="px-6 py-4">N° Serie</th>
              <th className="px-6 py-4">Marca / Modelo</th>
              <th className="px-6 py-4">Desgaste</th>
              <th className="px-6 py-4">Estado</th>
              <th className="px-6 py-4">Asignación</th>
              <th className="px-6 py-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {loading ? (
              <tr>
                <td
                  colSpan={7}
                  className="p-8 text-center text-slate-500 font-bold"
                >
                  Cargando inventario...
                </td>
              </tr>
            ) : tires.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="p-8 text-center text-slate-500 font-medium"
                >
                  No se encontraron resultados.
                </td>
              </tr>
            ) : (
              tires.map((tire, idx) => {
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
                      <Link
                        href={`/admin/inventory/${tire.id}`}
                        className="hover:underline"
                      >
                        {tire.serialNumber}
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-black text-slate-800 uppercase">
                        {tire.brand}
                      </p>
                      <p className="text-xs font-bold text-slate-400 uppercase">
                        {tire.model}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${tire.currentTreadDepth < 4 ? "bg-red-500" : tire.currentTreadDepth < 8 ? "bg-amber-400" : "bg-emerald-500"}`}
                            style={{
                              width: `${Math.min((tire.currentTreadDepth / 16) * 100, 100)}%`,
                            }}
                          ></div>
                        </div>
                        <span className="font-bold text-slate-700 text-xs">
                          {tire.currentTreadDepth} mm
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">{getStatusBadge(tire.status)}</td>
                    <td className="px-6 py-4 text-xs font-bold text-slate-600">
                      {tire.truckId ? (
                        <span className="bg-slate-100 px-2 py-1 rounded text-slate-800">
                          U: {truckMap[tire.truckId] || tire.truckId}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">Almacén</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => onEditTire(tire)}
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDiscardClick(tire)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                        >
                          <Archive className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* FOOTER: PAGINACIÓN Y CONTROL DE ÍTEMS */}
      <div className="p-4 border-t border-slate-100 bg-slate-50 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
            Mostrar:
          </span>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
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
            disabled={pageIndex === 0 || loading}
            className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 disabled:opacity-40 transition-colors shadow-sm"
          >
            <ChevronLeft className="w-4 h-4 text-slate-600" />
          </button>
          <span className="text-xs font-black text-slate-500 uppercase">
            Pág. {pageIndex + 1}
          </span>
          <button
            onClick={() => setPageIndex((p) => p + 1)}
            disabled={!hasNextPage || loading}
            className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 disabled:opacity-40 transition-colors shadow-sm"
          >
            <ChevronRight className="w-4 h-4 text-slate-600" />
          </button>
        </div>
      </div>
    </div>
  );
};
