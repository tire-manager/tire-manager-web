"use client";
import React from "react";
import { TirePosition } from "@/types/tire";

interface TruckSchemaProps {
  onSelectPosition: (position: TirePosition) => void;
  activePosition?: TirePosition | null;
}

export const TruckSchema: React.FC<TruckSchemaProps> = ({
  onSelectPosition,
  activePosition,
}) => {
  // Función para renderizar cada bloque que representa un neumático
  const renderTire = (position: TirePosition, label: string) => {
    const isActive = activePosition === position;
    return (
      <button
        type="button"
        onClick={() => onSelectPosition(position)}
        className={`w-14 h-24 rounded-lg border-2 transition-all duration-200 flex items-center justify-center
          ${
            isActive
              ? "bg-blue-600 border-blue-800 text-white scale-110 shadow-lg z-10"
              : "bg-gray-800 border-gray-900 text-gray-400 hover:bg-gray-700 shadow-sm"
          }`}
      >
        <span className="text-xs font-bold">{label}</span>
      </button>
    );
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-gray-50 rounded-2xl border border-gray-200">
      <div className="text-gray-500 font-bold mb-4 text-xs tracking-widest">
        EJE DIRECCIONAL
      </div>

      {/* Cabina / Eje Delantero */}
      <div className="flex justify-between items-center w-56 mb-12 relative">
        {/* Línea del eje */}
        <div className="absolute top-1/2 left-0 w-full h-2 bg-gray-300 -z-10 transform -translate-y-1/2"></div>
        {renderTire("FRONT_LEFT", "IZQ")}

        {/* Representación de la cabina */}
        <div className="w-20 h-16 bg-gray-200 rounded-t-2xl border-x-4 border-t-4 border-gray-300 flex items-end justify-center pb-2">
          <div className="w-12 h-6 bg-blue-100 rounded-t-lg opacity-50"></div>{" "}
          {/* Parabrisas */}
        </div>

        {renderTire("FRONT_RIGHT", "DER")}
      </div>

      <div className="text-gray-500 font-bold mb-6 text-xs tracking-widest">
        EJES DE TRACCIÓN
      </div>

      {/* Ejes Traseros (Llantas dobles) */}
      <div className="relative flex justify-between w-72">
        {/* Chasis central */}
        <div className="absolute left-1/2 transform -translate-x-1/2 w-8 h-[120%] bg-gray-300 -z-10 rounded-sm"></div>

        {/* Eje trasero (Línea) */}
        <div className="absolute top-1/2 left-0 w-full h-2 bg-gray-300 -z-10 transform -translate-y-1/2"></div>

        {/* Lado Izquierdo (Doble llanta) */}
        <div className="flex gap-1">
          {renderTire("REAR_LEFT_OUTER", "EXT")}
          {renderTire("REAR_LEFT_INNER", "INT")}
        </div>

        {/* Lado Derecho (Doble llanta) */}
        <div className="flex gap-1">
          {renderTire("REAR_RIGHT_INNER", "INT")}
          {renderTire("REAR_RIGHT_OUTER", "EXT")}
        </div>
      </div>
    </div>
  );
};
