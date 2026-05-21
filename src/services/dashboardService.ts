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

export const getDashboardMetrics = async (companyId: string) => {
  const tiresRef = collection(db, "tires");
  const trucksRef = collection(db, "trucks");

  try {
    // 1. FILTRO SAAS APLICADO A TODOS LOS CONTADORES
    const activeTrucksP = getCountFromServer(
      query(
        trucksRef,
        where("companyId", "==", companyId),
        where("status", "==", "ACTIVE"),
      ),
    );
    const maintenanceTrucksP = getCountFromServer(
      query(
        trucksRef,
        where("companyId", "==", companyId),
        where("status", "==", "IN_MAINTENANCE"),
      ),
    );
    const totalTrucksP = getCountFromServer(
      query(trucksRef, where("companyId", "==", companyId)),
    );

    const inUseTiresP = getCountFromServer(
      query(
        tiresRef,
        where("companyId", "==", companyId),
        where("status", "==", "IN_USE"),
      ),
    );
    const availableTiresP = getCountFromServer(
      query(
        tiresRef,
        where("companyId", "==", companyId),
        where("status", "==", "AVAILABLE"),
      ),
    );
    const discardedTiresP = getCountFromServer(
      query(
        tiresRef,
        where("companyId", "==", companyId),
        where("status", "==", "DISCARDED"),
      ),
    );
    const totalTiresP = getCountFromServer(
      query(tiresRef, where("companyId", "==", companyId)),
    );

    // 2. LLANTAS CRÍTICAS (Aisladas por empresa)
    const criticalQuery = query(
      tiresRef,
      where("companyId", "==", companyId),
      where("status", "==", "IN_USE"),
      where("currentTreadDepth", "<=", 4),
      orderBy("currentTreadDepth", "asc"),
      limit(5),
    );
    const criticalDocsP = getDocs(criticalQuery);

    // 3. FINANZAS (Solo facturación de esta empresa)
    const allTiresDocsP = getDocs(
      query(tiresRef, where("companyId", "==", companyId)),
    );

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

    let totalPEN = 0;
    let totalUSD = 0;

    allTiresDocs.docs.forEach((doc) => {
      const data = doc.data();
      const price = data.price || 0;
      const currency = data.currency || "PEN";
      if (currency === "USD") totalUSD += price;
      else totalPEN += price;
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
