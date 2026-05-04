// src/app/admin/inventory/page.tsx
"use client";
import React, { useEffect, useState } from "react";
import { Plus, Search, Filter, Download } from "lucide-react";
import { getInventory } from "@/services/tireService";
import { Tire } from "@/types/tire";
import { AddTireModal } from "@/components/inventory/AddTireModal";
import Link from "next/link";
import { exportTiresToCSV } from "@/lib/utils/exportCSV";

export default function InventoryPage() {
  const [tires, setTires] = useState<Tire[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchTires = async () => {
    setLoading(true);
    const data = await getInventory();
    setTires(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchTires();
  }, []);
  // Función auxiliar para los colores de los estados
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
        className={`px-3 py-1 rounded-full text-xs font-semibold border ${styles[status]}`}
      >
        {labels[status]}
      </span>
    );
  };

  const filteredTires = tires.filter(
    (tire) =>
      tire.serialNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tire.brand.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Inventario de Neumáticos
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Gestiona el stock y monitorea el desgaste de la flota.
          </p>
        </div>

        <div className="flex gap-3 w-full sm:w-auto">
          {/* NUEVO BOTÓN DE EXPORTAR */}
          <button
            onClick={() => exportTiresToCSV(tires)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2.5 rounded-xl font-bold hover:bg-slate-50 transition-colors shadow-sm"
          >
            <Download className="w-4 h-4" />
            <span>Exportar CSV</span>
          </button>

          {/* EL BOTÓN QUE YA TENÍAS */}
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-sm"
          >
            <Plus className="w-5 h-5" />
            <span>Añadir Neumático</span>
          </button>
        </div>
      </div>

      {/* Barra de Herramientas (Búsqueda y Filtros) */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar por número de serie o marca..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 font-medium text-sm transition-all">
          <Filter className="w-4 h-4" />
          Filtros
        </button>
      </div>

      {/* Tabla de Datos */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-sm">
                <th className="p-4 font-semibold">N° Serie</th>
                <th className="p-4 font-semibold">Marca / Modelo</th>
                <th className="p-4 font-semibold">Desgaste (mm)</th>
                <th className="p-4 font-semibold">Estado</th>
                <th className="p-4 font-semibold">Asignación</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500">
                    Cargando inventario...
                  </td>
                </tr>
              ) : filteredTires.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500">
                    No se encontraron neumáticos.
                  </td>
                </tr>
              ) : (
                filteredTires.map((tire) => (
                  <tr
                    key={tire.id}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="p-4 font-medium text-blue-500">
                      <Link href={`/admin/inventory/${tire.id}`}>
                        {tire.serialNumber}
                      </Link>
                    </td>
                    <td className="p-4">
                      <div className="text-slate-900 font-medium">
                        {tire.brand}
                      </div>
                      <div className="text-slate-500 text-xs">{tire.model}</div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden">
                          {/* Barra de progreso visual (max 12mm aprox para neumáticos nuevos) */}
                          <div
                            className={`h-full ${tire.currentTreadDepth < 3 ? "bg-red-500" : tire.currentTreadDepth < 6 ? "bg-amber-400" : "bg-emerald-500"}`}
                            style={{
                              width: `${Math.min((tire.currentTreadDepth / 12) * 100, 100)}%`,
                            }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium text-slate-700">
                          {tire.currentTreadDepth} mm
                        </span>
                      </div>
                    </td>
                    <td className="p-4">{getStatusBadge(tire.status)}</td>
                    <td className="p-4 text-sm text-slate-600">
                      {tire.truckId ? (
                        <span>
                          Camión{" "}
                          <span className="font-semibold text-slate-900">
                            {tire.truckId}
                          </span>
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">
                          No asignado
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AddTireModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchTires} // Al guardar con éxito, refresca la tabla automáticamente
      />
    </div>
  );
}
