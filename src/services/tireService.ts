// src/services/tireService.ts
import { db } from "@/lib/firebase/clientApp";
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  serverTimestamp,
  getDocs,
  query,
  where,
  orderBy,
  getDoc,
  writeBatch,
} from "firebase/firestore";
import { Tire } from "@/types/tire";

// --- FUNCIÓN INTERNA DE APOYO ---
const addTireHistoryEvent = async (event: any) => {
  await addDoc(collection(db, "tire_history"), {
    ...event,
    date: serverTimestamp(),
  });
};

// --- SERVICIOS DE INSPECCIÓN ---

export const registerInspection = async (inspectionData: any) => {
  try {
    // 1. Actualiza el desgaste actual en la llanta
    const tireRef = doc(db, "tires", inspectionData.tireId);
    await updateDoc(tireRef, {
      currentTreadDepth: inspectionData.newTreadDepth,
      lastInspectionDate: serverTimestamp(),
    });

    // 2. Guarda en historial único con tipo INSPECTION
    await addTireHistoryEvent({
      ...inspectionData,
      type: "INSPECTION",
    });

    // 3. Opcional: Si viene con truckId, actualizar el odómetro del camión
    if (inspectionData.truckId && inspectionData.truckId !== "DESMONTADO") {
      await updateDoc(doc(db, "trucks", inspectionData.truckId), {
        currentOdometer: inspectionData.currentOdometer,
      });
    }

    return { success: true };
  } catch (error) {
    console.error("Error al registrar inspección:", error);
    throw error;
  }
};

export const recordMassInspection = async (
  truckId: string,
  driverId: string,
  currentOdometer: number,
  inspections: {
    tireId: string;
    newTreadDepth: number;
    notes: string;
  }[],
) => {
  try {
    const batch = writeBatch(db);

    // 1. Actualizar el odómetro del camión
    batch.update(doc(db, "trucks", truckId), { currentOdometer });

    // 2. Procesar cada llanta e insertar en TIRE_HISTORY
    for (const insp of inspections) {
      const tireRef = doc(db, "tires", insp.tireId);
      batch.update(tireRef, {
        currentTreadDepth: insp.newTreadDepth,
        lastInspectionDate: serverTimestamp(),
      });

      // Nota: addDoc no funciona en batches, usamos doc(collection) y batch.set
      const newHistoryRef = doc(collection(db, "tire_history"));
      batch.set(newHistoryRef, {
        tireId: insp.tireId,
        truckId,
        driverId,
        newTreadDepth: insp.newTreadDepth,
        currentOdometer,
        notes: insp.notes,
        type: "INSPECTION",
        date: serverTimestamp(),
      });
    }

    await batch.commit();
    return { success: true };
  } catch (error) {
    console.error("Error en inspección masiva:", error);
    throw error;
  }
};

// --- SERVICIOS DE INVENTARIO Y MOVIMIENTOS ---

export const getInventory = async (): Promise<Tire[]> => {
  const snapshot = await getDocs(collection(db, "tires"));
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as Tire[];
};

export const addTire = async (data: any) => {
  const docRef = await addDoc(collection(db, "tires"), {
    ...data,
    status: "AVAILABLE",
    createdAt: serverTimestamp(),
  });
  return { success: true, id: docRef.id };
};

export const assignTireToTruck = async (
  tireId: string,
  truckId: string,
  position: string,
  initialOdometer: number,
) => {
  const tireRef = doc(db, "tires", tireId);
  await updateDoc(tireRef, {
    truckId,
    position,
    status: "IN_USE",
    initialOdometer,
  });

  // Registrar el montaje en el historial
  await addTireHistoryEvent({
    tireId,
    truckId,
    driverId: "ADMIN",
    newTreadDepth: (await getTireById(tireId))?.currentTreadDepth || 0,
    currentOdometer: initialOdometer,
    notes: "Montaje inicial en unidad",
    type: "MOUNT",
  });

  return { success: true };
};

export const unmountTire = async (
  tireId: string,
  warehouseId: string,
  userId: string,
  odo: number,
  depth: number,
  reason: string,
) => {
  const tireRef = doc(db, "tires", tireId);
  await updateDoc(tireRef, {
    status: "AVAILABLE",
    truckId: null,
    position: null,
    warehouseId: warehouseId,
    currentTreadDepth: depth,
  });

  await addTireHistoryEvent({
    tireId,
    truckId: "DESMONTADO",
    driverId: userId,
    newTreadDepth: depth,
    currentOdometer: odo,
    notes: reason,
    type: "UNMOUNT",
  });
};

// --- CONSULTAS DE HISTORIAL ---

export const getTireHistory = async (tireId: string) => {
  try {
    // CAMBIO CLAVE: Ahora consulta tire_history para ver todo (inspecciones y desmontajes)
    const q = query(
      collection(db, "tire_history"),
      where("tireId", "==", tireId),
      orderBy("date", "desc"),
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      date: doc.data().date?.toDate(),
    }));
  } catch (error) {
    console.error("Error al obtener historial unificado:", error);
    return [];
  }
};

