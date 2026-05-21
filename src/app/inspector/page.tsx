// src/app/inspector/page.tsx
"use client";
import React, { useState, useEffect } from "react";
import {
  Truck as TruckIcon,
  Save,
  Search,
  AlertCircle,
  Gauge,
  Activity,
} from "lucide-react";
import { getPaginatedTrucks } from "@/services/truckService";
import {
  getTiresByTruckId,
  recordMassInspection,
} from "@/services/tireService";
import { useAuth } from "@/context/AuthContext";
import toast from "react-hot-toast";
import { Truck } from "@/types/truck";
import { Tire } from "@/types/tire";

export default function InspectorMobileApp() {
  const { profile, user } = useAuth();
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTruck, setSelectedTruck] = useState<Truck | null>(null);

  // Datos de la inspección
  const [tires, setTires] = useState<Tire[]>([]);
  const [odometer, setOdometer] = useState<number | "">("");
  const [readings, setReadings] = useState<
    Record<string, { depth: string; pressure: string; notes: string }>
  >({});

  const [loading, setLoading] = useState(false);

  // 1. Cargar camiones de la empresa (Multitenancy)
  useEffect(() => {
    if (profile?.companyId && !selectedTruck) {
      const loadTrucks = async () => {
        const { trucks: data } = await getPaginatedTrucks(
          profile.companyId,
          50,
          null,
          "ACTIVE",
          searchTerm,
        );
        setTrucks(data);
      };
      const delay = setTimeout(loadTrucks, 300);
      return () => clearTimeout(delay);
    }
  }, [profile?.companyId, searchTerm, selectedTruck]);

  // 2. Al seleccionar un camión, traer sus llantas instaladas
  const handleSelectTruck = async (truck: Truck) => {
    setLoading(true);
    setSelectedTruck(truck);
    setOdometer(truck.currentOdometer || "");
    try {
      const mountedTires = await getTiresByTruckId(truck.id);

      // Ordenamos las llantas por posición (Si tienes un formato ej: "N1", "N2")
      mountedTires.sort((a, b) =>
        (a.position || "").localeCompare(b.position || ""),
      );
      setTires(mountedTires);

      // Inicializar el formulario en blanco para cada llanta
      const initialReadings: any = {};
      mountedTires.forEach((t) => {
        initialReadings[t.id] = { depth: "", pressure: "", notes: "" };
      });
      setReadings(initialReadings);
    } catch (error) {
      toast.error("Error al cargar las llantas");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveInspection = async () => {
    if (
      !selectedTruck ||
      !odometer ||
      odometer <= (selectedTruck.currentOdometer || 0)
    ) {
      return toast.error("Ingresa un odómetro válido (mayor al anterior).");
    }

    // Validar que al menos se haya llenado una llanta
    const inspectionsToSave = tires
      .map((t) => ({
        tireId: t.id,
        newTreadDepth: parseFloat(readings[t.id].depth),
        pressure: parseFloat(readings[t.id].pressure),
        notes: readings[t.id].notes || "Ok",
      }))
      .filter((insp) => !isNaN(insp.newTreadDepth)); // Solo guardar las que tienen remanente digitado

    if (inspectionsToSave.length === 0) {
      return toast.error("Ingresa al menos una lectura de remanente.");
    }

    const toastId = toast.loading("Guardando inspección...");
    try {
      await recordMassInspection(
        selectedTruck.id,
        user!.uid, // ID del Inspector
        Number(odometer),
        inspectionsToSave,
      );
      toast.success("¡Inspección guardada!", { id: toastId });
      // Resetear para la siguiente inspección
      setSelectedTruck(null);
      setSearchTerm("");
    } catch (error) {
      toast.error("Error al guardar", { id: toastId });
    }
  };

  // VISTA 1: BUSCADOR DE CAMIONES
  if (!selectedTruck) {
    return (
      <div className="max-w-md mx-auto bg-slate-50 min-h-screen pb-20">
        <div className="bg-blue-600 text-white p-6 pt-12 rounded-b-3xl shadow-md">
          <h1 className="text-2xl font-black tracking-tight">
            Nueva Inspección
          </h1>
          <p className="text-blue-200 text-sm mt-1">
            Busca la unidad a evaluar
          </p>

          <div className="relative mt-6">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Placa del Camión..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white rounded-xl text-slate-900 font-black uppercase outline-none shadow-sm"
            />
          </div>
        </div>

        <div className="p-4 space-y-3 mt-4">
          {trucks.map((truck) => (
            <button
              key={truck.id}
              onClick={() => handleSelectTruck(truck)}
              className="w-full bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between active:scale-95 transition-transform"
            >
              <div className="flex items-center gap-4">
                <div className="bg-slate-100 p-3 rounded-xl">
                  <TruckIcon className="w-6 h-6 text-slate-600" />
                </div>
                <div className="text-left">
                  <h3 className="font-black text-slate-800 text-lg uppercase">
                    {truck.licensePlate}
                  </h3>
                  <p className="text-xs font-bold text-slate-400 uppercase">
                    {truck.brand} • {truck.axleConfig}
                  </p>
                </div>
              </div>
              <ChevronRightIcon className="w-5 h-5 text-slate-300" />
            </button>
          ))}
        </div>
      </div>
    );
  }

  // VISTA 2: FORMULARIO DE INSPECCIÓN (ESTILO EXCEL)
  return (
    <div className="max-w-md mx-auto bg-slate-50 min-h-screen pb-24">
      {/* HEADER FIJO */}
      <div className="sticky top-0 z-10 bg-white border-b border-slate-200 shadow-sm px-4 py-4 flex items-center justify-between">
        <div>
          <h2 className="font-black text-slate-900 text-xl uppercase">
            {selectedTruck.licensePlate}
          </h2>
          <p className="text-xs font-bold text-slate-400 uppercase">
            Inspección de Ruta
          </p>
        </div>
        <button
          onClick={() => setSelectedTruck(null)}
          className="text-xs font-black text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg"
        >
          Cambiar
        </button>
      </div>

      <div className="p-4 space-y-6">
        {/* ODÓMETRO */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
          <label className="block text-xs font-black text-slate-500 uppercase mb-2">
            Kilometraje / Horas actual
          </label>
          <div className="relative">
            <Gauge className="absolute left-3 top-1/2 transform -translate-y-1/2 text-emerald-500 w-5 h-5" />
            <input
              type="number"
              value={odometer}
              onChange={(e) =>
                setOdometer(e.target.value ? Number(e.target.value) : "")
              }
              placeholder="Ej. 145000"
              className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-mono font-black text-lg outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <p className="text-[10px] text-slate-400 font-bold mt-2">
            Último registro: {selectedTruck.currentOdometer} KM
          </p>
        </div>

        {/* LISTA DE LLANTAS */}
        <div className="space-y-4">
          <h3 className="font-black text-slate-800 flex items-center gap-2 px-1">
            <Activity className="w-5 h-5 text-blue-600" /> Neumáticos Instalados
            ({tires.length})
          </h3>

          {loading ? (
            <div className="text-center p-8 text-slate-400 font-bold animate-pulse">
              Cargando posiciones...
            </div>
          ) : tires.length === 0 ? (
            <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl text-amber-800 text-sm font-bold flex gap-2">
              <AlertCircle className="w-5 h-5 shrink-0" /> Este camión no tiene
              llantas asignadas en el sistema.
            </div>
          ) : (
            tires.map((tire) => (
              <div
                key={tire.id}
                className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col gap-3"
              >
                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                  <div>
                    <span className="bg-slate-800 text-white text-[10px] font-black px-2 py-1 rounded uppercase tracking-wider">
                      POS: {tire.position || "S/P"}
                    </span>
                    <span className="ml-2 font-black text-blue-600 text-sm">
                      {tire.serialNumber}
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">
                    {tire.brand}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">
                      Remanente (mm)
                    </label>
                    <input
                      type="number"
                      placeholder="Ej. 12.5"
                      value={readings[tire.id]?.depth}
                      onChange={(e) =>
                        setReadings({
                          ...readings,
                          [tire.id]: {
                            ...readings[tire.id],
                            depth: e.target.value,
                          },
                        })
                      }
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-black font-mono outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">
                      Presión (PSI)
                    </label>
                    <input
                      type="number"
                      placeholder="Ej. 110"
                      value={readings[tire.id]?.pressure}
                      onChange={(e) =>
                        setReadings({
                          ...readings,
                          [tire.id]: {
                            ...readings[tire.id],
                            pressure: e.target.value,
                          },
                        })
                      }
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm font-black font-mono outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <input
                  type="text"
                  placeholder="Observación opcional..."
                  value={readings[tire.id]?.notes}
                  onChange={(e) =>
                    setReadings({
                      ...readings,
                      [tire.id]: {
                        ...readings[tire.id],
                        notes: e.target.value,
                      },
                    })
                  }
                  className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-medium outline-none focus:border-slate-400"
                />
              </div>
            ))
          )}
        </div>
      </div>

      {/* BOTÓN FLOTANTE PARA GUARDAR */}
      {tires.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t border-slate-200 max-w-md mx-auto z-20">
          <button
            onClick={handleSaveInspection}
            className="w-full bg-slate-900 text-white font-black uppercase tracking-wider py-4 rounded-xl shadow-lg hover:bg-slate-800 flex items-center justify-center gap-2 active:scale-95 transition-all"
          >
            <Save className="w-5 h-5" /> Guardar Inspección Completa
          </button>
        </div>
      )}
    </div>
  );
}

// Icono auxiliar
const ChevronRightIcon = (props: any) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="m9 18 6-6-6-6" />
  </svg>
);
