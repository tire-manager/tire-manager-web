// src/services/reportService.ts
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase/clientApp";
import { Tire } from "@/types/tire";
import { Truck } from "@/types/truck";
import { getGlobalSettings } from "./settingsService";

export interface TireProjection {
  id: string;
  serialNumber: string;
  brand: string;
  model: string;
  projectedKm: number;
  costPerKm: number;
  currency: string;
  wearPercentage: number;
  remainingTread: number;
  statusText: string;
}

export const generateProjectionsData = async () => {
  // 1. Consultas optimizadas: Solo llantas y camiones activos
  const tiresRef = collection(db, "tires");
  const trucksRef = collection(db, "trucks");

  const inUseTiresQuery = query(tiresRef, where("status", "==", "IN_USE"));
  const activeTrucksQuery = query(
    trucksRef,
    where("status", "in", ["ACTIVE", "IN_MAINTENANCE"]),
  );

  const [tiresSnapshot, trucksSnapshot, config] = await Promise.all([
    getDocs(inUseTiresQuery),
    getDocs(activeTrucksQuery),
    getGlobalSettings(),
  ]);

  const tires = tiresSnapshot.docs.map(
    (d) => ({ id: d.id, ...d.data() }) as Tire,
  );
  const trucks = trucksSnapshot.docs.map(
    (d) => ({ id: d.id, ...d.data() }) as Truck,
  );

  const calculatedProjections: TireProjection[] = [];
  const brandModelAverages: Record<string, { totalKm: number; count: number }> =
    {};

  // 2. Procesamiento Matemático
  tires.forEach((tire) => {
    if (tire.truckId && tire.price && tire.initialOdometer) {
      const truck = trucks.find((t) => t.id === tire.truckId);

      if (
        truck &&
        truck.currentOdometer &&
        truck.currentOdometer > tire.initialOdometer
      ) {
        const originalDepth = config.defaultInitialDepth;
        const currentDepth = tire.currentTreadDepth;
        const criticalLimit = config.criticalWearLimit;

        const mmWorn = originalDepth - currentDepth;
        const kmRun = truck.currentOdometer - tire.initialOdometer;

        if (mmWorn > 0) {
          const kmPerMm = kmRun / mmWorn;
          const usefulTread = originalDepth - criticalLimit;

          const projectedKm = kmPerMm * usefulTread;
          const costPerKm = tire.price / projectedKm;
          const wearPercentage = (mmWorn / originalDepth) * 100;

          calculatedProjections.push({
            id: tire.id,
            serialNumber: tire.serialNumber,
            brand: tire.brand,
            model: tire.model,
            projectedKm: Math.round(projectedKm),
            costPerKm: Number(costPerKm.toFixed(4)),
            currency: tire.currency || "PEN",
            wearPercentage: Math.round(wearPercentage),
            remainingTread: currentDepth,
            statusText: "Ok",
          });

          const groupKey = `${tire.brand} ${tire.model}`;
          if (!brandModelAverages[groupKey]) {
            brandModelAverages[groupKey] = { totalKm: 0, count: 0 };
          }
          brandModelAverages[groupKey].totalKm += projectedKm;
          brandModelAverages[groupKey].count += 1;
        }
      }
    }
  });

  calculatedProjections.sort((a, b) => b.projectedKm - a.projectedKm);

  // 3. Formateo de datos para el gráfico
  const chartData = Object.keys(brandModelAverages)
    .map((key) => ({
      name: key,
      "KM Proyectado Promedio": Math.round(
        brandModelAverages[key].totalKm / brandModelAverages[key].count,
      ),
    }))
    .sort((a, b) => b["KM Proyectado Promedio"] - a["KM Proyectado Promedio"]);

  return { projections: calculatedProjections, chartData };
};