export const getTireById = async (tireId: string): Promise<Tire | null> => {
  const docSnap = await getDoc(doc(db, "tires", tireId));
  return docSnap.exists()
    ? ({ id: docSnap.id, ...docSnap.data() } as Tire)
    : null;
};

export const updateTire = async (id: string, data: Partial<Tire>) => {
  try {
    const tireRef = doc(db, "tires", id);
    await updateDoc(tireRef, data);
    return { success: true };
  } catch (error) {
    console.error("Error al actualizar neumático:", error);
    throw new Error("No se pudo actualizar la información del neumático.");
  }
};

export const updateTireStatus = async (id: string, status: Tire["status"]) => {
  try {
    const tireRef = doc(db, "tires", id);
    await updateDoc(tireRef, { status });
    return { success: true };
  } catch (error) {
    console.error("Error al actualizar estado del neumático:", error);
    throw new Error("No se pudo actualizar el estado operativo.");
  }
};

export const getTiresByTruckId = async (truckId: string): Promise<Tire[]> => {
  try {
    const tiresRef = collection(db, "tires");
    // Buscamos llantas que tengan asignado este truckId y estén en uso
    const q = query(
      tiresRef,
      where("truckId", "==", truckId),
      where("status", "==", "IN_USE"),
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Tire[];
  } catch (error) {
    console.error(`Error al obtener neumáticos del camión ${truckId}:`, error);
    return [];
  }
};

// src/services/tireService.ts

export const getTireAdvancedStats = (tire: any, history: any[]) => {
  let totalKm = 0;
  let mountOdo = 0;
  let highestOdoInCycle = 0;
  let isMounted = false;
  let firstMountDate: Date | null = null;

  const ascHistory = [...history].reverse();

  for (const event of ascHistory) {
    if (event.type === "MOUNT") {
      const currentOdo = event.currentOdometer || 0;
      mountOdo = currentOdo;
      highestOdoInCycle = currentOdo;
      isMounted = true;
      if (!firstMountDate && event.date) firstMountDate = event.date;
    } else if (event.type === "UNMOUNT") {
      if (isMounted) {
        const odo = event.currentOdometer || highestOdoInCycle;
        if (odo > mountOdo) totalKm += odo - mountOdo;
      }
      isMounted = false;
    } else if (event.type === "INSPECTION") {
      if (isMounted) {
        highestOdoInCycle = Math.max(
          highestOdoInCycle,
          event.currentOdometer || 0,
        );
      }
    }
  }

  if (isMounted && highestOdoInCycle > mountOdo)
    totalKm += highestOdoInCycle - mountOdo;

  // --- 2. Variables de Desgaste ---
  const mmGastados = tire.initialTreadDepth - tire.currentTreadDepth;
  const LIMIT_MM = 4;
  const price = tire.price || 0;

  // --- 3. PASO 3: PROYECCIÓN POR CALENDARIO ---
  let avgKmPerDay = 0;
  let estimatedChangeDate: Date | null = null;

  if (firstMountDate && totalKm > 0) {
    const hoy = new Date();
    const diasEnOperacion = Math.max(
      1,
      Math.floor(
        (hoy.getTime() - firstMountDate.getTime()) / (1000 * 60 * 60 * 24),
      ),
    );
    avgKmPerDay = totalKm / diasEnOperacion;
  }

  const wearRate = totalKm > 0 ? (mmGastados / totalKm) * 1000 : 0;
  let projectedKm = 0;

  if (mmGastados > 0 && totalKm > 0) {
    const kmPerMm = totalKm / mmGastados;
    projectedKm = Math.max(0, (tire.currentTreadDepth - LIMIT_MM) * kmPerMm);

    if (avgKmPerDay > 0) {
      const diasRestantes = projectedKm / avgKmPerDay;
      estimatedChangeDate = new Date();
      estimatedChangeDate.setDate(
        estimatedChangeDate.getDate() + diasRestantes,
      );
    }
  }

  return {
    totalKm,
    cpk: price > 0 && totalKm > 0 ? price / totalKm : 0,
    wearRate,
    projectedKm: Math.round(projectedKm),
    residualValue:
      tire.initialTreadDepth > LIMIT_MM
        ? price *
          (Math.max(0, tire.currentTreadDepth - LIMIT_MM) /
            (tire.initialTreadDepth - LIMIT_MM))
        : 0,
    avgKmPerDay: Math.round(avgKmPerDay),
    estimatedChangeDate,
    limitMm: LIMIT_MM,
    // ¡AQUÍ ESTÁ LA LÍNEA QUE FALTABA!
    isRetreadable: tire.currentTreadDepth >= LIMIT_MM,
  };
};
