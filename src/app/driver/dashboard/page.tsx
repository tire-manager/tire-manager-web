"use client";
import React, { useEffect, useState } from "react";
import { Truck, AlertTriangle, Save, Activity, Gauge } from "lucide-react";
import { auth } from "@/lib/firebase/clientApp";
import { onAuthStateChanged } from "firebase/auth";
import { getUserProfile } from "@/services/userService";
import { getTruckById } from "@/services/truckService";
import { getInventory, recordMassInspection } from "@/services/tireService";
import { UserProfile } from "@/types/user";
import { Truck as TruckType } from "@/types/truck";
import { Tire } from "@/types/tire";
import toast from "react-hot-toast";

// Interfaz para controlar el formulario dinámico
type MassInspectionForm = {
  [tireId: string]: {
    depth: string;
    condition: "NORMAL" | "ANORMAL";
    notes: string;
  };
};

export default function DriverDashboard() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [truck, setTruck] = useState<TruckType | null>(null);
  const [tires, setTires] = useState<Tire[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Estados del formulario masivo
  const [truckOdometer, setTruckOdometer] = useState("");
  const [inspectionData, setInspectionData] = useState<MassInspectionForm>({});

  const loadDriverData = async (uid: string) => {
    try {
      const profile = await getUserProfile(uid);
      setUser(profile);

      if (profile?.truckId) {
        const truckData = await getTruckById(profile.truckId);
        setTruck(truckData);

        if (truckData) {
          if (truckData.currentOdometer)
            setTruckOdometer(truckData.currentOdometer.toString());

          const allTires = await getInventory();
          const assignedTires = allTires.filter(
            (t) => t.truckId === profile.truckId && t.status === "IN_USE",
          );

          // Ordenar por posición para que la lista tenga sentido lógico
          assignedTires.sort((a, b) => Number(a.position) - Number(b.position));
          setTires(assignedTires);

          // Inicializar el formulario masivo con los valores actuales de cada llanta
          const initialFormData: MassInspectionForm = {};
          assignedTires.forEach((t) => {
            initialFormData[t.id] = {
              depth: t.currentTreadDepth.toString(),
              condition: "NORMAL",
              notes: "",
            };
          });
          setInspectionData(initialFormData);
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) loadDriverData(firebaseUser.uid);
      else setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleInputChange = (tireId: string, field: string, value: string) => {
    setInspectionData((prev) => ({
      ...prev,
      [tireId]: { ...prev[tireId], [field]: value },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !truck) return;

    const newOdometer = parseFloat(truckOdometer);
    if (truck.currentOdometer && newOdometer < truck.currentOdometer) {
      toast.error(
        "El kilometraje no puede ser menor al registrado anteriormente.",
      );
      return;
    }

    // Preparar el array de datos para enviarlo al Firebase Batch
    const inspectionsArray = tires.map((tire) => {
      const data = inspectionData[tire.id];
      const newDepth = parseFloat(data.depth);

      if (newDepth > tire.currentTreadDepth) {
        throw new Error(
          `Error en posición ${tire.position}: El desgaste nuevo no puede ser mayor al anterior.`,
        );
      }

      return {
        tireId: tire.id,
        newTreadDepth: newDepth,
        condition: data.condition,
        notes: data.notes,
      };
    });

    setSaving(true);
    try {
      await toast.promise(
        recordMassInspection(truck.id, user.uid, newOdometer, inspectionsArray),
        {
          loading: "Guardando inspección masiva...",
          success: "¡Todas las inspecciones guardadas!",
          error: "Hubo un error al guardar",
        },
      );
      // Recargar datos para ver los cambios actualizados
      await loadDriverData(user.uid);
    } catch (error: any) {
      toast.error(error.message || "Error de validación");
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return (
      <div className="p-8 text-center font-bold text-slate-500">
        Cargando tu panel...
      </div>
    );

  if (!user?.truckId || !truck) {
    return (
      <div className="max-w-md mx-auto mt-10 bg-amber-50 border border-amber-200 p-6 rounded-2xl text-center">
        <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-amber-900 mb-2">
          Sin vehículo asignado
        </h2>
        <p className="text-amber-700 text-sm">
          Contacta al administrador para que te asigne una unidad.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-lg">
        <h1 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-2">
          <Truck className="w-4 h-4" /> Inspección de Unidad
        </h1>
        <p className="text-3xl font-black">{truck.licensePlate}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Kilometraje General */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <label className="block text-sm font-black text-slate-800 mb-2 flex items-center gap-2">
            <Gauge className="w-5 h-5 text-blue-600" /> Kilómetros de la unidad
          </label>
          <input
            type="number"
            required
            min={truck.currentOdometer || 0}
            value={truckOdometer}
            onChange={(e) => setTruckOdometer(e.target.value)}
            className="w-full sm:w-1/2 p-4 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xl font-bold focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="Ej: 150000"
          />
        </div>

        {/* Lista de Llantas (Diseño Mobile-First) */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-600" />
            <h2 className="font-bold text-slate-800">Detalle por Posición</h2>
          </div>

          <div className="divide-y divide-slate-100">
            {tires.map((tire) => (
              <div
                key={tire.id}
                className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-12 gap-4 items-center hover:bg-slate-50/50 transition-colors"
              >
                {/* Info de la llanta */}
                <div className="md:col-span-3 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center font-black text-slate-700 shadow-inner">
                    {tire.position}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">
                      {tire.serialNumber}
                    </p>
                    <p className="text-xs text-slate-500">
                      Última: {tire.currentTreadDepth}mm
                    </p>
                  </div>
                </div>

                {/* Input Profundidad */}
                <div className="md:col-span-3">
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1 md:hidden">
                    Profundidad (mm)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    max={tire.currentTreadDepth}
                    value={inspectionData[tire.id]?.depth || ""}
                    onChange={(e) =>
                      handleInputChange(tire.id, "depth", e.target.value)
                    }
                    className="w-full p-3 bg-white border border-slate-300 rounded-xl font-bold focus:ring-2 focus:ring-blue-500 outline-none text-center"
                  />
                </div>

                {/* Select Desgaste */}
                <div className="md:col-span-3">
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1 md:hidden">
                    Desgaste
                  </label>
                  <select
                    value={inspectionData[tire.id]?.condition || "NORMAL"}
                    onChange={(e) =>
                      handleInputChange(tire.id, "condition", e.target.value)
                    }
                    className={`w-full p-3 rounded-xl font-bold outline-none border focus:ring-2 focus:ring-blue-500 text-center cursor-pointer ${
                      inspectionData[tire.id]?.condition === "NORMAL"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-red-50 text-red-700 border-red-200"
                    }`}
                  >
                    <option value="NORMAL">NORMAL</option>
                    <option value="ANORMAL">ANORMAL</option>
                  </select>
                </div>

                {/* Input Observaciones */}
                <div className="md:col-span-3">
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1 md:hidden">
                    Observaciones
                  </label>
                  <input
                    type="text"
                    placeholder="Opcional..."
                    value={inspectionData[tire.id]?.notes || ""}
                    onChange={(e) =>
                      handleInputChange(tire.id, "notes", e.target.value)
                    }
                    className="w-full p-3 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm text-slate-600"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Botón Flotante/Fijo Guardar */}
        <div className="sticky bottom-4 z-10">
          <button
            type="submit"
            disabled={saving || tires.length === 0}
            className="w-full py-4 bg-blue-600 text-white font-black rounded-2xl hover:bg-blue-700 transition-all shadow-xl shadow-blue-600/30 flex justify-center items-center gap-2 disabled:opacity-50 text-lg"
          >
            {saving ? (
              "Procesando..."
            ) : (
              <>
                <Save className="w-6 h-6" /> Guardar Inspección Completa
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
