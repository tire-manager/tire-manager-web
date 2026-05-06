// src/app/admin/inventory/page.tsx
"use client";
import React, { useEffect, useState } from "react";
import {
  Plus,
  Search,
  Download,
  ChevronLeft,
  ChevronRight,
  Edit2,
  Archive,
} from "lucide-react";
import { getInventory, updateTireStatus } from "@/services/tireService";
import { getTrucks } from "@/services/truckService"; // <-- IMPORTACIÓN NECESARIA
import { Tire } from "@/types/tire";
import { Truck } from "@/types/truck";
import { AddTireModal } from "@/components/inventory/AddTireModal";
// import { EditTireModal } from "@/components/inventory/EditTireModal"; <-- Lo crearemos a continuación
import Link from "next/link";
import { exportTiresToCSV } from "@/lib/utils/exportCSV";
import toast from "react-hot-toast";
import { EditTireModal } from "@/components/inventory/EditTireModal";

export default function InventoryPage() {
  const [tires, setTires] = useState<Tire[]>([]);
  const [truckMap, setTruckMap] = useState<Record<string, string>>({}); // Diccionario ID -> Placa
  const [loading, setLoading] = useState(true);

  // Estados de Filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Estados de Modales
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedTire, setSelectedTire] = useState<Tire | null>(null);

  // Estados de Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const loadData = async () => {
    setLoading(true);
    try {
      // Cargamos llantas y camiones en paralelo para mayor velocidad
      const [tiresData, trucksData] = await Promise.all([
        getInventory(),
        getTrucks(),
      ]);

      setTires(tiresData);

      // Construimos el diccionario de camiones para cruzar los IDs con las Placas
      const map: Record<string, string> = {};
      trucksData.forEach((truck: Truck) => {
        map[truck.id] = truck.licensePlate;
      });
      setTruckMap(map);
    } catch (error) {
      toast.error("Error al cargar el inventario");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const getStatusBadge = (status: Tire["status"]) => {
    const styles = {
      AVAILABLE: "bg-emerald-100 text-emerald-700 border-emerald-200",
      IN_USE: "bg-blue-100 text-blue-700 border-blue-200",
      MAINTENANCE: "bg-amber-100 text-amber-700 border-amber-200",
      DISCARDED: "bg-slate-100 text-slate-700 border-slate-200",
    };
    const labels = {
      AVAILABLE: "En Stock",
      IN_USE: "Rodando",
      MAINTENANCE: "Mantenimiento",
      DISCARDED: "Descartado",
    };
    return (
      <span
        className={`px-3 py-1 rounded-full text-[10px] uppercase font-black tracking-wider border ${styles[status]}`}
      >
        {labels[status]}
      </span>
    );
  };

  // Funciones CRUD
  const handleEditClick = (tire: Tire) => {
    setSelectedTire(tire);
    setIsEditModalOpen(true);
  };

  // ... (importa updateTireStatus en la parte superior si creaste la función dedicada)
  // import { getInventory, updateTireStatus } from "@/services/tireService";

  const handleDiscardClick = async (tire: Tire) => {
    if (tire.status === "IN_USE") {
      toast.error(
        "No puedes descartar una llanta que está rodando. Desmóntala primero usando una Inspección.",
      );
      return;
    }

    if (tire.status === "DISCARDED") {
      toast.error("Esta llanta ya ha sido dada de baja.");
      return;
    }

    const confirm = window.confirm(
      `¿Estás seguro de dar de baja el neumático ${tire.serialNumber}? \n\nEsto lo marcará como DESCARTADO. Su historial se mantendrá para auditoría, pero ya no podrá ser asignado a ningún vehículo.`,
    );

    if (confirm) {
      setLoading(true);
      try {
        // Usamos la función que creamos en el paso 1
        await updateTireStatus(tire.id, "DISCARDED");
        toast.success(
          `Neumático ${tire.serialNumber} dado de baja exitosamente.`,
        );
        // Recargamos los datos para que la tabla se actualice
        await loadData();
      } catch (error: any) {
        toast.error(error.message || "Error al dar de baja el neumático.");
      } finally {
        setLoading(false);
      }
    }
  };

  // Lógica de filtrado combinado
  const filteredTires = tires.filter((tire) => {
    const matchesSearch =
      tire.serialNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tire.brand.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "ALL" || tire.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Lógica de Paginación
  const totalPages = Math.ceil(filteredTires.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentTires = filteredTires.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

  // Resetear página al filtrar
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">
            Inventario de Neumáticos
          </h1>
          <p className="text-slate-500 text-sm mt-1 font-medium">
            Gestiona el stock, costos y audita el desgaste operativo.
          </p>
        </div>

        <div className="flex gap-3 w-full sm:w-auto">
          <button
            onClick={() => exportTiresToCSV(tires)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2.5 rounded-xl font-bold hover:bg-slate-50 transition-colors shadow-sm"
          >
            <Download className="w-4 h-4" />
            <span>Exportar CSV</span>
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-emerald-600 text-white px-4 py-2.5 rounded-xl font-bold hover:bg-emerald-700 transition-colors shadow-sm"
          >
            <Plus className="w-5 h-5" />
            <span>Alta de Neumático</span>
          </button>
        </div>
      </div>

      {/* Barra de Herramientas (Búsqueda y Filtros) */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 grid grid-cols-1 md:grid-cols-12 gap-4">
        <div className="md:col-span-8 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar por número de serie o marca..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium"
          />
        </div>
        <div className="md:col-span-4">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-700"
          >
            <option value="ALL">Todos los estados</option>
            <option value="AVAILABLE">En Stock (Disponibles)</option>
            <option value="IN_USE">Rodando (Asignados)</option>
            <option value="MAINTENANCE">En Mantenimiento</option>
            <option value="DISCARDED">Descartados</option>
          </select>
        </div>
      </div>

      {/* Tabla de Datos */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider">
                <th className="p-4 font-black">N° Serie</th>
                <th className="p-4 font-black">Marca / Modelo</th>
                <th className="p-4 font-black">Costo</th>
                <th className="p-4 font-black">Desgaste (mm)</th>
                <th className="p-4 font-black">Estado</th>
                <th className="p-4 font-black">Asignación</th>
                <th className="p-4 font-black text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {loading ? (
                <tr>
                  <td
                    colSpan={7}
                    className="p-8 text-center text-slate-500 font-bold"
                  >
                    Cargando inventario e historial...
                  </td>
                </tr>
              ) : currentTires.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="p-8 text-center text-slate-500 font-bold"
                  >
                    No se encontraron neumáticos con estos filtros.
                  </td>
                </tr>
              ) : (
                currentTires.map((tire) => (
                  <tr
                    key={tire.id}
                    className="hover:bg-blue-50/50 transition-colors group"
                  >
                    <td className="p-4 font-black text-blue-600">
                      <Link
                        href={`/admin/inventory/${tire.id}`}
                        className="hover:underline flex items-center gap-2"
                      >
                        {tire.serialNumber}
                      </Link>
                    </td>
                    <td className="p-4">
                      <div className="text-slate-900 font-black uppercase tracking-wide">
                        {tire.brand}
                      </div>
                      <div className="text-slate-500 text-xs uppercase font-bold mt-0.5">
                        {tire.model}
                      </div>
                    </td>
                    <td className="p-4 font-mono font-black text-emerald-700">
                      {tire.price ? (
                        `${tire.currency === "USD" ? "$" : "S/"} ${tire.price.toFixed(2)}`
                      ) : (
                        <span className="text-slate-300 italic font-medium">
                          N/A
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${tire.currentTreadDepth < 3 ? "bg-red-500" : tire.currentTreadDepth < 6 ? "bg-amber-400" : "bg-emerald-500"}`}
                            style={{
                              width: `${Math.min((tire.currentTreadDepth / 12) * 100, 100)}%`,
                            }}
                          ></div>
                        </div>
                        <span className="font-bold text-slate-700 font-mono">
                          {tire.currentTreadDepth} mm
                        </span>
                      </div>
                    </td>
                    <td className="p-4">{getStatusBadge(tire.status)}</td>
                    <td className="p-4 text-slate-600 font-medium">
                      {tire.truckId ? (
                        <span className="flex items-center gap-1.5">
                          Unidad{" "}
                          <span className="font-black text-slate-900 bg-slate-100 px-2 py-0.5 rounded uppercase">
                            {/* AQUÍ SE REALIZA EL CRUCE DE DATOS */}
                            {truckMap[tire.truckId] || tire.truckId}
                          </span>
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">
                          En Almacén
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleEditClick(tire)}
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Editar Datos Base"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDiscardClick(tire)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Dar de Baja (Descartar)"
                        >
                          <Archive className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer de Paginación */}
        {!loading && totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 flex justify-between items-center bg-slate-50">
            <p className="text-sm font-medium text-slate-500">
              Mostrando {startIndex + 1} a{" "}
              {Math.min(startIndex + itemsPerPage, filteredTires.length)} de{" "}
              {filteredTires.length} neumáticos
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 disabled:opacity-50 transition-colors shadow-sm"
              >
                <ChevronLeft className="w-5 h-5 text-slate-600" />
              </button>
              <button
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages}
                className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 disabled:opacity-50 transition-colors shadow-sm"
              >
                <ChevronRight className="w-5 h-5 text-slate-600" />
              </button>
            </div>
          </div>
        )}
      </div>

      <AddTireModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={loadData}
      />

      <EditTireModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={loadData}
        tire={selectedTire}
      />
    </div>
  );
}
