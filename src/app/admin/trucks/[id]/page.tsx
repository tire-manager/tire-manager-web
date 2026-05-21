// src/app/admin/trucks/[id]/page.tsx
"use client";
import React, { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Truck,
  Package,
  Activity,
  Gauge,
  X,
  Wrench,
  Archive,
  Edit,
  AlertCircle,
  ChevronDown,
  Download,
  TrendingDown,
  Camera,
  ClipboardCheck, // <-- Icono para la inspección
} from "lucide-react";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LabelList, // <-- IMPORTANTE PARA LOS NÚMEROS EN EL GRÁFICO
} from "recharts";

import { getTruckById } from "@/services/truckService";
import {
  assignTireToTruck,
  getInventory,
  unmountTire,
  getTireHistory,
  uploadTirePhoto,
  getTruckInspectionHistory, // <-- NUEVA FUNCIÓN IMPORTADA
} from "@/services/tireService";
import { getWarehouses, Warehouse } from "@/services/warehouseService";
import { Truck as TruckType } from "@/types/truck";
import { Tire, TireHistory } from "@/types/tire";
import TruckVisualizer from "@/components/trucks/TruckVisualizer";
import { generateTruckTechnicalReportPDF } from "@/lib/utils/exportPDF";
import { generateInspectionReportPDF } from "@/lib/utils/exportInspectionPDF"; // <-- NUEVO REPORTE DE EVENTOS
import toast from "react-hot-toast";
import * as htmlToImage from "html-to-image";
import { TruckHistoryLog } from "../../../../components/trucks/TruckHistoryLog";
import { useAuth } from "@/context/AuthContext";
import { MassInspectionModal } from "@/components/trucks/MassInspectionModal";

const CHART_COLORS = [
  "#2563eb",
  "#dc2626",
  "#16a34a",
  "#d97706",
  "#9333ea",
  "#0891b2",
  "#be123c",
  "#ea580c",
  "#4f46e5",
  "#059669",
];

