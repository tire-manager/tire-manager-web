// src/components/warehouses/WarehouseTable.tsx
"use client";
import React from "react";
import { MapPin, Edit2, Archive } from "lucide-react";
import { Warehouse } from "@/services/warehouseService";

interface WarehouseTableProps {
  warehouses: Warehouse[];
  loading: boolean;
  onEdit: (warehouse: Warehouse) => void;
  onDeactivate: (warehouse: Warehouse) => void;
}

export const WarehouseTable: React.FC<WarehouseTableProps> = ({
  warehouses,
  loading,
  onEdit,
  onDeactivate,
}) => {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase tracking-widest">
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
            ) : warehouses.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="p-8 text-center text-slate-500 font-bold"
                >
                  No se encontraron almacenes.
                </td>
              </tr>
            ) : (
              warehouses.map((w) => (
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
                        onClick={() => onEdit(w)}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDeactivate(w)}
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
  );
};
