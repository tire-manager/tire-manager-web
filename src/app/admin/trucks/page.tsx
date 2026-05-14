// src/app/admin/trucks/page.tsx
"use client";
import React, { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { getDrivers } from "@/services/userService";
import { Truck } from "@/types/truck";
import { AddTruckModal } from "@/components/trucks/AddTruckModal";
import { EditTruckModal } from "@/components/trucks/EditTruckModal";
import { TrucksTable } from "@/components/trucks/TrucksTable";
import toast from "react-hot-toast";

export default function TrucksPage() {
  const [driverMap, setDriverMap] = useState<Record<string, string>>({});

  // Modales
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedTruck, setSelectedTruck] = useState<Truck | null>(null);

  // Key para forzar actualización de la tabla tras crear/editar
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const loadDrivers = async () => {
      try {
        const driversData = await getDrivers();
        const dMap: Record<string, string> = {};
        driversData.forEach((d) => {
          dMap[d.uid] = d.displayName;
        });
        setDriverMap(dMap);
      } catch (error) {
        toast.error("Error al cargar choferes");
      }
    };
    loadDrivers();
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* ENCABEZADO */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            Flota de Vehículos
          </h1>
          <p className="text-slate-500 text-sm mt-1 font-medium">
            Gestiona unidades, choferes asignados y configuraciones técnicas.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center justify-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-slate-800 transition-colors shadow-sm w-full sm:w-auto"
        >
          <Plus className="w-5 h-5" /> Registrar Camión
        </button>
      </div>

      {/* COMPONENTE INTELIGENTE */}
      <TrucksTable
        key={refreshKey}
        driverMap={driverMap}
        onEditTruck={(truck) => {
          setSelectedTruck(truck);
          setIsEditModalOpen(true);
        }}
        onRefreshNeeded={() => setRefreshKey((k) => k + 1)}
      />

      {/* MODALES */}
      <AddTruckModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => setRefreshKey((k) => k + 1)}
      />

      {selectedTruck && (
        <EditTruckModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSuccess={() => setRefreshKey((k) => k + 1)}
          truck={selectedTruck}
        />
      )}
    </div>
  );
}
