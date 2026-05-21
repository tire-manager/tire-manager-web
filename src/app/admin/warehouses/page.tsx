// src/app/admin/warehouses/page.tsx
"use client";
import React, { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import {
  getWarehouses,
  updateWarehouse,
  Warehouse,
} from "@/services/warehouseService";
import { WarehouseFormModal } from "@/components/warehouses/WarehouseFormModal";
import { useAuth } from "@/context/AuthContext";
import { WarehouseTable } from "@/components/warehouses/WarehouseTable";
import toast from "react-hot-toast";

export default function WarehousesPage() {
  const { profile } = useAuth();
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState<Warehouse | null>(
    null,
  );
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 1. Añadimos el estado de carga
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    if (!profile?.companyId) return;
    setLoading(true);
    try {
      const data = await getWarehouses(profile.companyId);
      setWarehouses(data);
    } catch (error) {
      toast.error("Error al cargar almacenes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (profile?.companyId) {
      loadData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  // 2. Función para abrir el modal en modo edición
  const handleEdit = (warehouse: Warehouse) => {
    setSelectedWarehouse(warehouse);
    setIsModalOpen(true);
  };

  // 3. Función para dar de baja (inhabilitar) un almacén
  const handleDeactivate = async (warehouse: Warehouse) => {
    if (warehouse.status === "INACTIVE") {
      return toast.error("Este almacén ya se encuentra inactivo.");
    }

    if (
      window.confirm(
        `¿Estás seguro de inhabilitar el almacén: ${warehouse.name}?`,
      )
    ) {
      const toastId = toast.loading("Inhabilitando...");
      try {
        await updateWarehouse(warehouse.id, { status: "INACTIVE" });
        toast.success("Almacén inhabilitado correctamente", { id: toastId });
        loadData(); // Recargamos la tabla
      } catch (error) {
        toast.error("Error al inhabilitar el almacén", { id: toastId });
      }
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* CABECERA */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-800">Almacenes</h1>
          <p className="text-sm font-medium text-slate-500 mt-1">
            Gestiona los puntos de inventario de tu empresa
          </p>
        </div>
        <button
          onClick={() => {
            setSelectedWarehouse(null);
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 bg-blue-600 text-white px-5 py-3 rounded-xl font-black hover:bg-blue-700 transition-colors shadow-md"
        >
          <Plus className="w-5 h-5" /> Registrar Almacén
        </button>
      </div>

      {/* COMPONENTE DE TABLA AISLADO */}
      <WarehouseTable
        warehouses={warehouses}
        loading={loading}
        onEdit={handleEdit}
        onDeactivate={handleDeactivate}
      />

      {/* COMPONENTE DE MODAL INTELIGENTE */}
      <WarehouseFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={loadData}
        warehouse={selectedWarehouse}
      />
    </div>
  );
}
