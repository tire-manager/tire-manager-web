// src/services/dashboardService.ts
import { db } from "@/lib/firebase/clientApp";
import {
  collection,
  query,
  where,
  getCountFromServer,
  getDocs,
  limit,
  orderBy,
} from "firebase/firestore";
import { Tire } from "@/types/tire";

export const getDashboardMetrics = async () => {
  const tiresRef = collection(db, "tires");
  const trucksRef = collection(db, "trucks");

  try {
    // 1. ESCALABILIDAD EXTREMA: Usamos getCountFromServer
    // Esto no descarga los documentos, solo pide el número exacto a Firebase.
    const activeTrucksP = getCountFromServer(
      query(trucksRef, where("status", "==", "ACTIVE")),
    );
    const maintenanceTrucksP = getCountFromServer(
      query(trucksRef, where("status", "==", "IN_MAINTENANCE")),
    );
    const totalTrucksP = getCountFromServer(trucksRef);

    const inUseTiresP = getCountFromServer(
      query(tiresRef, where("status", "==", "IN_USE")),
    );
    const availableTiresP = getCountFromServer(
      query(tiresRef, where("status", "==", "AVAILABLE")),
    );
    const discardedTiresP = getCountFromServer(
      query(tiresRef, where("status", "==", "DISCARDED")),
    );
    const totalTiresP = getCountFromServer(tiresRef);

    // 2. LLANTAS CRÍTICAS (Paginación Limitada)
    // En vez de traer TODA la base, solo traemos las 5 llantas con más desgaste urgente
    const criticalQuery = query(
      tiresRef,
      where("status", "==", "IN_USE"),
      where("currentTreadDepth", "<=", 4),
      orderBy("currentTreadDepth", "asc"), // Las peores primero
      limit(5),
    );
    const criticalDocsP = getDocs(criticalQuery);

    // 3. FINANZAS MULTIMONEDA
    // Obtenemos las llantas para separar precios en Dólares y Soles
    const allTiresDocsP = getDocs(tiresRef);

    // Ejecutamos todas las consultas al mismo tiempo en paralelo (Súper rápido)
    const [
      activeTrucks,
      maintenanceTrucks,
      totalTrucks,
      inUseTires,
      availableTires,
      discardedTires,
      totalTires,
      criticalDocs,
      allTiresDocs,
    ] = await Promise.all([
      activeTrucksP,
      maintenanceTrucksP,
      totalTrucksP,
      inUseTiresP,
      availableTiresP,
      discardedTiresP,
      totalTiresP,
      criticalDocsP,
      allTiresDocsP,
    ]);

    const criticalTires = criticalDocs.docs.map(
      (d) => ({ id: d.id, ...d.data() }) as Tire,
    );

    // LÓGICA DE MONEDAS: Separamos las bolsas de dinero
    let totalPEN = 0;
    let totalUSD = 0;

    allTiresDocs.docs.forEach((doc) => {
      const data = doc.data();
      const price = data.price || 0;
      const currency = data.currency || "PEN"; // Si no tiene, asumimos Soles por defecto

      if (currency === "USD") {
        totalUSD += price;
      } else {
        totalPEN += price;
      }
    });

    return {
      trucks: {
        active: activeTrucks.data().count,
        maintenance: maintenanceTrucks.data().count,
        total: totalTrucks.data().count,
      },
      tires: {
        inUse: inUseTires.data().count,
        available: availableTires.data().count,
        discarded: discardedTires.data().count,
        total: totalTires.data().count,
      },
      criticalTires,
      financials: { totalPEN, totalUSD },
    };
  } catch (error) {
    console.error("Error obteniendo métricas del dashboard:", error);
    throw error;
  }
};
