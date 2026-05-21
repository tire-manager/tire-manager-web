// src/components/warehouses/WarehouseFormModal.tsx
"use client";
import React, { useState, useEffect } from "react";
import { X, Package } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
  addWarehouse,
  updateWarehouse,
  Warehouse,
} from "@/services/warehouseService";
import toast from "react-hot-toast";

export const WarehouseFormModal = ({
  isOpen,
  onClose,
  onSuccess,
  warehouse,
}: any) => {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(false);

  // SOLUCIÓN AL ERROR: Le decimos a TypeScript que esto no es un string cualquiera
  const [formData, setFormData] = useState({
    name: "",
    location: "",
    status: "ACTIVE" as "ACTIVE" | "INACTIVE",
  });

  useEffect(() => {
    if (warehouse) {
      setFormData({
        name: warehouse.name,
        location: warehouse.location,
        status: warehouse.status,
      });
    } else {
      setFormData({ name: "", location: "", status: "ACTIVE" });
    }
  }, [warehouse, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.companyId) return toast.error("Error de sesión");
    setLoading(true);

    try {
      if (warehouse) {
        await updateWarehouse(warehouse.id, {
          ...formData,
          name: formData.name.toUpperCase(),
        });
        toast.success("Almacén actualizado");
      } else {
        await addWarehouse(
          {
            ...formData,
            name: formData.name.toUpperCase(),
          },
          profile.companyId,
        );
        toast.success("Almacén registrado");
      }
      onSuccess();
      onClose();
    } catch (error) {
      toast.error("Error al procesar el almacén");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
            <Package className="w-5 h-5 text-blue-600" />
            {warehouse ? "Editar" : "Nuevo"} Almacén
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 bg-slate-50 p-2 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Nombre
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="Ej. Almacén Central"
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-bold uppercase"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Ubicación
            </label>
            <input
              type="text"
              required
              value={formData.location}
              onChange={(e) =>
                setFormData({ ...formData, location: e.target.value })
              }
              placeholder="Ej. Av. Los Pinos 123"
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Estado
            </label>
            <select
              value={formData.status}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  status: e.target.value as "ACTIVE" | "INACTIVE",
                })
              }
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-700"
            >
              <option value="ACTIVE">🟢 Operativo</option>
              <option value="INACTIVE">🔴 Inactivo</option>
            </select>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black transition-colors disabled:opacity-50"
            >
              {loading ? "Guardando..." : "Guardar Almacén"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
