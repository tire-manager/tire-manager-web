// Copiar y pegar en src/app/driver/dashboard/page.tsx
"use client";
import React, { useEffect, useState } from "react";
import {
  Truck,
  AlertTriangle,
  Ruler,
  Activity,
  CheckCircle,
  Save,
  X,
} from "lucide-react";
import { auth } from "@/lib/firebase/clientApp";
import { onAuthStateChanged } from "firebase/auth";
import { getUserProfile } from "@/services/userService";
import { getTruckById } from "@/services/truckService";
import { getInventory, recordInspection } from "@/services/tireService";
import { UserProfile } from "@/types/user";
import { Truck as TruckType } from "@/types/truck";
import { Tire } from "@/types/tire";
import toast from "react-hot-toast";

export default function DriverDashboard() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [truck, setTruck] = useState<TruckType | null>(null);
  const [tires, setTires] = useState<Tire[]>([]);
  const [loading, setLoading] = useState(true);

  // Estados para el Modal de Inspección
  const [selectedTire, setSelectedTire] = useState<Tire | null>(null);
  const [formData, setFormData] = useState({
    depth: "",
    odometer: "",
    notes: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const profile = await getUserProfile(firebaseUser.uid);
        setUser(profile);

        if (profile?.truckId) {
          const truckData = await getTruckById(profile.truckId);
          setTruck(truckData);

          if (truckData) {
            // Traemos todos los neumáticos y filtramos los de este camión
            const allTires = await getInventory();
            setTires(allTires.filter((t) => t.truckId === profile.truckId));

            // Pre-llenar el odómetro si el camión ya tiene uno registrado
            if (truckData.currentOdometer) {
              setFormData((prev) => ({
                ...prev,
                odometer: truckData.currentOdometer!.toString(),
              }));
            }
          }
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleInspectClick = (tire: Tire) => {
    setSelectedTire(tire);
    setFormData((prev) => ({
      ...prev,
      depth: tire.currentTreadDepth.toString(),
      notes: "",
    }));
  };

  const handleSubmitInspection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !truck || !selectedTire) return;

    const newDepth = parseFloat(formData.depth);
    const newOdometer = parseFloat(formData.odometer);

    // Validaciones básicas
    if (newDepth > selectedTire.currentTreadDepth) {
      toast.error("El desgaste nuevo no puede ser mayor al anterior.");
      return;
    }
    if (truck.currentOdometer && newOdometer < truck.currentOdometer) {
      toast.error(
        "El kilometraje actual no puede ser menor al último registrado del camión.",
      );
      return;
    }

    setSaving(true);
    try {
      await toast.promise(
        recordInspection(
          selectedTire.id,
          truck.id,
          user.uid,
          newDepth,
          newOdometer,
          formData.notes,
        ),
        {
          loading: "Registrando inspección...",
          success: "¡Inspección guardada correctamente!",
          error: "Error al guardar. Intenta de nuevo.",
        },
      );

      // Actualizar la vista local sin recargar la página
      setTires(
        tires.map((t) =>
          t.id === selectedTire.id ? { ...t, currentTreadDepth: newDepth } : t,
        ),
      );
      setTruck({ ...truck, currentOdometer: newOdometer });
      setSelectedTire(null);
    } catch (error) {
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return (
      <div className="p-8 text-center text-slate-500">Cargando tu panel...</div>
    );

  if (!user?.truckId || !truck) {
    return (
      <div className="max-w-md mx-auto mt-10 bg-amber-50 border border-amber-200 p-6 rounded-2xl text-center">
        <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-amber-900 mb-2">
          Sin vehículo asignado
        </h2>
        <p className="text-amber-700 text-sm">
          Actualmente no tienes un camión asignado en el sistema. Contacta al
          administrador.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Resumen del Camión */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="bg-blue-500/20 p-3 rounded-xl">
            <Truck className="w-8 h-8 text-blue-400" />
          </div>
          <div>
            <p className="text-slate-400 text-sm uppercase tracking-widest font-bold">
              Unidad Asignada
            </p>
            <h1 className="text-3xl font-black">{truck.licensePlate}</h1>
          </div>
        </div>
        <div className="bg-slate-800 px-4 py-3 rounded-xl border border-slate-700 text-right w-full sm:w-auto">
          <p className="text-slate-400 text-xs uppercase font-bold">
            Odómetro Actual
          </p>
          <p className="text-xl font-mono font-bold text-emerald-400">
            {truck.currentOdometer
              ? `${truck.currentOdometer.toLocaleString()} KM`
              : "No registrado"}
          </p>
        </div>
      </div>

      {/* Lista de Neumáticos */}
      <div>
        <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5 text-blue-600" />
          Neumáticos a Inspeccionar ({tires.length})
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tires.map((tire) => (
            <div
              key={tire.id}
              className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm flex flex-col justify-between"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-xs text-slate-400 font-bold uppercase">
                    {tire.position?.replace(/_/g, " ")}
                  </p>
                  <p className="font-black text-slate-800 text-lg">
                    {tire.serialNumber}
                  </p>
                  <p className="text-sm text-slate-500">
                    {tire.brand} {tire.model}
                  </p>
                </div>
                <div className="bg-slate-100 px-3 py-1 rounded-lg text-center">
                  <p className="text-[10px] text-slate-500 font-bold uppercase">
                    Desgaste
                  </p>
                  <p
                    className={`font-black ${tire.currentTreadDepth <= 3 ? "text-red-600" : "text-blue-600"}`}
                  >
                    {tire.currentTreadDepth} mm
                  </p>
                </div>
              </div>

              <button
                onClick={() => handleInspectClick(tire)}
                className="w-full py-2.5 bg-blue-50 text-blue-700 font-bold rounded-xl hover:bg-blue-100 transition-colors flex justify-center items-center gap-2"
              >
                <Ruler className="w-4 h-4" /> Registrar Desgaste
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Modal de Inspección */}
      {selectedTire && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in slide-in-from-bottom-10 sm:zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-lg text-slate-800">
                  Inspección de Neumático
                </h3>
                <p className="text-sm text-slate-500 font-mono">
                  {selectedTire.serialNumber} -{" "}
                  {selectedTire.position?.replace(/_/g, " ")}
                </p>
              </div>
              <button
                onClick={() => setSelectedTire(null)}
                className="text-slate-400 hover:text-slate-600 bg-slate-100 p-2 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitInspection} className="p-6 space-y-5">
              {/* Odómetro del Camión */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">
                  Kilometraje Actual del Camión
                </label>
                <input
                  type="number"
                  required
                  value={formData.odometer}
                  onChange={(e) =>
                    setFormData({ ...formData, odometer: e.target.value })
                  }
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Ej: 150000"
                />
              </div>

              {/* Milímetros de Desgaste */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">
                  Profundidad Actual (mm)
                </label>
                <input
                  type="number"
                  step="0.1"
                  required
                  max={selectedTire.currentTreadDepth} // No puede subir el milimetraje
                  value={formData.depth}
                  onChange={(e) =>
                    setFormData({ ...formData, depth: e.target.value })
                  }
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <p className="text-xs text-slate-500 mt-2">
                  Última medición registrada: {selectedTire.currentTreadDepth}mm
                </p>
              </div>

              {/* Observaciones */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">
                  Observaciones (Opcional)
                </label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none text-sm"
                  placeholder="Ej: Desgaste irregular, corte lateral..."
                />
              </div>

              {/* Botón de Guardar */}
              <button
                type="submit"
                disabled={saving}
                className="w-full py-3.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all shadow-md flex justify-center items-center gap-2 disabled:opacity-50"
              >
                {saving ? (
                  "Guardando..."
                ) : (
                  <>
                    <Save className="w-5 h-5" /> Confirmar Inspección
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
