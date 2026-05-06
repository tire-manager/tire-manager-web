// src/app/admin/trucks/[id]/page.tsx
"use client";
import React, { useEffect, useState } from "react";
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
} from "lucide-react";
import { getTruckById } from "@/services/truckService";
import {
  assignTireToTruck,
  getInventory,
  unmountTire,
} from "@/services/tireService";
import { getWarehouses, Warehouse } from "@/services/warehouseService";
import { Truck as TruckType } from "@/types/truck";
import { Tire } from "@/types/tire";
import TruckVisualizer from "@/components/trucks/TruckVisualizer";
import { EditTruckModal } from "@/components/trucks/EditTruckModal";
import toast from "react-hot-toast";

export default function TruckProfilePage() {
  const params = useParams();
  const [truck, setTruck] = useState<TruckType | null>(null);
  const [truckTires, setTruckTires] = useState<Tire[]>([]);
  const [loading, setLoading] = useState(true);

  // ESTADOS PARA LOS MODALES
  const [selectedPosition, setSelectedPosition] = useState<number | null>(null);
  const [selectedTire, setSelectedTire] = useState<Tire | null>(null);

  const [isMountModalOpen, setIsMountModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isUnmounting, setIsUnmounting] = useState(false);

  // Estados de inventario y almacenes
  const [availableTires, setAvailableTires] = useState<Tire[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [selectedAvailableTireId, setSelectedAvailableTireId] = useState("");
  const [saving, setSaving] = useState(false);

  // Formulario de Desmontaje
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
        setTruckTires(
          allTires.filter(
            (t) => t.truckId === truckData.id && t.status === "IN_USE",
          ),
        );
        setAvailableTires(allTires.filter((t) => t.status === "AVAILABLE"));
      }
    } catch (error) {
      console.error("Error cargando perfil:", error);
    } finally {
      setLoading(false);
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
    try {
      await toast.promise(
        unmountTire(
          selectedTire.id,
          unmountData.warehouseId,
          "ADMIN", // Aquí idealmente iría el ID del usuario logueado
          unmountData.currentOdometer,
          unmountData.currentTreadDepth,
          unmountData.reason,
        ),
        {
          loading: "Registrando desmontaje...",
          success: "Llanta retirada y enviada al almacén",
          error: "Error al desmontar",
        },
      );
      setIsDetailsModalOpen(false);
      loadData();
    } catch (error) {
      console.error(error);
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

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* ENCABEZADO */}
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

        <button
          onClick={() => setIsEditModalOpen(true)}
          className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2.5 rounded-xl font-bold hover:bg-slate-50 transition-colors shadow-sm text-sm"
        >
          <Edit className="w-4 h-4" />
          Editar Unidad
        </button>
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

      {/* MODAL 1: DETALLES Y DESMONTAJE */}
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

      {truck && (
        <EditTruckModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSuccess={loadData}
          truck={truck}
        />
      )}
    </div>
  );
}