export default function TruckProfilePage() {
  const { user } = useAuth();

  const params = useParams();
  const [truck, setTruck] = useState<TruckType | null>(null);
  const [truckTires, setTruckTires] = useState<Tire[]>([]);
  const [loading, setLoading] = useState(true);

  const [isHeaderMenuOpen, setIsHeaderMenuOpen] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState<number | null>(null);
  const [selectedTire, setSelectedTire] = useState<Tire | null>(null);

  const [isMountModalOpen, setIsMountModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isUnmounting, setIsUnmounting] = useState(false);

  const [availableTires, setAvailableTires] = useState<Tire[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [selectedAvailableTireId, setSelectedAvailableTireId] = useState("");
  const [saving, setSaving] = useState(false);

  const [chartData, setChartData] = useState<any[]>([]);
  const [tiresHistories, setTiresHistories] = useState<
    Record<string, TireHistory[]>
  >({});
  const [pastTires, setPastTires] = useState<Tire[]>([]);

  const [photoFile, setPhotoFile] = useState<File | null>(null);

  const [isMassInspectionModalOpen, setIsMassInspectionModalOpen] =
    useState(false);

  // <-- ESTADOS PARA LA BITÁCORA PAGINADA -->
  const [historyEvents, setHistoryEvents] = useState<TireHistory[]>([]);
  const [lastDoc, setLastDoc] = useState<any>(null);
  const [isMoreLoading, setIsMoreLoading] = useState(false);

  const [unmountData, setUnmountData] = useState({
    warehouseId: "",
    currentOdometer: 0,
    currentTreadDepth: 0,
    reason: "Mantenimiento Preventivo",
  });

  const loadData = async () => {
    if (!params.id) return;
    setLoading(true);
    try {
      const [truckData, allTires, allWarehouses] = await Promise.all([
        getTruckById(params.id as string),
        getInventory(),
        getWarehouses(),
      ]);

      setTruck(truckData);
      setWarehouses(allWarehouses.filter((w) => w.status === "ACTIVE"));

      if (truckData) {
        const installed = allTires.filter(
          (t) => t.truckId === truckData.id && t.status === "IN_USE",
        );
        setTruckTires(installed);
        setAvailableTires(allTires.filter((t) => t.status === "AVAILABLE"));

        const historicalTires: Tire[] = [];

        for (const tire of allTires) {
          if (tire.truckId !== truckData.id) {
            const history = (await getTireHistory(tire.id)) as TireHistory[];
            const wasOnThisTruck = history.some(
              (h) => h.truckId === truckData.id,
            );
            if (wasOnThisTruck) historicalTires.push(tire);
          }
        }

        setPastTires(historicalTires);
        await loadChartData([...installed, ...historicalTires]);

        // Cargamos la primera página del historial cronológico
        loadHistory(truckData.id, true);
      }
    } catch (error) {
      console.error("Error cargando perfil:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async (truckId: string, isFirstLoad = true) => {
    setIsMoreLoading(true);
    try {
      const { events, lastVisible } = await getTruckInspectionHistory(
        truckId,
        10,
        isFirstLoad ? undefined : lastDoc,
      );

      setHistoryEvents((prev) => (isFirstLoad ? events : [...prev, ...events]));
      setLastDoc(lastVisible);
    } catch (error) {
      console.error("Error cargando bitácora:", error);
    } finally {
      setIsMoreLoading(false);
    }
  };

  const loadChartData = async (installedTires: Tire[]) => {
    try {
      const dataMap = new Map<number, any>();
      const newHistories: Record<string, TireHistory[]> = {};

      for (const tire of installedTires) {
        const history = (await getTireHistory(tire.id)) as TireHistory[];
        newHistories[tire.id] = history;

        for (const event of history) {
          const odo = event.currentOdometer;
          if (!odo || odo <= 0) continue;

          if (!dataMap.has(odo)) {
            dataMap.set(odo, { odometer: odo, date: event.date });
          }

          const point = dataMap.get(odo);
          point[tire.serialNumber] = event.newTreadDepth;
        }
      }

      const sortedData = Array.from(dataMap.values()).sort(
        (a, b) => a.odometer - b.odometer,
      );
      setChartData(sortedData);
      setTiresHistories(newHistories);
    } catch (error) {
      console.error("Error procesando datos del gráfico", error);
    }
  };

  useEffect(() => {
    loadData();
  }, [params.id]);

  const handleTireClick = (posicion: number, llanta: Tire | undefined) => {
    setSelectedPosition(posicion);

    if (llanta) {
      setSelectedTire(llanta);
      setUnmountData({
        warehouseId: "",
        currentOdometer: truck?.currentOdometer || 0,
        currentTreadDepth: llanta.currentTreadDepth,
        reason: "Mantenimiento Preventivo",
      });
      setIsDetailsModalOpen(true);
      setIsUnmounting(false);
      setPhotoFile(null);
    } else {
      setSelectedTire(null);
      setIsMountModalOpen(true);
    }
  };

  if (loading)
    return (
      <div className="p-8 text-center text-slate-500 font-bold">
        Cargando datos de la unidad...
      </div>
    );
  if (!truck)
    return (
      <div className="p-8 text-center text-red-500 font-bold">
        Camión no encontrado
      </div>
    );

  const handleConfirmUnmount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTire || !unmountData.warehouseId) {
      toast.error("Selecciona un almacén de destino");
      return;
    }

    if (unmountData.currentOdometer < (truck.currentOdometer || 0)) {
      toast.error("El odómetro de retiro no puede ser menor al actual");
      return;
    }

    setSaving(true);
    const toastId = toast.loading("Procesando retiro...");

    try {
      let imageUrl = undefined;

      if (photoFile) {
        toast.loading("Subiendo evidencia fotográfica...", { id: toastId });
        imageUrl = await uploadTirePhoto(photoFile, selectedTire.id);
      }

      toast.loading("Registrando en historial...", { id: toastId });

      await unmountTire(
        selectedTire.id,
        unmountData.warehouseId,
        user?.uid || "SYSTEM",
        unmountData.currentOdometer,
        unmountData.currentTreadDepth,
        unmountData.reason,
        imageUrl,
      );

      toast.success("¡Llanta retirada exitosamente!", { id: toastId });

      setIsDetailsModalOpen(false);
      setPhotoFile(null);
      loadData();
    } catch (error) {
      console.error(error);
      toast.error("Error al procesar el retiro", { id: toastId });
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmMount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAvailableTireId || selectedPosition === null || !truck) return;

    const initialOdo = truck.currentOdometer || 0;

    setSaving(true);
    try {
      await toast.promise(
        assignTireToTruck(
          selectedAvailableTireId,
          truck.id,
          selectedPosition.toString(),
          initialOdo,
        ),
        {
          loading: "Montando llanta...",
          success: "¡Llanta instalada correctamente!",
          error: "Error al montar",
        },
      );
      setIsMountModalOpen(false);
      setSelectedAvailableTireId("");
      loadData();
    } catch (error) {
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const handleExportPDF = async () => {
    if (!truck) return;

    setIsHeaderMenuOpen(false);
    const toastId = toast.loading("Preparando informe técnico completo...");

    try {
      const chartElement = document.getElementById("chart-container");
      let chartImage = undefined;

      if (chartElement) {
        chartImage = await htmlToImage.toPng(chartElement, {
          pixelRatio: 2,
          backgroundColor: "#ffffff",
        });
      }

      await generateTruckTechnicalReportPDF(
        truck,
        truckTires,
        chartImage,
        tiresHistories,
        chartData,
        pastTires,
      );

      toast.success("Informe generado correctamente", { id: toastId });
    } catch (error) {
      console.error("Error al exportar PDF:", error);
      toast.error("No se pudo generar el reporte completo", { id: toastId });
    }
  };

  const handleExportLatestInspection = async () => {
    if (!truck || !truck.currentOdometer) return;
    setIsHeaderMenuOpen(false);

    const toastId = toast.loading("Generando Acta de Inspección...");
    try {
      // Ya NO necesitamos tomarle foto a la pantalla con htmlToImage
      await generateInspectionReportPDF(
        truck,
        truck.currentOdometer,
        [...truckTires, ...pastTires],
        tiresHistories,
      );
      toast.success("Acta generada exitosamente", { id: toastId });
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Error al generar el acta", { id: toastId });
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* ENCABEZADO CON DROPDOWN */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/trucks"
            className="p-3 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1">
                <Truck className="w-4 h-4" /> Detalle de Unidad
              </p>
              {truck.status === "INACTIVE" && (
                <span className="bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded font-black">
                  INACTIVO
                </span>
              )}
              {truck.status === "IN_MAINTENANCE" && (
                <span className="bg-amber-100 text-amber-700 text-xs px-2 py-0.5 rounded font-black">
                  TALLER
                </span>
              )}
            </div>
            <h1 className="text-3xl font-black text-slate-900 uppercase">
              {truck.licensePlate}
            </h1>
          </div>
        </div>

        <div className="relative">
          <button
            onClick={() => setIsHeaderMenuOpen(!isHeaderMenuOpen)}
            className="flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-slate-800 transition-colors shadow-md text-sm"
          >
            Opciones
            <ChevronDown
              className={`w-4 h-4 transition-transform ${isHeaderMenuOpen ? "rotate-180" : ""}`}
            />
          </button>

          {isHeaderMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsHeaderMenuOpen(false)}
              ></div>

              <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                {/* <button
                  onClick={handleExportPDF}
                  className="w-full text-left px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 hover:text-blue-600 flex items-center gap-2 border-b border-slate-100 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Informe Técnico Completo
                </button>
                <button
                  onClick={handleExportLatestInspection}
                  className="w-full text-left px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 hover:text-amber-600 flex items-center gap-2 border-b border-slate-100 transition-colors"
                >
                  <ClipboardCheck className="w-4 h-4" />
                  Acta de Última Inspección
                </button> */}
                <button
                  onClick={() => setIsMassInspectionModalOpen(true)}
                  className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-emerald-700 transition-colors shadow-sm"
                >
                  <Activity className="w-4 h-4" /> Digitar Hoja Inspección
                </button>
                <button
                  onClick={() => {
                    setIsHeaderMenuOpen(false);
                    setIsEditModalOpen(true);
                  }}
                  className="w-full text-left px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 hover:text-blue-600 flex items-center gap-2 transition-colors"
                >
                  <Edit className="w-4 h-4" />
                  Editar Unidad
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* TARJETAS DE RESUMEN */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-lg flex items-center gap-4">
          <div className="bg-blue-500/20 p-4 rounded-xl border border-blue-500/30">
            <Gauge className="w-8 h-8 text-blue-400" />
          </div>
          <div>
            <p className="text-slate-400 text-xs uppercase font-black tracking-widest mb-1">
              Odómetro Actual
            </p>
            <p className="text-3xl font-mono font-black text-emerald-400">
              {truck.currentOdometer
                ? `${truck.currentOdometer.toLocaleString()} KM`
                : "0 KM"}
            </p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
            <Package className="w-8 h-8 text-slate-600" />
          </div>
          <div>
            <p className="text-slate-500 text-xs uppercase font-black tracking-widest mb-1">
              Llantas Instaladas
            </p>
            <p className="text-3xl font-black text-slate-800">
              {truckTires.length}
            </p>
          </div>
        </div>
      </div>

      {/* VISUALIZADOR DE EJES */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
          <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-600" />
            Esquema Operativo de Llantas
          </h2>
          <p className="text-sm font-bold text-slate-500 bg-slate-50 px-3 py-1 rounded-lg">
            Configuración: {truck.axleConfig?.replace(/_/g, " ")}
          </p>
        </div>

        <TruckVisualizer
          layoutType={(truck.axleConfig as any) || "3_EJES_10_LLANTAS"}
          assignedTires={truckTires}
          onTireClick={handleTireClick}
        />
      </div>

      {/* GRÁFICO DE CURVA DE DESGASTE */}
      {chartData.length > 0 && (
        <div
          className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mt-6"
          id="chart-container"
        >
          <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
                <TrendingDown className="w-5 h-5 text-amber-600" />
                Curva de Desgaste (Línea de Vida)
              </h2>
              <p className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-wider">
                Evolución del remanente por cada neumático instalado
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs font-bold text-slate-500 bg-red-50 text-red-700 px-3 py-1.5 rounded-lg border border-red-100">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
              Límite de Seguridad: 4.0 mm
            </div>
          </div>

          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{ top: 20, right: 30, left: 0, bottom: 10 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#e2e8f0"
                />
                <XAxis
                  dataKey="odometer"
                  tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`}
                  stroke="#94a3b8"
                  fontSize={12}
                  fontWeight={700}
                />
                <YAxis
                  domain={[0, 22]}
                  stroke="#94a3b8"
                  fontSize={12}
                  fontWeight={700}
                  tickFormatter={(val) => `${val}mm`}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: "12px",
                    border: "none",
                    boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                  }}
                  labelFormatter={(val) =>
                    `Odómetro: ${val.toLocaleString()} KM`
                  }
                />
                <Legend
                  iconType="circle"
                  wrapperStyle={{
                    paddingTop: "20px",
                    fontSize: "12px",
                    fontWeight: "bold",
                  }}
                />

                {truckTires.map((tire, index) => (
                  <Line
                    key={tire.id}
                    type="monotone"
                    dataKey={tire.serialNumber}
                    name={`Serie ${tire.serialNumber} (Pos ${tire.position})`}
                    stroke={CHART_COLORS[index % CHART_COLORS.length]}
                    strokeWidth={3}
                    dot={{ r: 4, strokeWidth: 2 }}
                    activeDot={{ r: 7 }}
                    connectNulls={true}
                  >
                    {/* ETIQUETAS VISIBLES PARA EL PDF */}
                    <LabelList
                      dataKey={tire.serialNumber}
                      position="top"
                      offset={10}
                      fontSize={11}
                      fontWeight="bold"
                      fill={CHART_COLORS[index % CHART_COLORS.length]}
                      formatter={(value: any) =>
                        value !== undefined ? `${value}` : ""
                      }
                    />
                  </Line>
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* BITÁCORA DE EVENTOS MODULARIZADA */}
      <TruckHistoryLog
        truck={truck}
        allTires={[...truckTires, ...pastTires]}
        tiresHistories={tiresHistories}
      />

      {/* MODALES DE DESMONTAJE Y MONTAJE (SIN CAMBIOS ESTRUCTURALES) */}
      {isDetailsModalOpen && selectedTire && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50">
              <h3 className="font-black text-xl text-slate-800 flex items-center gap-2">
                <Wrench className="w-5 h-5 text-slate-500" /> Posición{" "}
                {selectedPosition}
              </h3>
              <button
                onClick={() => setIsDetailsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 bg-white p-2 rounded-full shadow-sm"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-2 gap-4 mb-6 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">
                    Marca / Modelo
                  </p>
                  <p className="font-bold text-slate-900 uppercase">
                    {selectedTire.brand} {selectedTire.model}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">
                    Folio (Serie)
                  </p>
                  <p className="font-mono font-bold text-blue-600">
                    {selectedTire.serialNumber}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">
                    Profundidad Actual
                  </p>
                  <p className="font-bold text-slate-900">
                    {selectedTire.currentTreadDepth} mm
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">
                    KM de Instalación
                  </p>
                  <p className="font-mono font-bold text-emerald-600">
                    {selectedTire.initialOdometer
                      ? `${selectedTire.initialOdometer.toLocaleString()} KM`
                      : "N/A"}
                  </p>
                </div>
              </div>

              {!isUnmounting ? (
                <div className="flex justify-end gap-3 pt-2">
                  <button
                    onClick={() => setIsDetailsModalOpen(false)}
                    className="px-5 py-2.5 text-slate-600 font-bold hover:bg-slate-100 rounded-xl transition-colors"
                  >
                    Cerrar
                  </button>
                  <button
                    onClick={() => setIsUnmounting(true)}
                    className="flex items-center gap-2 bg-amber-600 text-white px-5 py-2.5 rounded-xl font-black hover:bg-amber-700 transition-colors shadow-lg shadow-amber-600/20"
                  >
                    <Wrench className="w-4 h-4" /> Registrar Retiro
                  </button>
                </div>
              ) : (
                <form
                  onSubmit={handleConfirmUnmount}
                  className="bg-amber-50 p-5 rounded-2xl border border-amber-200 mt-2 animate-in fade-in slide-in-from-bottom-2"
                >
                  <div className="flex items-center gap-2 mb-4 text-amber-800">
                    <AlertCircle className="w-5 h-5" />
                    <h4 className="font-black">Formulario de Desmontaje</h4>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-black text-amber-900 uppercase mb-1">
                          Odómetro del Camión
                        </label>
                        <input
                          type="number"
                          required
                          value={unmountData.currentOdometer}
                          onChange={(e) =>
                            setUnmountData({
                              ...unmountData,
                              currentOdometer: parseInt(e.target.value) || 0,
                            })
                          }
                          className="w-full p-2.5 bg-white border border-amber-200 rounded-lg outline-none focus:ring-2 focus:ring-amber-500 font-mono font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-black text-amber-900 uppercase mb-1">
                          Desgaste Actual (mm)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          required
                          value={unmountData.currentTreadDepth}
                          onChange={(e) =>
                            setUnmountData({
                              ...unmountData,
                              currentTreadDepth:
                                parseFloat(e.target.value) || 0,
                            })
                          }
                          className="w-full p-2.5 bg-white border border-amber-200 rounded-lg outline-none focus:ring-2 focus:ring-amber-500 font-bold"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-black text-amber-900 uppercase mb-1">
                        Motivo del Retiro
                      </label>
                      <select
                        value={unmountData.reason}
                        onChange={(e) =>
                          setUnmountData({
                            ...unmountData,
                            reason: e.target.value,
                          })
                        }
                        className="w-full p-2.5 bg-white border border-amber-200 rounded-lg outline-none focus:ring-2 focus:ring-amber-500 font-bold text-slate-700"
                      >
                        <option value="Mantenimiento Preventivo">
                          Mantenimiento Preventivo
                        </option>
                        <option value="Pinchazo / Daño">
                          Pinchazo / Daño Operativo
                        </option>
                        <option value="Límite de Desgaste">
                          Límite de Desgaste (Baja)
                        </option>
                        <option value="Rotación">Rotación de Ejes</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-black text-amber-900 uppercase mb-1 flex items-center gap-1">
                        <Camera className="w-3.5 h-3.5" /> Evidencia Fotográfica
                        (Opcional)
                      </label>
                      <div className="relative">
                        <input
                          type="file"
                          accept="image/*"
                          capture="environment"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              setPhotoFile(e.target.files[0]);
                            }
                          }}
                          className="hidden"
                          id="tire-photo-upload"
                        />
                        <label
                          htmlFor="tire-photo-upload"
                          className="flex items-center justify-center w-full p-3 bg-white border-2 border-dashed border-amber-300 rounded-lg cursor-pointer hover:bg-amber-50 transition-colors"
                        >
                          {photoFile ? (
                            <span className="text-sm font-bold text-amber-700 truncate">
                              📸 {photoFile.name}
                            </span>
                          ) : (
                            <span className="text-sm font-medium text-slate-500">
                              Haz clic para tomar/subir foto del daño
                            </span>
                          )}
                        </label>
                      </div>
                      {photoFile && (
                        <button
                          type="button"
                          onClick={() => setPhotoFile(null)}
                          className="text-[10px] text-red-500 font-bold uppercase mt-1 ml-1 hover:underline"
                        >
                          Quitar foto
                        </button>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-black text-amber-900 uppercase mb-1 flex items-center gap-1">
                        <Archive className="w-3.5 h-3.5" /> Almacén de Recepción
                      </label>
                      <select
                        required
                        value={unmountData.warehouseId}
                        onChange={(e) =>
                          setUnmountData({
                            ...unmountData,
                            warehouseId: e.target.value,
                          })
                        }
                        className="w-full p-2.5 bg-white border border-amber-300 rounded-lg outline-none focus:ring-2 focus:ring-amber-500 font-bold uppercase text-slate-800"
                      >
                        <option value="">-- Selecciona Destino --</option>
                        {warehouses.map((w) => (
                          <option key={w.id} value={w.id}>
                            {w.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 mt-6">
                    <button
                      type="button"
                      onClick={() => setIsUnmounting(false)}
                      className="px-4 py-2 text-amber-800 font-bold hover:bg-amber-100 rounded-xl transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="bg-amber-600 text-white px-6 py-2 rounded-xl font-black hover:bg-amber-700 disabled:opacity-50 transition-colors shadow-md"
                    >
                      {saving ? "Procesando..." : "Confirmar Retiro"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: MONTAR LLANTA */}
      {isMountModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-blue-50/50">
              <h3 className="font-black text-xl text-slate-800">
                Instalar Llanta{" "}
                <span className="text-blue-600">
                  Posición {selectedPosition}
                </span>
              </h3>
              <button
                onClick={() => setIsMountModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 bg-white p-2 rounded-full shadow-sm"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmMount} className="p-6">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mb-6 flex items-center gap-3">
                <Gauge className="w-8 h-8 text-emerald-500" />
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-0.5">
                    Odómetro de Instalación
                  </p>
                  <p className="font-mono font-black text-lg text-emerald-700">
                    {truck.currentOdometer
                      ? truck.currentOdometer.toLocaleString()
                      : "0"}{" "}
                    KM
                  </p>
                </div>
              </div>

              <label className="block text-sm font-black text-slate-700 mb-2">
                Selecciona llanta disponible en inventario
              </label>

              {availableTires.length === 0 ? (
                <div className="p-4 bg-red-50 text-red-700 rounded-xl border border-red-100 text-sm font-medium mb-6">
                  No hay llantas en stock. Ve a "Inventario" para registrar
                  nuevos ingresos.
                </div>
              ) : (
                <select
                  required
                  value={selectedAvailableTireId}
                  onChange={(e) => setSelectedAvailableTireId(e.target.value)}
                  className="w-full p-3.5 bg-white border border-slate-200 rounded-xl font-bold uppercase text-slate-800 outline-none focus:ring-2 focus:ring-blue-500 mb-6 shadow-sm"
                >
                  <option value="">-- Elige un neumático --</option>
                  {availableTires.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.serialNumber} • {t.brand} ({t.currentTreadDepth}mm)
                    </option>
                  ))}
                </select>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsMountModalOpen(false)}
                  className="px-5 py-3 text-slate-600 bg-slate-100 hover:bg-slate-200 font-bold rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving || availableTires.length === 0}
                  className="flex-1 py-3 bg-blue-600 text-white font-black rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 shadow-lg shadow-blue-600/30"
                >
                  {saving ? "Instalando..." : "Confirmar Instalación"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <MassInspectionModal
        isOpen={isMassInspectionModalOpen}
        onClose={() => setIsMassInspectionModalOpen(false)}
        onSuccess={() => {
          // Aquí llamas a tu función que recarga los datos (ej. fetchTruckAndTires o loadData)
          // para que la vista del camión se actualice sola después de guardar
          // fetchTruckAndTires();
        }}
        truck={truck}
        mountedTires={truckTires} // Asegúrate de pasarle las llantas instaladas actualmente
      />
    </div>
  );
}
