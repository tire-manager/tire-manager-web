// src/app/admin/trucks/page.tsx
"use client";
import React, { useEffect, useState } from "react";
import {
  Plus,
  Search,
  Truck as TruckIcon,
  User,
  Settings2,
  Gauge,
  LayoutGrid,
  List,
  Edit2,
  Archive,
} from "lucide-react";
import { getTrucks, updateTruck } from "@/services/truckService";
import { getDrivers } from "@/services/userService";
import { Truck } from "@/types/truck";
import { AddTruckModal } from "@/components/trucks/AddTruckModal";
import { EditTruckModal } from "@/components/trucks/EditTruckModal";
import Link from "next/link";
import toast from "react-hot-toast";

export default function TrucksPage() {
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [driverMap, setDriverMap] = useState<Record<string, string>>({}); // Diccionario ID -> Nombre
  const [loading, setLoading] = useState(true);

  // Vistas y Filtros
  const [viewMode, setViewMode] = useState<"grid" | "table">("table");
  const [searchTerm, setSearchTerm] = useState("");

  // Modales
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedTruck, setSelectedTruck] = useState<Truck | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      // Carga paralela de camiones y choferes para el cruce de datos
      const [trucksData, driversData] = await Promise.all([
        getTrucks(),
        getDrivers(),
      ]);

      setTrucks(trucksData);

      // Armar diccionario de choferes
      const dMap: Record<string, string> = {};
      driversData.forEach((d) => {
        dMap[d.uid] = d.displayName;
      });
      setDriverMap(dMap);
    } catch (error) {
      toast.error("Error al cargar la flota");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredTrucks = trucks.filter(
    (truck) =>
      truck.licensePlate.toLowerCase().includes(searchTerm.toLowerCase()) ||
      truck.brand.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const getStatusBadge = (status: Truck["status"]) => {
    const styles = {
      ACTIVE: "bg-emerald-100 text-emerald-700 border-emerald-200",
      IN_MAINTENANCE: "bg-amber-100 text-amber-700 border-amber-200",
      INACTIVE: "bg-slate-100 text-slate-700 border-slate-200",
    };
    const labels = {
      ACTIVE: "Activo",
      IN_MAINTENANCE: "En Taller",
      INACTIVE: "Inactivo (Baja)",
    };
    return (
      <span
        className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${styles[status]}`}
      >
        {labels[status]}
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

  // Funciones CRUD
  const handleEditClick = (truck: Truck) => {
    setSelectedTruck(truck);
    setIsEditModalOpen(true);
  };

  const handleDeactivateClick = async (truck: Truck) => {
    if (truck.status === "INACTIVE") {
      toast.error("Este vehículo ya está inactivo.");
      return;
    }

    if (truck.assignedDriverId) {
      toast.error("Desasigna al chofer antes de dar de baja el camión.");
      return;
    }

    const confirm = window.confirm(
      `¿Estás seguro de dar de baja la unidad ${truck.licensePlate}? Pasará a estado INACTIVO pero conservará su historial.`,
    );

    if (confirm) {
      setLoading(true);
      try {
        await updateTruck(truck.id, { status: "INACTIVE" });
        toast.success(`Unidad ${truck.licensePlate} dada de baja.`);
        await loadData();
      } catch (err: any) {
        toast.error("Error al dar de baja el vehículo.");
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">
            Flota de Vehículos
          </h1>
          <p className="text-slate-500 text-sm mt-1 font-medium">
            Gestiona unidades, choferes asignados y configuraciones técnicas.
          </p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20"
        >
          <Plus className="w-5 h-5" />
          Registrar Camión
        </button>
      </div>

      {/* Barra de Herramientas */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar por placa o marca..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium"
          />
        </div>

        {/* Toggle de Vistas */}
        <div className="flex bg-slate-100 p-1 rounded-xl w-full sm:w-auto">
          <button
            onClick={() => setViewMode("grid")}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
              viewMode === "grid"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <LayoutGrid className="w-4 h-4" /> Tarjetas
          </button>
          <button
            onClick={() => setViewMode("table")}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
              viewMode === "table"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <List className="w-4 h-4" /> Tabla
          </button>
        </div>
      </div>

      {/* CONTENIDO PRINCIPAL */}
      {loading ? (
        <div className="text-center py-12 text-slate-500 font-bold">
          Cargando flota...
        </div>
      ) : filteredTrucks.length === 0 ? (
        <div className="text-center py-12 text-slate-500 font-bold bg-white rounded-2xl border border-slate-200 border-dashed">
          No se encontraron vehículos.
        </div>
      ) : viewMode === "grid" ? (
        /* VISTA DE TARJETAS (GRID) */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredTrucks.map((truck) => (
            <div
              key={truck.id}
              className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-all flex flex-col group relative"
            >
              {/* Menú de acciones oculto que aparece al pasar el mouse */}
              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 bg-white/90 backdrop-blur-sm p-1 rounded-lg border border-slate-100 shadow-sm z-10">
                <button
                  onClick={() => handleEditClick(truck)}
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

              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-50 p-3 rounded-xl text-blue-600">
                    <TruckIcon className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900 tracking-tight uppercase">
                      {truck.licensePlate}
                    </h3>
                    <p className="text-xs text-slate-500 font-bold uppercase">
                      {truck.brand} {truck.model}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mb-4">{getStatusBadge(truck.status)}</div>

              <div className="grid grid-cols-2 gap-2 mt-2 mb-4">
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex items-center gap-2">
                  <Settings2 className="w-4 h-4 text-slate-400 shrink-0" />
                  <div className="truncate">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Configuración
                    </p>
                    <p className="text-xs font-bold text-slate-700 truncate">
                      {getAxleLabel(truck.axleConfig)}
                    </p>
                  </div>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex items-center gap-2">
                  <Gauge className="w-4 h-4 text-slate-400 shrink-0" />
                  <div className="truncate">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Odómetro
                    </p>
                    <p className="text-xs font-mono font-bold text-emerald-600 truncate">
                      {truck.currentOdometer
                        ? `${truck.currentOdometer.toLocaleString()} KM`
                        : "0 KM"}
                    </p>
                  </div>
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
                  className="text-blue-600 hover:text-blue-800 font-bold text-xs hover:underline uppercase shrink-0"
                >
                  Ver Detalles
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* VISTA DE TABLA */
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider">
                  <th className="p-4 font-black">Placa</th>
                  <th className="p-4 font-black">Marca / Modelo</th>
                  <th className="p-4 font-black">Odómetro</th>
                  <th className="p-4 font-black">Ejes</th>
                  <th className="p-4 font-black">Estado</th>
                  <th className="p-4 font-black">Chofer Asignado</th>
                  <th className="p-4 font-black text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredTrucks.map((truck) => (
                  <tr
                    key={truck.id}
                    className="hover:bg-blue-50/50 transition-colors group"
                  >
                    <td className="p-4 font-black text-blue-600 uppercase">
                      <Link
                        href={`/admin/trucks/${truck.id}`}
                        className="hover:underline flex items-center gap-2"
                      >
                        <TruckIcon className="w-4 h-4 text-blue-400" />
                        {truck.licensePlate}
                      </Link>
                    </td>
                    <td className="p-4">
                      <div className="text-slate-900 font-black uppercase tracking-wide">
                        {truck.brand}
                      </div>
                      <div className="text-slate-500 text-xs uppercase font-bold mt-0.5">
                        {truck.model} ({truck.year})
                      </div>
                    </td>
                    <td className="p-4 font-mono font-black text-emerald-700">
                      {truck.currentOdometer
                        ? `${truck.currentOdometer.toLocaleString()} KM`
                        : "0 KM"}
                    </td>
                    <td className="p-4 font-bold text-slate-700">
                      {getAxleLabel(truck.axleConfig)}
                    </td>
                    <td className="p-4">{getStatusBadge(truck.status)}</td>
                    <td className="p-4 text-slate-600 font-medium">
                      {truck.assignedDriverId ? (
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-slate-400" />
                          <span className="font-black text-slate-900 uppercase">
                            {driverMap[truck.assignedDriverId] || "Asignado"}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic flex items-center gap-2">
                          <User className="w-4 h-4 opacity-50" /> En Patio
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleEditClick(truck)}
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Editar Vehículo"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeactivateClick(truck)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Dar de Baja"
                        >
                          <Archive className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modales */}
      <AddTruckModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={loadData}
      />

      {selectedTruck && (
        <EditTruckModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSuccess={loadData}
          truck={selectedTruck}
        />
      )}
    </div>
  );
}
