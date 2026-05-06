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
