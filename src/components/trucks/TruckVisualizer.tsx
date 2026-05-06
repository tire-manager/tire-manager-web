"use client";
import React, { useState } from "react";
import { Tire } from "@/types/tire";

// Reemplaza SOLO esta constante para mantener el resto de tu código intacto
const TRUCK_LAYOUTS = {
  "3_EJES_BALON": [
    [1, 2], // Eje 1: Simples
    [3, 4], // Eje 2: Simples
    [5, 6], // Eje 3: Simples
  ],
  "4_EJES": [
    [1, 2], // Eje 1: Simples
    [3, 4], // Eje 2: Simples
    [5, 6, 7, 8], // Eje 3: Dobles
    [9, 10, 11, 12], // Eje 4: Dobles
  ],
  "3_EJES_12_LLANTAS": [
    [1, 2, 3, 4], // Eje 1: Dobles
    [5, 6, 7, 8], // Eje 2: Dobles
    [9, 10, 11, 12], // Eje 3: Dobles
  ],
  "3_EJES_10_LLANTAS": [
    [1, 2], // Eje 1: Simples
    [3, 4, 5, 6], // Eje 2: Dobles
    [7, 8, 9, 10], // Eje 3: Dobles
  ],
  "2_EJES": [
    [1, 2], // Eje 1: Simples
    [3, 4], // Eje 2: Simples
  ],
};

interface TruckVisualizerProps {
  layoutType: keyof typeof TRUCK_LAYOUTS;
  assignedTires: Tire[]; // Llantas que actualmente tiene este camión
  onTireClick: (position: number, tire: Tire | undefined) => void;
}

export default function TruckVisualizer({
  layoutType,
  assignedTires,
  onTireClick,
}: TruckVisualizerProps) {
  const layout = TRUCK_LAYOUTS[layoutType] || TRUCK_LAYOUTS["3_EJES_BALON"];

  // Función para obtener la llanta asignada a una posición específica
  const getTireAtPosition = (pos: number) => {
    return assignedTires.find((t) => t.position === pos.toString());
  };

  // Función para determinar el color/estilo de la llanta según su desgaste
  const getTireStyle = (tire: Tire | undefined) => {
    if (!tire)
      return "bg-slate-100 border-2 border-dashed border-slate-300 text-slate-400 hover:bg-blue-50 hover:border-blue-300"; // Vacío

    // Asumiendo un límite crítico de 3mm y advertencia de 6mm
    if (tire.currentTreadDepth <= 3)
      return "bg-slate-800 border-2 border-red-500 text-white shadow-[0_0_10px_rgba(239,68,68,0.5)]"; // Crítico
    if (tire.currentTreadDepth <= 6)
      return "bg-slate-800 border-2 border-amber-400 text-white"; // Advertencia
    return "bg-slate-800 border-2 border-emerald-500 text-white"; // Óptimo
  };

  return (
    <div className="flex flex-col items-center p-6 bg-white rounded-2xl border border-slate-200 shadow-sm">
      {/* Selector de Tipo de Unidad (Solo ilustrativo para la vista) */}
      <div className="mb-8 text-center">
        <h3 className="text-lg font-black text-slate-800 uppercase tracking-widest">
          {layoutType.replace("_", " ")}
        </h3>
        <p className="text-xs text-slate-500">
          Selecciona una posición para ver detalles o desmontar
        </p>
      </div>

      <div className="relative w-64 flex flex-col items-center">
        {/* Cabina del camión (Visual) */}
        <div className="w-32 h-20 bg-slate-200 border-b-4 border-slate-300 rounded-t-3xl mb-4 relative flex items-center justify-center shadow-inner">
          <div className="w-24 h-8 bg-slate-300 rounded-t-xl absolute bottom-2 opacity-50"></div>{" "}
          {/* Parabrisas */}
          <span className="text-xs font-bold text-slate-400 uppercase">
            Frente
          </span>
        </div>

        {/* Chasis Central (La línea que une los ejes) */}
        <div className="absolute top-24 bottom-4 w-4 bg-slate-200 rounded-full z-0"></div>

        {/* Renderizado Dinámico de Ejes */}
        <div className="space-y-8 z-10 w-full">
          {layout.map((axle, axleIndex) => (
            <div
              key={axleIndex}
              className="relative flex justify-between w-full"
            >
              {/* Lado Izquierdo del Eje */}
              <div className="flex gap-1">
                {axle.slice(0, axle.length / 2).map((pos) => {
                  const tire = getTireAtPosition(pos);
                  return (
                    <button
                      key={pos}
                      onClick={() => onTireClick(pos, tire)}
                      className={`w-10 h-20 rounded-lg flex items-center justify-center font-bold text-sm transition-all hover:-translate-y-1 ${getTireStyle(tire)}`}
                      title={
                        tire
                          ? `${tire.brand} - ${tire.currentTreadDepth}mm`
                          : "Posición vacía"
                      }
                    >
                      {pos}
                    </button>
                  );
                })}
              </div>

              {/* Lado Derecho del Eje */}
              <div className="flex gap-1">
                {axle.slice(axle.length / 2).map((pos) => {
                  const tire = getTireAtPosition(pos);
                  return (
                    <button
                      key={pos}
                      onClick={() => onTireClick(pos, tire)}
                      className={`w-10 h-20 rounded-lg flex items-center justify-center font-bold text-sm transition-all hover:-translate-y-1 ${getTireStyle(tire)}`}
                      title={
                        tire
                          ? `${tire.brand} - ${tire.currentTreadDepth}mm`
                          : "Posición vacía"
                      }
                    >
                      {pos}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Leyenda Visual */}
      <div className="mt-10 flex flex-wrap justify-center gap-4 text-xs font-bold text-slate-600">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-dashed border-slate-300 rounded"></div>{" "}
          Vacío
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-slate-800 border-2 border-emerald-500 rounded"></div>{" "}
          Óptimo
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-slate-800 border-2 border-amber-400 rounded"></div>{" "}
          Revisar
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-slate-800 border-2 border-red-500 rounded shadow-[0_0_5px_rgba(239,68,68,0.5)]"></div>{" "}
          Crítico
        </div>
      </div>
    </div>
  );
}
