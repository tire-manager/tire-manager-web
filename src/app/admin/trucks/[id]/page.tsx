// src/app/admin/trucks/[id]/page.tsx
"use client";
import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Truck as TruckIcon,
  User,
  Wrench,
  AlertTriangle,
} from "lucide-react";
import { getTruckById } from "@/services/truckService";
import { getTiresByTruckId } from "@/services/tireService";
import { getUserProfile } from "@/services/userService";
import { Truck } from "@/types/truck";
import { Tire } from "@/types/tire";
import { UserProfile } from "@/types/user";
import { AssignTireModal } from "@/components/trucks/AssignTireModal";
import { AssignDriverModal } from "@/components/trucks/AssignDriverModal";

export default function TruckDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const truckId = params.id as string;

  const [truck, setTruck] = useState<Truck | null>(null);
  const [driver, setDriver] = useState<UserProfile | null>(null);
  const [tires, setTires] = useState<Tire[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isDriverModalOpen, setIsDriverModalOpen] = useState(false);

  const reloadTruckData = async () => {
    setLoading(true);
    const truckData = await getTruckById(truckId);
    if (truckData) {
      setTruck(truckData);
      if (truckData.assignedDriverId) {
        const driverData = await getUserProfile(truckData.assignedDriverId);
        setDriver(driverData);
      } else {
        setDriver(null);
      }
    }
    setLoading(false);
  };

  const reloadData = async () => {
    setLoading(true);
    const tiresData = await getTiresByTruckId(truckId);
    setTires(tiresData);
    setLoading(false);
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const truckData = await getTruckById(truckId);
        if (truckData) {
          setTruck(truckData);

          // Cargar datos del chofer si tiene uno asignado
          if (truckData.assignedDriverId) {
            const driverData = await getUserProfile(truckData.assignedDriverId);
            setDriver(driverData);
          }

          // Cargar neumáticos asignados al camión
          const tiresData = await getTiresByTruckId(truckId);
          setTires(tiresData);
        }
      } catch (error) {
        console.error("Error cargando detalles:", error);
      } finally {
        setLoading(false);
      }
    };

    if (truckId) loadData();
  }, [truckId]);

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-500">
        Cargando detalles del vehículo...
      </div>
    );
  }

  if (!truck) {
    return (
      <div className="p-8 text-center text-red-500">
        No se encontró el vehículo.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Botón Volver y Encabezado */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.push("/admin/trucks")}
          className="p-2 bg-white rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            Camión {truck.licensePlate}
            <span
              className={`text-xs px-2 py-1 rounded-md font-semibold ml-2 ${
                truck.status === "ACTIVE"
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-amber-100 text-amber-700"
              }`}
            >
              {truck.status === "ACTIVE" ? "Operativo" : "Mantenimiento"}
            </span>
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            {truck.brand} {truck.model} ({truck.year})
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Panel Izquierdo: Info y Chofer */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-blue-600" />
              Chofer Asignado
            </h3>
            {driver ? (
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <p className="font-semibold text-slate-900">
                  {driver.displayName}
                </p>
                <p className="text-sm text-slate-500">{driver.email}</p>
              </div>
            ) : (
              <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 flex items-start gap-3 text-amber-800 text-sm">
                <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                <p>
                  Este vehículo no tiene un chofer asignado. El registro de
                  inspecciones estará bloqueado hasta que se asigne uno.
                </p>
              </div>
            )}
            <button
              onClick={() => setIsDriverModalOpen(true)}
              className="mt-4 w-full py-2.5 bg-white border border-slate-200 text-slate-700 font-medium rounded-xl hover:bg-slate-50 transition-colors text-sm"
            >
              {driver ? "Cambiar Chofer" : "Asignar Chofer"}
            </button>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Wrench className="w-5 h-5 text-slate-600" />
              Acciones de Flota
            </h3>
            <button className="w-full py-2.5 bg-white border border-slate-200 text-red-600 font-medium rounded-xl hover:bg-red-50 transition-colors text-sm mb-3">
              Enviar a Taller (Inactivo)
            </button>
          </div>
        </div>

        {/* Panel Derecho: Neumáticos */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <TruckIcon className="w-5 h-5 text-blue-600" />
              Esquema de Neumáticos
            </h3>
            <button
              onClick={() => setIsAssignModalOpen(true)}
              className="text-sm bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg font-medium hover:bg-blue-100 transition-colors"
            >
              Asignar Neumático
            </button>
          </div>

          {tires.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-xl">
              <p className="text-slate-500 font-medium">
                No hay neumáticos asignados a este camión.
              </p>
              <p className="text-slate-400 text-sm mt-1">
                Haz clic en "Asignar Neumático" para empezar a armar la flota.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Aquí renderizaremos las tarjetas de los neumáticos asignados */}
              {tires.map((tire) => (
                <div
                  key={tire.id}
                  className="border border-slate-200 p-4 rounded-xl flex flex-col"
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-bold text-slate-800">
                      {tire.position?.replace(/_/g, " ")}
                    </span>
                    <span className="text-xs font-mono bg-slate-100 px-2 py-1 rounded text-slate-600">
                      {tire.serialNumber}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-auto">
                    <div className="flex-1 bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${tire.currentTreadDepth < 3 ? "bg-red-500" : tire.currentTreadDepth < 6 ? "bg-amber-400" : "bg-emerald-500"}`}
                        style={{
                          width: `${Math.min((tire.currentTreadDepth / 12) * 100, 100)}%`,
                        }}
                      ></div>
                    </div>
                    <span className="font-bold text-slate-700 text-sm">
                      {tire.currentTreadDepth} mm
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <AssignDriverModal
        isOpen={isDriverModalOpen}
        onClose={() => setIsDriverModalOpen(false)}
        truckId={truckId}
        currentDriverId={truck?.assignedDriverId}
        onSuccess={reloadTruckData}
      />

      <AssignTireModal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        truckId={truckId}
        onSuccess={reloadData}
      />
    </div>
  );
}
