// src/app/admin/seed/page.tsx
"use client";
import React, { useState } from "react";
import { db } from "@/lib/firebase/clientApp";
import { collection, doc, writeBatch } from "firebase/firestore";
import { Truck, Database, CheckCircle, AlertTriangle } from "lucide-react";
import toast from "react-hot-toast";

export default function SeedPage() {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const injectData = async () => {
    setLoading(true);
    const batch = writeBatch(db);

    try {
      // 1. CREAR EL CAMIÓN
      const truckId = "TRUCK_DEMO_8X4";
      const truckRef = doc(db, "trucks", truckId);
      batch.set(truckRef, {
        licensePlate: "W7A-899",
        brand: "VOLVO",
        model: "FMX 460",
        year: 2025,
        axleConfig: "4_EJES_12_LLANTAS", // Configuración para volquete
        status: "ACTIVE",
        currentOdometer: 107000, // Odómetro final simulado
        createdAt: new Date("2026-01-01"),
      });

      // 2. CREAR LAS 4 LLANTAS (Basado en tu PDF de BOTO)
      const tires = [
        { id: "TIRE_DEMO_1", serial: "1260415249", pos: "POS_5" },
        { id: "TIRE_DEMO_2", serial: "1260415250", pos: "POS_6" },
        { id: "TIRE_DEMO_3", serial: "1260415251", pos: "POS_7" },
        { id: "TIRE_DEMO_4", serial: "1260415252", pos: "POS_8" },
      ];

      // Curva de desgaste simulada para cada llanta (1 Montaje + 5 Inspecciones)
      // Representa el odómetro del camión y los milímetros que tenía cada llanta en ese momento
      const historyPoints = [
        {
          odo: 100000,
          date: "2026-01-01",
          t1: 16.0,
          t2: 16.0,
          t3: 16.0,
          t4: 16.0,
          type: "MOUNT",
        },
        {
          odo: 101000,
          date: "2026-01-15",
          t1: 15.0,
          t2: 14.8,
          t3: 15.1,
          t4: 14.5,
          type: "INSPECTION",
        },
        {
          odo: 102500,
          date: "2026-02-10",
          t1: 13.5,
          t2: 13.0,
          t3: 13.8,
          t4: 12.5,
          type: "INSPECTION",
        },
        {
          odo: 104000,
          date: "2026-03-05",
          t1: 11.0,
          t2: 10.5,
          t3: 11.5,
          t4: 9.8,
          type: "INSPECTION",
        },
        {
          odo: 105500,
          date: "2026-04-02",
          t1: 8.5,
          t2: 7.8,
          t3: 9.0,
          t4: 6.5,
          type: "INSPECTION",
        },
        {
          odo: 107000,
          date: "2026-05-10",
          t1: 6.0,
          t2: 5.5,
          t3: 6.5,
          t4: 4.2,
          type: "INSPECTION",
        }, // Actualidad
      ];

      for (let i = 0; i < tires.length; i++) {
        const tire = tires[i];

        // Crear la llanta en el inventario actual
        const tireRef = doc(db, "tires", tire.id);
        batch.set(tireRef, {
          serialNumber: tire.serial,
          brand: "BOTO",
          model: "GCA2",
          size: "12.00R24",
          initialTreadDepth: 16.0,
          currentTreadDepth:
            historyPoints[historyPoints.length - 1][
              `t${i + 1}` as keyof (typeof historyPoints)[0]
            ], // Último desgaste
          price: 400,
          currency: "USD",
          status: "IN_USE",
          truckId: truckId,
          position: tire.pos,
          initialOdometer: 100000,
          historicalKm: 0,
        });

        // Insertar el historial para formar la gráfica
        for (const point of historyPoints) {
          const historyRef = doc(collection(db, "tire_history"));
          batch.set(historyRef, {
            tireId: tire.id,
            truckId: truckId,
            driverId: "SISTEMA_INYECCION",
            type: point.type,
            newTreadDepth: point[`t${i + 1}` as keyof typeof point],
            currentOdometer: point.odo,
            notes:
              point.type === "MOUNT"
                ? "Montaje Inicial"
                : "Control regular en ruta",
            date: new Date(point.date),
          });
        }
      }

      await batch.commit();
      setDone(true);
      toast.success("¡Datos inyectados con éxito!");
    } catch (error) {
      console.error(error);
      toast.error("Hubo un error inyectando los datos");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-8 mt-10 bg-white rounded-3xl border border-slate-200 shadow-xl text-center">
      <div className="bg-blue-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
        <Database className="w-10 h-10 text-blue-600" />
      </div>
      <h1 className="text-3xl font-black text-slate-800 mb-4">
        Inyector de Datos de Prueba
      </h1>
      <p className="text-slate-600 mb-8 font-medium">
        Este botón creará automáticamente un camión <strong>VOLVO FMX</strong>{" "}
        con la placa <strong>W7A-899</strong>. Le asignará 4 llantas BOTO y
        generará un historial de 6 meses de desgaste para que puedas visualizar
        la curva de vida y exportar los PDFs.
      </p>

      {done ? (
        <div className="bg-emerald-50 text-emerald-700 p-6 rounded-2xl flex flex-col items-center gap-3">
          <CheckCircle className="w-12 h-12" />
          <h2 className="text-xl font-black">¡Datos Generados!</h2>
          <p className="font-bold">
            Ve a la sección de "Unidades" y busca la placa W7A-899.
          </p>
        </div>
      ) : (
        <button
          onClick={injectData}
          disabled={loading}
          className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-lg hover:bg-slate-800 transition-all flex items-center justify-center gap-3 w-full shadow-lg shadow-slate-900/20 disabled:opacity-50"
        >
          {loading ? (
            "Generando datos masivos..."
          ) : (
            <>
              <Truck /> Inyectar Datos Realistas
            </>
          )}
        </button>
      )}

      <div className="mt-8 flex items-center justify-center gap-2 text-xs font-bold text-amber-600 bg-amber-50 p-4 rounded-xl">
        <AlertTriangle className="w-5 h-5" />
        Solo presiona el botón una vez para evitar duplicar el historial de las
        gráficas.
      </div>
    </div>
  );
}
