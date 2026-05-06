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
  Download,
  Package,
  Wrench,
  Archive,
  Activity,
  LineChart,
  TrendingDown,
} from "lucide-react";
// IMPORTAMOS LA NUEVA FUNCIÓN MAESTRA
import {
  getTireById,
  getTireHistory,
  getTireAdvancedStats,
} from "@/services/tireService";
import { getTruckById } from "@/services/truckService";
import { getUsers } from "@/services/userService";
import { Tire } from "@/types/tire";
import { generateTireKardexPDF } from "@/lib/utils/exportPDF";

export default function TireKardexPage() {
  const params = useParams();
  const router = useRouter();
  const [tire, setTire] = useState<Tire | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [truckPlate, setTruckPlate] = useState<string>("");
  const [userMap, setUserMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [tireData, historyData, allUsers] = await Promise.all([
          getTireById(params.id as string),
          getTireHistory(params.id as string),
          getUsers(),
        ]);

        if (tireData) {
          setTire(tireData);
          if (tireData.truckId && tireData.status === "IN_USE") {
            const truckData = await getTruckById(tireData.truckId);
            if (truckData) setTruckPlate(truckData.licensePlate);
          }
        }

        const uMap: Record<string, string> = {};
        allUsers.forEach((u) => (uMap[u.uid] = u.displayName));
        setUserMap(uMap);
        setHistory(historyData);
      } catch (e) {
        console.error("Error cargando Kardex", e);
      } finally {
        setLoading(false);
      }
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

  // --- NUEVA MATEMÁTICA PREDICTIVA ---
  const stats = getTireAdvancedStats(tire, history);
  const moneda = tire.currency === "USD" ? "$" : "S/";

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Encabezado */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2.5 bg-white rounded-xl border border-slate-200 hover:bg-slate-50 shadow-sm transition-colors"
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
          onClick={() => generateTireKardexPDF(tire, history)}
          className="flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-slate-800 shadow-sm transition-all text-sm"
        >
          <Download className="w-4 h-4" /> Exportar PDF
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* COLUMNA IZQUIERDA */}
        <div className="md:col-span-4 space-y-6">
          {/* Vida Útil */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-emerald-400"></div>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-2 flex items-center justify-center gap-1">
              <Activity className="w-4 h-4" /> Vida Útil Actual
            </p>
            <div className="text-5xl font-black text-slate-900 mb-3 font-mono">
              {tire.currentTreadDepth}{" "}
              <span className="text-xl text-slate-400">mm</span>
            </div>
            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden mb-2">
              <div
                className={`h-full transition-all duration-1000 ${tire.currentTreadDepth <= stats.limitMm ? "bg-red-500" : tire.currentTreadDepth < 7 ? "bg-amber-400" : "bg-emerald-500"}`}
                style={{
                  width: `${Math.min((tire.currentTreadDepth / tire.initialTreadDepth) * 100, 100)}%`,
                }}
              />
            </div>
            {!stats.isRetreadable && (
              <p className="text-[10px] font-black text-red-500 uppercase tracking-widest mt-3">
                Límite de reencauche superado
              </p>
            )}
          </div>

          {/* NUEVO: PANEL DE ANALÍTICA PREDICTIVA */}
          <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-lg border border-slate-800">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-5 flex items-center gap-2">
              <LineChart className="w-4 h-4 text-blue-400" /> Analítica
              Predictiva
            </h3>

            <div className="grid grid-cols-2 gap-3">
              {/* CPK */}
              <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/50">
                <p className="text-[9px] text-slate-400 uppercase font-bold mb-1">
                  CPK
                </p>
                <div className="text-lg font-black text-emerald-400 font-mono">
                  {stats.cpk > 0 ? `${moneda}${stats.cpk.toFixed(4)}` : "N/D"}
                </div>
              </div>

              {/* Índice de Desgaste */}
              <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/50">
                <p className="text-[9px] text-slate-400 uppercase font-bold mb-1 flex items-center gap-1">
                  Tasa Desgaste{" "}
                  <TrendingDown className="w-3 h-3 text-slate-500" />
                </p>
                <div className="text-lg font-black text-amber-400 font-mono">
                  {stats.wearRate > 0 ? stats.wearRate.toFixed(2) : "0.00"}
                  <span className="text-[9px] text-slate-500 ml-1">mm/1k</span>
                </div>
              </div>

              {/* Vida Restante */}
              <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/50">
                <p className="text-[9px] text-slate-400 uppercase font-bold mb-1">
                  Proyección
                </p>
                <div className="text-lg font-black text-blue-400 font-mono">
                  {stats.projectedKm > 0
                    ? stats.projectedKm.toLocaleString()
                    : "0"}
                  <span className="text-[9px] text-slate-500 ml-1">KM</span>
                </div>
              </div>

              {/* Valor Residual */}
              <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/50">
                <p className="text-[9px] text-slate-400 uppercase font-bold mb-1">
                  Valor Contable
                </p>
                <div className="text-lg font-black text-white font-mono">
                  {moneda}
                  {stats.residualValue.toFixed(2)}
                </div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-800/50 flex justify-between items-center">
              <span className="text-[10px] text-slate-500 font-bold uppercase">
                Recorrido Histórico
              </span>
              <span className="text-sm font-black text-slate-200 font-mono">
                {stats.totalKm.toLocaleString()} KM
              </span>
            </div>
          </div>

          {/* Ubicación Actual */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Truck className="w-4 h-4 text-blue-600" /> Ubicación Operativa
            </h3>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-slate-400 uppercase font-bold tracking-tighter mb-1">
                  Estado
                </p>
                <p className="text-lg font-black text-slate-900 uppercase tracking-tight">
                  {tire.status === "AVAILABLE" && "En Almacén"}
                  {tire.status === "DISCARDED" && "Dada de Baja"}
                  {tire.status === "IN_USE" &&
                    `Camión ${truckPlate || "Asignado"}`}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* COLUMNA DERECHA: HISTORIAL */}
        <div className="md:col-span-8 bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="font-black text-xl text-slate-800 mb-8 flex items-center gap-2 pb-4 border-b border-slate-100">
            <History className="w-6 h-6 text-blue-600" /> Línea de Tiempo
            Operativa
          </h3>

          <div className="relative space-y-8 before:absolute before:inset-0 before:ml-4 before:-translate-x-px before:h-full before:w-0.5 before:bg-slate-200">
            {history.map((event) => {
              const isUnmount =
                event.type === "UNMOUNT" || event.truckId === "DESMONTADO";

              return (
                <div
                  key={event.id}
                  className="relative flex items-start gap-6 group"
                >
                  <div
                    className={`absolute left-0 w-8 h-8 rounded-full border-4 border-white flex items-center justify-center z-10 transition-transform group-hover:scale-110 ${isUnmount ? "bg-amber-500 text-white" : "bg-blue-600 text-white"}`}
                  >
                    {isUnmount ? (
                      <Archive className="w-3.5 h-3.5" />
                    ) : (
                      <Wrench className="w-3.5 h-3.5" />
                    )}
                  </div>

                  <div className="ml-12 flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border ${isUnmount ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-blue-50 text-blue-700 border-blue-200"}`}
                        >
                          {isUnmount
                            ? "Desmontaje de Unidad"
                            : "Inspección Técnica"}
                        </span>
                        <time className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {event.date?.toDate
                            ? event.date.toDate().toLocaleString()
                            : event.date?.toLocaleString()}
                        </time>
                      </div>

                      <div className="text-left sm:text-right flex flex-col">
                        <span className="text-lg font-black text-slate-900 font-mono">
                          {event.newTreadDepth}{" "}
                          <span className="text-[10px] text-slate-400">mm</span>
                        </span>
                        {event.currentOdometer > 0 && (
                          <span className="text-[10px] text-emerald-600 font-black font-mono">
                            {event.currentOdometer.toLocaleString()} KM
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mt-2 hover:bg-white hover:shadow-md transition-all">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-500 mb-2 border-b border-slate-200 pb-2">
                        <User className="w-3.5 h-3.5 text-blue-400" />
                        Responsable:{" "}
                        <span className="text-slate-900 uppercase">
                          {userMap[event.driverId] ||
                            "Administrador del Sistema"}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 font-medium italic">
                        "
                        {event.notes ||
                          "Acción registrada sin comentarios adicionales."}
                        "
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
