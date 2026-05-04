// src/app/admin/inventory/[id]/page.tsx
"use client";
import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  History,
  Calendar,
  User,
  Truck,
  MoveDown,
  Download,
  Gauge,
} from "lucide-react";
import { getTireById, getTireHistory } from "@/services/tireService";
import { Tire } from "@/types/tire";
import { generateTireKardexPDF } from "@/lib/utils/exportPDF";

export default function TireKardexPage() {
  const params = useParams();
  const router = useRouter();
  const [tire, setTire] = useState<Tire | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const tireData = await getTireById(params.id as string);
      if (tireData) {
        setTire(tireData);
        const historyData = await getTireHistory(params.id as string);
        setHistory(historyData);
      }
      setLoading(false);
    }
    loadData();
  }, [params.id]);

  if (loading)
    return <div className="p-8 text-center">Generando Kardex...</div>;
  if (!tire)
    return (
      <div className="p-8 text-center text-red-500">
        Neumático no encontrado
      </div>
    );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Encabezado */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="p-2 bg-white rounded-xl border border-slate-200 hover:bg-slate-50"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Kardex de Neumático
          </h1>
          <p className="text-slate-500 text-sm font-mono">
            SN: {tire.serialNumber}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Info Actual */}
        <div className="md:col-span-1 space-y-4">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm text-center">
            <p className="text-sm text-slate-500 font-medium mb-1">
              Estado de Vida
            </p>
            <div className="text-4xl font-black text-slate-900 mb-2">
              {tire.currentTreadDepth} <span className="text-lg">mm</span>
            </div>
            <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 transition-all duration-1000"
                style={{ width: `${(tire.currentTreadDepth / 12) * 100}%` }}
              />
            </div>
            <p className="text-[10px] text-slate-400 mt-2 uppercase font-bold tracking-wider">
              Profundidad de Cocada
            </p>
          </div>

          <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-lg">
            <h3 className="text-sm font-bold opacity-60 mb-4 flex items-center gap-2">
              <Truck className="w-4 h-4" /> UBICACIÓN ACTUAL
            </h3>
            <p className="text-lg font-bold">
              {tire.truckId ? `Camión ${tire.truckId}` : "En Almacén"}
            </p>
            <p className="text-sm opacity-80 mt-1">
              {tire.position?.replace(/_/g, " ") || "Sin asignar"}
            </p>

            {/* NUEVA SECCIÓN: Odómetro de Instalación */}
            {tire.initialOdometer && (
              <div className="mt-4 pt-4 border-t border-slate-700/50">
                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">
                  Instalado a los
                </p>
                <p className="text-lg font-mono font-bold text-emerald-400 flex items-center gap-2">
                  <Gauge className="w-4 h-4" />
                  {tire.initialOdometer.toLocaleString()} KM
                </p>
              </div>
            )}
          </div>

          <button
            onClick={() => tire && generateTireKardexPDF(tire, history)}
            className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-sm text-sm"
          >
            <Download className="w-4 h-4" />
            Exportar PDF
          </button>
        </div>

        {/* Línea de Tiempo del Historial */}
        <div className="md:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
            <History className="w-5 h-5 text-blue-600" />
            Historial de Inspecciones
          </h3>

          <div className="relative space-y-8 before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-slate-200 before:via-slate-200 before:to-transparent">
            {history.length === 0 ? (
              <p className="text-slate-400 text-sm italic ml-10">
                No hay registros previos para este neumático.
              </p>
            ) : (
              history.map((event, idx) => (
                <div
                  key={event.id}
                  className="relative flex items-start gap-6 group"
                >
                  {/* Punto en la línea */}
                  <div className="ml-12 flex-1">
                    {/* NUEVA SECCIÓN: Encabezado del evento con Fecha, MM y KM */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                      <time className="text-xs font-bold text-blue-600 uppercase tracking-widest flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {event.date?.toLocaleDateString()}
                      </time>

                      <div className="text-right">
                        <span className="text-sm font-black text-slate-900 block">
                          {event.newTreadDepth} mm
                        </span>
                        {/* Si la inspección trajo un odómetro, lo mostramos aquí */}
                        {event.currentOdometer && (
                          <span className="text-xs text-slate-500 font-mono font-bold flex items-center justify-end gap-1 mt-0.5">
                            <Gauge className="w-3 h-3" />
                            {event.currentOdometer.toLocaleString()} KM
                          </span>
                        )}
                      </div>
                    </div>

                    {/* El recuadro del Chofer se mantiene igual */}
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 mt-2">
                      <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
                        <User className="w-3 h-3" />
                        ID Chofer: {event.driverId}
                      </div>
                      <p className="text-sm text-slate-600 italic">
                        {event.notes || "Sin observaciones adicionales."}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
