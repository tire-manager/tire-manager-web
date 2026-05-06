// src/app/admin/warehouses/page.tsx
"use client";
import React, { useEffect, useState } from "react";
import { Plus, Search, MapPin, Package, Edit2, X, Archive } from "lucide-react";
import {
  getWarehouses,
  addWarehouse,
  updateWarehouse,
  Warehouse,
} from "@/services/warehouseService";
import toast from "react-hot-toast";

export default function WarehousesPage() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Estados del Modal Integrado
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(
    null,
  );
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    location: "",
    status: "ACTIVE" as "ACTIVE" | "INACTIVE",
  });

  const loadData = async () => {
    setLoading(true);
    const data = await getWarehouses();
    setWarehouses(data);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredWarehouses = warehouses.filter(
    (w) =>
      w.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.location.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // Funciones del Modal
  const openAddModal = () => {
    setEditingWarehouse(null);
    setFormData({ name: "", location: "", status: "ACTIVE" });
    setIsModalOpen(true);
  };

  const openEditModal = (warehouse: Warehouse) => {
    setEditingWarehouse(warehouse);
    setFormData({
      name: warehouse.name,
      location: warehouse.location,
      status: warehouse.status,
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (editingWarehouse) {
        await updateWarehouse(editingWarehouse.id, {
          name: formData.name.toUpperCase(),
          location: formData.location,
          status: formData.status,
        });
        toast.success("Almacén actualizado con éxito");
      } else {
        await addWarehouse({
          name: formData.name.toUpperCase(),
          location: formData.location,
          status: formData.status,
        });
        toast.success("Almacén registrado con éxito");
      }
      setIsModalOpen(false);
      loadData();
    } catch (error: any) {
      toast.error(error.message || "Ocurrió un error.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeactivate = async (warehouse: Warehouse) => {
    if (warehouse.status === "INACTIVE") return;
    const confirm = window.confirm(
      `¿Estás seguro de inhabilitar el almacén ${warehouse.name}?`,
    );
    if (confirm) {
      try {
        await updateWarehouse(warehouse.id, { status: "INACTIVE" });
        toast.success("Almacén inhabilitado");
        loadData();
      } catch (error) {
        toast.error("Error al inhabilitar el almacén");
      }
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <Package className="w-6 h-6 text-blue-600" />
            Gestión de Almacenes
          </h1>
          <p className="text-slate-500 text-sm mt-1 font-medium">
            Administra las ubicaciones físicas de tu inventario.
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20"
        >
          <Plus className="w-5 h-5" />
          Registrar Almacén
        </button>
      </div>

      {/* Buscador */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Buscar por nombre o dirección..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium"
          />
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider">
                <th className="p-4 font-black">Nombre del Almacén</th>
                <th className="p-4 font-black">Dirección</th>
                <th className="p-4 font-black">Estado</th>
                <th className="p-4 font-black text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {loading ? (
                <tr>
                  <td
                    colSpan={4}
                    className="p-8 text-center text-slate-500 font-bold"
                  >
                    Cargando almacenes...
                  </td>
                </tr>
              ) : filteredWarehouses.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="p-8 text-center text-slate-500 font-bold"
                  >
                    No se encontraron almacenes.
                  </td>
                </tr>
              ) : (
                filteredWarehouses.map((w) => (
                  <tr
                    key={w.id}
                    className="hover:bg-blue-50/50 transition-colors group"
                  >
                    <td className="p-4 font-black text-slate-900 uppercase">
                      {w.name}
                    </td>
                    <td className="p-4 text-slate-600 font-medium flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-slate-400" />
                      {w.location || "Sin dirección"}
                    </td>
                    <td className="p-4">
                      {w.status === "ACTIVE" ? (
                        <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border border-emerald-200">
                          Operativo
                        </span>
                      ) : (
                        <span className="bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border border-slate-200">
                          Inactivo
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => openEditModal(w)}
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeactivate(w)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Inhabilitar"
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
      </div>

      {/* Modal Integrado (Crear / Editar) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 p-2 rounded-xl text-blue-600">
                  <Package className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-black text-slate-800">
                  {editingWarehouse ? "Editar Almacén" : "Nuevo Almacén"}
                </h2>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 bg-white p-2 rounded-full shadow-sm"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">
                  Nombre del Almacén
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Ej: ALMACÉN PRINCIPAL SUR"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none uppercase font-black text-slate-900"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">
                  Dirección / Referencia
                </label>
                <input
                  type="text"
                  required
                  value={formData.location}
                  onChange={(e) =>
                    setFormData({ ...formData, location: e.target.value })
                  }
                  placeholder="Ej: Av. Los Quechuas 123"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none font-medium text-slate-900"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">
                  Estado Operativo
                </label>
                <select
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value as any })
                  }
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-700"
                >
                  <option value="ACTIVE">🟢 Operativo</option>
                  <option value="INACTIVE">🔴 Inactivo</option>
                </select>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-3 text-slate-600 bg-slate-100 hover:bg-slate-200 font-bold rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 px-4 py-3 text-white bg-blue-600 hover:bg-blue-700 font-black rounded-xl shadow-lg transition-all disabled:opacity-50"
                >
                  {isSaving ? "Guardando..." : "Guardar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
