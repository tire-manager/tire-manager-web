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
  Package,
  DollarSign,
  Wrench,
  Archive,
  Activity,
} from "lucide-react";
import { getTireById, getTireHistory } from "@/services/tireService";
import { getTruckById } from "@/services/truckService"; // <-- NUEVA IMPORTACIÓN
import { Tire } from "@/types/tire";
import { generateTireKardexPDF } from "@/lib/utils/exportPDF";

export default function TireKardexPage() {
  const params = useParams();
  const router = useRouter();
  const [tire, setTire] = useState<Tire | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [truckPlate, setTruckPlate] = useState<string>(""); // <-- NUEVO ESTADO PARA LA PLACA
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const tireData = await getTireById(params.id as string);
      if (tireData) {
        setTire(tireData);

        // CRUCE DE DATOS: Si está en uso, buscamos la placa real del camión
        if (tireData.truckId && tireData.status === "IN_USE") {
          try {
            const truckData = await getTruckById(tireData.truckId);
            if (truckData) setTruckPlate(truckData.licensePlate);
          } catch (e) {
            console.error("Error cargando placa del camión");
          }
        }

        const historyData = await getTireHistory(params.id as string);
        setHistory(historyData);
      }
      setLoading(false);
    }
    loadData();
  }, [params.id]);

  if (loading)
    return (
      <div className="p-8 text-center text-slate-500 font-bold">
        Generando Kardex...
      </div>
    );
  if (!tire)
    return (
      <div className="p-8 text-center text-red-500 font-bold">
        Neumático no encontrado
      </div>
    );

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Encabezado */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2.5 bg-white rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors shadow-sm"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div>
            <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
              Kardex de Unidad{" "}
              <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-lg text-sm">
                {tire.serialNumber}
              </span>
            </h1>
            <p className="text-slate-500 text-sm font-bold uppercase tracking-wider mt-1">
              {tire.brand} {tire.model}
            </p>
          </div>
        </div>
        <button
          onClick={() => tire && generateTireKardexPDF(tire, history)}
          className="hidden sm:flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-slate-800 transition-all shadow-sm"
        >
          <Download className="w-4 h-4" />
          Exportar PDF
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* COLUMNA IZQUIERDA: RESUMEN Y ESTADO (4 Columnas) */}
        <div className="md:col-span-4 space-y-6">
          {/* Tarjeta 1: Salud de la Llanta */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-emerald-400"></div>
            <p className="text-xs text-slate-400 font-black uppercase tracking-widest mb-2 flex items-center justify-center gap-1">
              <Activity className="w-4 h-4" /> Vida Útil Actual
            </p>
            <div className="text-5xl font-black text-slate-900 mb-3 font-mono">
              {tire.currentTreadDepth}{" "}
              <span className="text-xl text-slate-400">mm</span>
            </div>
            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden mb-2">
              <div
                className={`h-full transition-all duration-1000 ${tire.currentTreadDepth < 3 ? "bg-red-500" : tire.currentTreadDepth < 6 ? "bg-amber-400" : "bg-emerald-500"}`}
                style={{
                  width: `${Math.min((tire.currentTreadDepth / 12) * 100, 100)}%`,
                }}
              />
            </div>
          </div>

          {/* Tarjeta 2: Ubicación */}
          <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-lg border border-slate-800">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Truck className="w-4 h-4 text-blue-400" /> Asignación
            </h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-slate-400">Estado / Ubicación</p>
                <p className="text-xl font-black text-white">
                  {tire.status === "AVAILABLE" && "Almacén Principal"}
                  {tire.status === "DISCARDED" && "Descarte (Baja)"}
                  {/* AQUÍ APLICAMOS LA PLACA REAL O EL ID COMO RESPALDO */}
                  {tire.status === "IN_USE" &&
                    `Camión ${truckPlate || tire.truckId}`}
                </p>
              </div>

              {tire.position && (
                <div>
                  <p className="text-sm text-slate-400">Posición en Chasis</p>
                  <p className="text-lg font-bold text-blue-300">
                    {tire.position.replace(/_/g, " ")}
                  </p>
                </div>
              )}

              {tire.initialOdometer && (
                <div className="pt-4 border-t border-slate-700/50">
                  <p className="text-xs text-slate-400 mb-1">
                    Odómetro de Instalación
                  </p>
                  <p className="text-lg font-mono font-bold text-emerald-400 flex items-center gap-2">
                    <Gauge className="w-5 h-5" />
                    {tire.initialOdometer.toLocaleString()} KM
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Tarjeta 3: Datos Financieros / Técnicos */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Package className="w-4 h-4 text-emerald-600" /> Ficha Técnica
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center pb-2 border-b border-slate-50">
                <span className="text-slate-500 font-medium">Medida</span>
                <span className="font-bold text-slate-900 uppercase">
                  {tire.size || "N/A"}
                </span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-slate-50">
                <span className="text-slate-500 font-medium">
                  Profundidad Inicial
                </span>
                <span className="font-bold text-slate-900">
                  {tire.currentTreadDepth >= 12 ? tire.currentTreadDepth : 12.0}{" "}
                  mm
                </span>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="text-slate-500 font-medium flex items-center gap-1">
                  <DollarSign className="w-4 h-4 text-emerald-500" /> Costo
                  Compra
                </span>
                <span className="font-mono font-black text-emerald-700">
                  {tire.price
                    ? `${tire.currency === "USD" ? "$" : "S/"} ${tire.price.toFixed(2)}`
                    : "No registrado"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* COLUMNA DERECHA: LÍNEA DE TIEMPO (8 Columnas) */}
        <div className="md:col-span-8 bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="font-black text-xl text-slate-800 mb-8 flex items-center gap-2 pb-4 border-b border-slate-100">
            <History className="w-6 h-6 text-blue-600" />
            Línea de Tiempo Operativa
          </h3>

          <div className="relative space-y-8 before:absolute before:inset-0 before:ml-4 before:-translate-x-px before:h-full before:w-0.5 before:bg-slate-200">
            {/* EVENTOS DINÁMICOS */}
            {history.map((event, idx) => {
              const isUnmount = event.truckId === "DESMONTADO";

              return (
                <div
                  key={event.id}
                  className="relative flex items-start gap-6 group"
                >
                  <div
                    className={`absolute left-0 w-8 h-8 rounded-full border-4 border-white flex items-center justify-center z-10 ${isUnmount ? "bg-amber-100 text-amber-600" : "bg-blue-100 text-blue-600"}`}
                  >
                    {isUnmount ? (
                      <Archive className="w-3.5 h-3.5" />
                    ) : (
                      <Wrench className="w-3.5 h-3.5" />
                    )}
                  </div>

                  <div className="ml-12 flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                      <div>
                        <span
                          className={`text-xs font-black uppercase tracking-widest px-2.5 py-1 rounded-md ${isUnmount ? "bg-amber-50 text-amber-700 border border-amber-200" : "bg-slate-100 text-slate-600"}`}
                        >
                          {isUnmount ? "Desmontaje" : "Inspección en Ruta"}
                        </span>
                        <time className="text-xs font-bold text-slate-400 flex items-center gap-1 mt-2">
                          <Calendar className="w-3.5 h-3.5" />
                          {event.date?.toLocaleString()}
                        </time>
                      </div>

                      <div className="text-left sm:text-right">
                        {!isUnmount && (
                          <span className="text-xl font-black text-slate-900 block font-mono">
                            {event.newTreadDepth}{" "}
                            <span className="text-sm text-slate-400">mm</span>
                          </span>
                        )}
                        {event.currentOdometer > 0 && (
                          <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded font-mono font-bold inline-flex items-center gap-1 mt-1 border border-emerald-100">
                            <Gauge className="w-3 h-3" />
                            {event.currentOdometer.toLocaleString()} KM
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mt-3 hover:border-blue-200 transition-colors">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-500 mb-2">
                        <User className="w-3.5 h-3.5" />
                        Autorizado/Reportado por:{" "}
                        <span className="text-slate-800">{event.driverId}</span>
                      </div>
                      <p className="text-sm text-slate-700 font-medium leading-relaxed">
                        "
                        {event.notes ||
                          "Inspección de rutina sin observaciones adicionales."}
                        "
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* EVENTO BASE */}
            <div className="relative flex items-start gap-6 group pt-4">
              <div className="absolute left-0 w-8 h-8 bg-emerald-100 rounded-full border-4 border-white flex items-center justify-center z-10 text-emerald-600">
                <Package className="w-3.5 h-3.5" />
              </div>
              <div className="ml-12 flex-1">
                <span className="text-xs font-black uppercase tracking-widest px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Ingreso a Almacén
                </span>
                <time className="text-xs font-bold text-slate-400 flex items-center gap-1 mt-2 mb-2">
                  <Calendar className="w-3.5 h-3.5" />
                  {tire.createdAt?.toDate
                    ? tire.createdAt.toDate().toLocaleString()
                    : "Fecha de registro original"}
                </time>
                <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100">
                  <p className="text-sm text-emerald-800 font-medium">
                    Neumático nuevo dado de alta en el sistema con{" "}
                    <strong>
                      {tire.currentTreadDepth >= 12
                        ? tire.currentTreadDepth
                        : 12.0}{" "}
                      mm
                    </strong>{" "}
                    de profundidad inicial.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
