// src/app/admin/trucks/page.tsx
"use client";
import React, { useEffect, useState } from "react";
import { Plus, Search, Truck as TruckIcon, User } from "lucide-react";
import { getTrucks } from "@/services/truckService";
import { Truck } from "@/types/truck";
import { AddTruckModal } from "@/components/trucks/AddTruckModal";
import Link from "next/link";

export default function TrucksPage() {
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchTrucks = async () => {
    setLoading(true);
    const data = await getTrucks();
    setTrucks(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchTrucks();
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
      INACTIVE: "Inactivo",
    };
    return (
      <span
        className={`px-3 py-1 rounded-full text-xs font-semibold border ${styles[status]}`}
      >
        {labels[status]}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Flota de Vehículos
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Gestiona los camiones y sus asignaciones.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl font-medium hover:bg-blue-700 transition-all shadow-sm"
        >
          <Plus className="w-5 h-5" />
          Registrar Camión
        </button>
      </div>

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar por placa o marca..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full text-center py-12 text-slate-500">
            Cargando flota...
          </div>
        ) : filteredTrucks.length === 0 ? (
          <div className="col-span-full text-center py-12 text-slate-500">
            No se encontraron vehículos.
          </div>
        ) : (
          filteredTrucks.map((truck) => (
            <div
              key={truck.id}
              className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-all flex flex-col"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-50 p-3 rounded-xl text-blue-600">
                    <TruckIcon className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 tracking-tight">
                      {truck.licensePlate}
                    </h3>
                    <p className="text-sm text-slate-500 font-medium">
                      {truck.brand} {truck.model}
                    </p>
                  </div>
                </div>
                {getStatusBadge(truck.status)}
              </div>

              <div className="mt-auto pt-4 border-t border-slate-100 flex justify-between items-center text-sm">
                <div className="flex items-center gap-2 text-slate-600">
                  <User className="w-4 h-4" />
                  <span
                    className={
                      truck.assignedDriverId
                        ? "font-medium text-slate-900"
                        : "italic text-slate-400"
                    }
                  >
                    {truck.assignedDriverId ? "Asignado" : "Sin chofer"}
                  </span>
                </div>
                <Link
                  href={`/admin/trucks/${truck.id}`}
                  className="text-blue-600 hover:text-blue-800 font-medium text-sm hover:underline"
                >
                  Ver Detalles
                </Link>
              </div>
            </div>
          ))
        )}
      </div>

      <AddTruckModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchTrucks}
      />
    </div>
  );
}
