// src/components/trucks/TrucksTable.tsx
"use client";
import React, { useState, useEffect } from "react";
import {
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Edit2,
  Archive,
  LayoutGrid,
  List,
  Truck as TruckIcon,
  Settings2,
  Gauge,
  User,
  X,
} from "lucide-react";
import { Truck } from "@/types/truck";
import { getPaginatedTrucks, updateTruck } from "@/services/truckService";
import Link from "next/link";
import toast from "react-hot-toast";

interface TrucksTableProps {
  driverMap: Record<string, string>;
  onEditTruck: (truck: Truck) => void;
  onRefreshNeeded: () => void;
}

export const TrucksTable: React.FC<TrucksTableProps> = ({
  driverMap,
  onEditTruck,
  onRefreshNeeded,
}) => {
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [loading, setLoading] = useState(true);

  // Vistas, Filtros y Búsqueda
  const [viewMode, setViewMode] = useState<"grid" | "table">("table");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [isFilterPopupOpen, setIsFilterPopupOpen] = useState(false);

  // Paginación
  const [pageSize, setPageSize] = useState(10);
  const [pageIndex, setPageIndex] = useState(0);
  const [cursors, setCursors] = useState<any[]>([null]);
  const [hasNextPage, setHasNextPage] = useState(false);

  // Lógica unificada para evitar Race Conditions
  const loadData = async (
    cursorIdx: number,
    currentSearch: string,
    currentStatus: string,
    currentSize: number,
  ) => {
    setLoading(true);
    try {
      const { trucks: newTrucks, lastVisible } = await getPaginatedTrucks(
        currentSize,
        cursors[cursorIdx],
        currentStatus,
        currentSearch,
      );
      setTrucks(newTrucks);
      setHasNextPage(!!lastVisible);

      if (lastVisible) {
        setCursors((prev) => {
          const newCursors = [...prev];
          newCursors[cursorIdx + 1] = lastVisible;
          return newCursors;
        });
      }
    } catch (error) {
      toast.error("Error al cargar la flota");
    } finally {
      setLoading(false);
    }
  };

  // Efecto único para búsqueda y filtros
  useEffect(() => {
    const delay = setTimeout(() => {
      setPageIndex(0);
      setCursors([null]);
      loadData(0, searchTerm, statusFilter, pageSize);
    }, 500);
    return () => clearTimeout(delay);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, statusFilter, pageSize]);

  // Efecto único para botones de paginación (Siguiente/Anterior)
  useEffect(() => {
    if (pageIndex > 0) {
      loadData(pageIndex, searchTerm, statusFilter, pageSize);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageIndex]);

  const handleDeactivateClick = async (truck: Truck) => {
    if (truck.status === "INACTIVE") return toast.error("Ya está inactivo.");
    if (truck.assignedDriverId)
      return toast.error("Desasigna al chofer primero.");

    if (window.confirm(`¿Dar de baja la unidad ${truck.licensePlate}?`)) {
      setLoading(true);
      try {
        await updateTruck(truck.id, { status: "INACTIVE" });
        toast.success(`Unidad dada de baja.`);
        loadData(pageIndex, searchTerm, statusFilter, pageSize);
        onRefreshNeeded();
      } catch (err) {
        toast.error("Error al dar de baja.");
      } finally {
        setLoading(false);
      }
    }
  };

  const getStatusBadge = (status: Truck["status"]) => {
    const styles: Record<string, string> = {
      ACTIVE: "bg-emerald-100 text-emerald-700",
      IN_MAINTENANCE: "bg-amber-100 text-amber-700",
      INACTIVE: "bg-slate-100 text-slate-700",
      DISCARDED: "bg-red-100 text-red-700",
    };
    const labels: Record<string, string> = {
      ACTIVE: "Activo",
      IN_MAINTENANCE: "En Taller",
      INACTIVE: "Inactivo",
      DISCARDED: "Baja",
    };
    const currentStyle = status ? styles[status] : styles.INACTIVE;
    const currentLabel = status ? labels[status] : labels.INACTIVE;
    return (
      <span
        className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${currentStyle}`}
      >
        {currentLabel}
      </span>
    );
  };

  const getAxleLabel = (config?: string) => {
    const labels: Record<string, string> = {
      "2_EJES": "2 Ejes",
      "3_EJES_10_LLANTAS": "3 Ejes (10L)",
      "3_EJES_BALON": "3 Ejes Balón",
      "3_EJES_12_LLANTAS": "3 Ejes (12L)",
      "4_EJES": "4 Ejes",
    };
    return config && labels[config] ? labels[config] : "No definida";
  };

  return (
    <div className="space-y-6">
      {/* BARRA DE HERRAMIENTAS */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col sm:flex-row gap-4 items-center justify-between relative">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar por placa (Ej. W7A)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none uppercase font-bold"
          />
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none">
            <button
              onClick={() => setIsFilterPopupOpen(!isFilterPopupOpen)}
              className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border transition-colors ${statusFilter !== "ALL" ? "bg-blue-50 border-blue-200 text-blue-700" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"}`}
            >
              <Filter className="w-4 h-4" /> Filtros
            </button>

            {isFilterPopupOpen && (
              <div className="absolute right-0 top-12 w-64 bg-white border border-slate-200 shadow-2xl rounded-2xl z-50 animate-in fade-in slide-in-from-top-2">
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-2xl">
                  <h3 className="font-black text-slate-700 text-sm">
                    Estado del Vehículo
                  </h3>
                  <button onClick={() => setIsFilterPopupOpen(false)}>
                    <X className="w-4 h-4 text-slate-400 hover:text-slate-600" />
                  </button>
                </div>
                <div className="p-2">
                  {[
                    "ALL",
                    "ACTIVE",
                    "IN_MAINTENANCE",
                    "INACTIVE",
                    "DISCARDED",
                  ].map((status) => (
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
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded-lg transition-all ${viewMode === "grid" ? "bg-white text-blue-600 shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`p-2 rounded-lg transition-all ${viewMode === "table" ? "bg-white text-blue-600 shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* CONTENIDO (GRILLA O TABLA) */}
      {loading ? (
        <div className="text-center py-12 text-slate-500 font-bold bg-white rounded-2xl border border-slate-200">
          Cargando flota...
        </div>
      ) : trucks.length === 0 ? (
        <div className="text-center py-12 text-slate-500 font-bold bg-white rounded-2xl border border-slate-200 border-dashed">
          No se encontraron vehículos.
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {trucks.map((truck, idx) => {
            const itemNumber = pageIndex * pageSize + idx + 1;
            return (
              <div
                key={truck.id}
                className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-all flex flex-col group relative"
              >
                <span className="absolute top-4 left-4 text-[10px] font-black text-slate-400 bg-slate-100 px-2 py-1 rounded">
                  #{itemNumber}
                </span>
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 bg-white/90 backdrop-blur-sm p-1 rounded-lg border border-slate-100 shadow-sm z-10">
                  <button
                    onClick={() => onEditTruck(truck)}
                    className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeactivateClick(truck)}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md"
                  >
                    <Archive className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex justify-center mb-4 mt-6">
                  <div className="bg-blue-50 p-4 rounded-full text-blue-600">
                    <TruckIcon className="w-8 h-8" />
                  </div>
                </div>
                <div className="text-center mb-4">
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight uppercase">
                    {truck.licensePlate}
                  </h3>
                  <p className="text-xs text-slate-500 font-bold uppercase">
                    {truck.brand} {truck.model}
                  </p>
                </div>
                <div className="flex justify-center mb-4">
                  {getStatusBadge(truck.status)}
                </div>

                <div className="grid grid-cols-2 gap-2 mb-4">
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-center truncate">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">
                      Ejes
                    </p>
                    <p className="text-xs font-bold text-slate-700">
                      {getAxleLabel(truck.axleConfig)}
                    </p>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-center truncate">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">
                      KM
                    </p>
                    <p className="text-xs font-mono font-bold text-emerald-600">
                      {(truck.currentOdometer || 0).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="mt-auto pt-4 border-t border-slate-100 flex justify-between items-center text-sm">
                  <div className="flex items-center gap-2 text-slate-600 truncate pr-2">
                    <User className="w-4 h-4 shrink-0" />
                    <span
                      className={`truncate ${truck.assignedDriverId ? "font-bold text-slate-900" : "italic text-slate-400"}`}
                    >
                      {truck.assignedDriverId
                        ? driverMap[truck.assignedDriverId] || "Asignado"
                        : "Sin chofer"}
                    </span>
                  </div>
                  <Link
                    href={`/admin/trucks/${truck.id}`}
                    className="text-blue-600 hover:text-blue-800 font-bold text-[10px] hover:underline uppercase shrink-0"
                  >
                    Detalles
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto min-h-[400px]">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-200">
                  <th className="px-6 py-4 w-16">N°</th>
                  <th className="px-6 py-4">Placa</th>
                  <th className="px-6 py-4">Marca / Modelo</th>
                  <th className="px-6 py-4">Odómetro</th>
                  <th className="px-6 py-4">Ejes</th>
                  <th className="px-6 py-4">Estado</th>
                  <th className="px-6 py-4">Chofer</th>
                  <th className="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {trucks.map((truck, idx) => {
                  const itemNumber = pageIndex * pageSize + idx + 1;
                  return (
                    <tr
                      key={truck.id}
                      className="hover:bg-slate-50/80 transition-colors group"
                    >
                      <td className="px-6 py-4 font-bold text-slate-400">
                        #{itemNumber}
                      </td>
                      <td className="px-6 py-4 font-black text-blue-600 uppercase">
                        <Link
                          href={`/admin/trucks/${truck.id}`}
                          className="hover:underline"
                        >
                          {truck.licensePlate}
                        </Link>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-black text-slate-800 uppercase">
                          {truck.brand}
                        </p>
                        <p className="text-xs font-bold text-slate-400 uppercase">
                          {truck.model}
                        </p>
                      </td>
                      <td className="px-6 py-4 font-mono font-bold text-emerald-700">
                        {(truck.currentOdometer || 0).toLocaleString()} KM
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-700 text-xs">
                        {getAxleLabel(truck.axleConfig)}
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(truck.status)}
                      </td>
                      <td className="px-6 py-4 text-slate-600 font-medium text-xs">
                        {truck.assignedDriverId ? (
                          <span className="font-black text-slate-900 uppercase">
                            {driverMap[truck.assignedDriverId] || "Asignado"}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">
                            En Patio
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => onEditTruck(truck)}
                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeactivateClick(truck)}
                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                          >
                            <Archive className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* FOOTER: PAGINACIÓN Y CONTROL DE ÍTEMS */}
      <div className="p-4 bg-white border border-slate-200 rounded-2xl flex flex-col sm:flex-row justify-between items-center gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
            Mostrar:
          </span>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
            }}
            className="bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 py-1.5 px-2 rounded-lg outline-none cursor-pointer"
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
            className="p-2 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 disabled:opacity-40 transition-colors"
          >
            <ChevronLeft className="w-4 h-4 text-slate-600" />
          </button>
          <span className="text-xs font-black text-slate-500 uppercase">
            Pág. {pageIndex + 1}
          </span>
          <button
            onClick={() => setPageIndex((p) => p + 1)}
            disabled={!hasNextPage || loading}
            className="p-2 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 disabled:opacity-40 transition-colors"
          >
            <ChevronRight className="w-4 h-4 text-slate-600" />
          </button>
        </div>
      </div>
    </div>
  );
};
