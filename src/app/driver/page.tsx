"use client";
import React, { useState, useEffect } from "react";
import { auth, db } from "@/lib/firebase/clientApp";
import { doc, getDoc } from "firebase/firestore";
import { Truck, Gauge, Save, LogOut, Loader2 } from "lucide-react";
import {
  getTiresByTruckId,
  recordMassInspection,
} from "@/services/tireService";
import { Tire } from "@/types/tire";
import TruckVisualizer from "@/components/trucks/TruckVisualizer";
import toast from "react-hot-toast";
import { onAuthStateChanged, signOut } from "firebase/auth";

export default function DriverInspectionPage() {
  const [user, setUser] = useState<any>(null);
  const [licensePlate, setLicensePlate] = useState<string | null>(null); // Guardamos la PLACA, no el ID
  const [truckId, setTruckId] = useState<string | null>(null); // Mantenemos el ID para las consultas
  const [truckInfo, setTruckInfo] = useState<any>(null);
  const [odometer, setOdometer] = useState<number>(0);
  const [tires, setTires] = useState<Tire[]>([]);
  const [inspections, setInspections] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        try {
          // 1. Obtener datos del usuario
          const userDoc = await getDoc(doc(db, "users", currentUser.uid));

          if (userDoc.exists()) {
            const userData = userDoc.data();
            const assignedTruckId = userData.truckId; // Este es el ID técnico

            if (assignedTruckId) {
              setTruckId(assignedTruckId);

              // 2. Cargar llantas y datos del camión (Placa y Odómetro)
              const [tiresData, truckDoc] = await Promise.all([
                getTiresByTruckId(assignedTruckId),
                getDoc(doc(db, "trucks", assignedTruckId)),
              ]);

              setTires(tiresData);

              if (truckDoc.exists()) {
                const tData = truckDoc.data();
                setTruckInfo(tData);
                setLicensePlate(tData.licensePlate); // <-- OBTENEMOS LA PLACA REAL
                setOdometer(tData.currentOdometer || 0);
              }
            } else {
              toast.error("No tienes una unidad asignada.");
            }
          }
        } catch (error) {
          console.error("Error cargando contexto:", error);
          toast.error("Error al sincronizar datos");
        }
      } else {
        window.location.href = "/login";
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleTireClick = (pos: number, tire?: Tire) => {
    if (!tire) return;
    const val = prompt(
      `Medición para Posición ${pos} (${tire.serialNumber}):`,
      inspections[tire.id]?.toString() || tire.currentTreadDepth.toString(),
    );

    if (val !== null && !isNaN(parseFloat(val))) {
      setInspections((prev) => ({ ...prev, [tire.id]: parseFloat(val) }));
    }
  };

  const handleSaveAll = async () => {
    if (!truckId || !user) return;
    if (odometer <= (truckInfo?.currentOdometer || 0)) {
      return toast.error("El nuevo kilometraje debe ser mayor al actual");
    }

    if (Object.keys(inspections).length === 0) {
      return toast.error("Debes registrar al menos una medición");
    }

    setSaving(true);
    const payload = Object.entries(inspections).map(([id, depth]) => ({
      tireId: id,
      newTreadDepth: depth,
      notes: "Inspección de rutina - Chofer",
    }));

    try {
      await recordMassInspection(truckId, user.uid, odometer, payload);
      toast.success("¡Inspección guardada exitosamente!");
      setInspections({});
      // Actualizamos el truckInfo local para que la validación del odómetro sea correcta en la siguiente inspección
      setTruckInfo({ ...truckInfo, currentOdometer: odometer });
    } catch (e) {
      toast.error("Error al guardar los datos");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      // 1. Cerramos sesión en Firebase
      await signOut(auth);

      // 2. Limpiamos las cookies configurando una fecha de expiración pasada
      document.cookie =
        "firebaseToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; SameSite=Strict";
      document.cookie =
        "userRole=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; SameSite=Strict";

      // 3. Redirigimos manualmente al login para asegurar una limpieza total
      window.location.href = "/login";
    } catch (error) {
      toast.error("Error al cerrar sesión");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col pb-28">
      {/* CABECERA DINÁMICA */}
      <div className="bg-blue-600 p-6 text-white flex justify-between items-center shadow-lg sticky top-0 z-20">
        <div>
          <h1 className="text-xl font-black flex items-center gap-2">
            <Truck className="w-5 h-5" />
            {licensePlate || "Mi Camión"}
          </h1>
          <p className="text-[10px] font-bold opacity-80 uppercase tracking-widest">
            {user?.displayName || "Operador"}
          </p>
        </div>
        <button
          onClick={handleLogout}
          className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>

      <div className="p-4 space-y-6 max-w-md mx-auto w-full">
        {/* RESUMEN DE UNIDAD */}
        <div className="bg-slate-900 p-6 rounded-[2.5rem] shadow-2xl text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Truck className="w-20 h-20 text-white" />
          </div>
          <p className="text-blue-400 text-[10px] font-black uppercase tracking-[0.2em] mb-1">
            Placa de Unidad
          </p>
          <h2 className="text-5xl font-black text-white tracking-tighter">
            {licensePlate || "---"}
          </h2>
        </div>

        {/* REGISTRO DE KILOMETRAJE */}
        <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-4">
            <Gauge className="w-4 h-4 text-blue-500" /> Odómetro Actual
          </label>
          <div className="relative">
            <input
              type="number"
              value={odometer}
              onChange={(e) => setOdometer(parseInt(e.target.value) || 0)}
              className="w-full text-5xl font-mono font-black text-center py-5 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-blue-500 focus:bg-white transition-all text-slate-800"
            />
            <span className="absolute right-4 bottom-4 text-xs font-black text-slate-300 tracking-widest">
              KM
            </span>
          </div>
          <p className="text-[10px] text-center text-slate-400 mt-3 font-bold uppercase">
            Kilometraje anterior:{" "}
            {truckInfo?.currentOdometer?.toLocaleString() || 0} KM
          </p>
        </div>

        {/* ESQUEMA OPERATIVO INTERACTIVO */}
        <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm text-center">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-8">
            Selecciona Llanta para Medir
          </h3>

          <div className="flex justify-center py-4 overflow-hidden">
            <div className="scale-[1.15] origin-center">
              <TruckVisualizer
                layoutType={truckInfo?.axleConfig || "3_EJES_10_LLANTAS"}
                assignedTires={tires}
                onTireClick={handleTireClick}
              />
            </div>
          </div>

          {/* LISTADO DE CAPTURAS REALIZADAS */}
          <div className="mt-8 grid grid-cols-2 gap-2">
            {tires.map((t) => {
              const hasCapture = inspections[t.id];
              return (
                <div
                  key={t.id}
                  className={`px-3 py-2 rounded-xl text-[10px] font-black border transition-all ${
                    hasCapture
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-slate-50 text-slate-400 border-slate-100"
                  }`}
                >
                  <div className="opacity-60 mb-0.5">{t.position}</div>
                  <div>{hasCapture ? `${hasCapture} mm` : "Pte."}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ACCIÓN PRINCIPAL */}
      <div className="fixed bottom-0 left-0 w-full p-6 bg-gradient-to-t from-white via-white to-transparent z-30">
        <button
          onClick={handleSaveAll}
          disabled={saving || !truckId}
          className="w-full bg-blue-600 text-white py-5 rounded-[1.5rem] font-black text-lg shadow-xl shadow-blue-600/40 flex items-center justify-center gap-3 active:scale-95 transition-all disabled:opacity-50"
        >
          {saving ? (
            <Loader2 className="w-6 h-6 animate-spin" />
          ) : (
            <>
              <Save className="w-6 h-6" />
              Enviar Inspección
            </>
          )}
        </button>
      </div>
    </div>
  );
}
