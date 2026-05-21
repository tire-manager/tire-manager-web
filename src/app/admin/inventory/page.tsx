// src/app/admin/inventory/page.tsx
"use client";
import React, { useEffect, useState } from "react";
import { Plus, Download, ChevronDown } from "lucide-react";
import { getTrucks } from "@/services/truckService";
import { Truck } from "@/types/truck";
import { Tire } from "@/types/tire";
import { InventoryTable } from "@/components/inventory/InventoryTable";
import { exportTiresToCSV } from "@/lib/utils/exportCSV";
import { getInventory } from "@/services/tireService";
import toast from "react-hot-toast";
import { TireFormModal } from "@/components/inventory/TireFormModal";
import { useAuth } from "@/context/AuthContext";

export default function InventoryPage() {
  const { profile } = useAuth();

  const [truckMap, setTruckMap] = useState<Record<string, string>>({});

  // Modales
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedTire, setSelectedTire] = useState<Tire | null>(null);

  // Menú de descargas
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);

  // Truco para forzar el redibujado de la tabla cuando editamos/agregamos algo
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const loadTrucks = async () => {
      try {
        const trucksData = await getTrucks(profile?.companyId || "");
        const map: Record<string, string> = {};
        trucksData.forEach((t: Truck) => {
          map[t.id] = t.licensePlate;
        });
        setTruckMap(map);
      } catch (error) {
        console.error("Error cargando camiones", error);
      }
    };
    loadTrucks();
  }, []);

  const handleExportCSV = async () => {
    setIsExportMenuOpen(false);
    const toastId = toast.loading("Preparando exportación...");
    try {
      // Para exportar SÍ traemos todo el inventario de golpe en segundo plano
      const allTires = await getInventory();
      exportTiresToCSV(allTires);
      toast.success("Archivo CSV generado", { id: toastId });
    } catch (e) {
      toast.error("Error al exportar", { id: toastId });
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* CABECERA ESTANDARIZADA */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            Inventario de Neumáticos
          </h1>
          <p className="text-slate-500 text-sm mt-1 font-medium">
            Gestiona stock, costos y auditoría de forma escalable.
          </p>
        </div>

        <div className="flex gap-3 w-full sm:w-auto relative">
          {/* BOTÓN CON MENÚ DESPLEGABLE (DOCUMENTOS) */}
          <button
            onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-white border border-slate-200 text-slate-700 px-5 py-2.5 rounded-xl font-bold hover:bg-slate-50 transition-colors shadow-sm"
          >
            <Download className="w-4 h-4" /> Exportar{" "}
            <ChevronDown className="w-4 h-4 text-slate-400" />
          </button>

          {isExportMenuOpen && (
            <div className="absolute right-[170px] top-14 w-48 bg-white border border-slate-200 shadow-xl rounded-xl z-50 overflow-hidden animate-in fade-in">
              <button
                onClick={handleExportCSV}
                className="w-full text-left px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors"
              >
                Exportar a Excel (CSV)
              </button>
            </div>
          )}

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-slate-800 transition-colors shadow-sm"
          >
            <Plus className="w-5 h-5" /> Nueva Llanta
          </button>
        </div>
      </div>

      {/* TABLA MODULAR E INTELIGENTE */}
      <InventoryTable
        key={refreshKey} // Al cambiar la key, React desmonta y vuelve a montar la tabla limpia
        truckMap={truckMap}
        onEditTire={(tire) => {
          setSelectedTire(tire);
          setIsEditModalOpen(true);
        }}
        onRefreshNeeded={() => setRefreshKey((k) => k + 1)}
      />

      <TireFormModal
        isOpen={isAddModalOpen || isEditModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setIsEditModalOpen(false);
          setSelectedTire(null); // Limpiamos la selección
        }}
        onSuccess={() => setRefreshKey((k) => k + 1)}
        tire={isEditModalOpen ? selectedTire : null}
      />
    </div>
  );
}
