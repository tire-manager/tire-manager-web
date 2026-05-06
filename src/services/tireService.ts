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
import { Tire, TireStatus } from "@/types/tire";

export const recordInspection = async (
  tireId: string,
  truckId: string,
  driverId: string,
  newTreadDepth: number,
  currentOdometer: number, // NUEVO PARÁMETRO
  notes: string,
) => {
  try {
    // 1. Guardar el registro de inspección en el historial
    await addDoc(collection(db, "inspections"), {
      tireId,
      truckId,
      driverId,
      newTreadDepth,
      currentOdometer, // Guardamos el KM en el que se hizo la inspección
      notes,
      date: serverTimestamp(),
    });

    // 2. Actualizar el estado actual del neumático
    await updateDoc(doc(db, "tires", tireId), {
      currentTreadDepth: newTreadDepth,
      lastInspectionDate: serverTimestamp(),
    });

    // 3. Actualizar el kilometraje global del camión
    await updateDoc(doc(db, "trucks", truckId), {
      currentOdometer: currentOdometer,
    });

    return { success: true };
  } catch (error) {
    console.error("Error al registrar la inspección:", error);
    throw new Error("No se pudo guardar la inspección");
  }
};

export const recordMassInspection = async (
  truckId: string,
  driverId: string,
  currentOdometer: number,
  inspections: {
    tireId: string;
    newTreadDepth: number;
    condition: string;
    notes: string;
  }[],
) => {
  try {
    const batch = writeBatch(db);

    // 1. Actualizar el odómetro del camión
    const truckRef = doc(db, "trucks", truckId);
    batch.update(truckRef, { currentOdometer });

    // 2. Procesar cada llanta inspeccionada
    inspections.forEach((insp) => {
      // Actualizar la llanta
      const tireRef = doc(db, "tires", insp.tireId);
      batch.update(tireRef, {
        currentTreadDepth: insp.newTreadDepth,
        lastInspectionDate: serverTimestamp(),
      });

      // Crear el registro de inspección en el historial
      const newInspectionRef = doc(collection(db, "inspections"));
      batch.set(newInspectionRef, {
        tireId: insp.tireId,
        truckId,
        driverId,
        newTreadDepth: insp.newTreadDepth,
        condition: insp.condition, // "NORMAL" o "ANORMAL"
        currentOdometer,
        notes: insp.notes,
        date: serverTimestamp(),
      });
    });

    // Ejecutar todo de una sola vez
    await batch.commit();
    return { success: true };
  } catch (error) {
    console.error("Error en inspección masiva:", error);
    throw new Error("No se pudo guardar la inspección masiva");
  }
};

export const getInventory = async (): Promise<Tire[]> => {
  try {
    const tiresRef = collection(db, "tires");
    const snapshot = await getDocs(tiresRef);

    const tiresList: Tire[] = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Tire[];

    return tiresList;
  } catch (error) {
    console.error("Error al obtener el inventario:", error);
    return [];
  }
};

export const addTire = async (data: {
  serialNumber: string;
  brand: string;
  model: string;
  size: string;
  initialTreadDepth: number;
  currentTreadDepth: number;
  price: number;
  currency: "PEN" | "USD";
  warehouseId: string; // <-- 👇 ¡AQUÍ ESTÁ LA CORRECCIÓN!
}) => {
  try {
    const docRef = await addDoc(collection(db, "tires"), {
      ...data,
      status: "AVAILABLE",
      createdAt: serverTimestamp(),
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error("Error al añadir neumático:", error);
    throw new Error("No se pudo registrar el neumático.");
  }
};

export const getTiresByTruckId = async (truckId: string): Promise<Tire[]> => {
  try {
    const tiresRef = collection(db, "tires");
    const q = query(tiresRef, where("truckId", "==", truckId));
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

export const getAvailableTires = async (): Promise<Tire[]> => {
  try {
    const tiresRef = collection(db, "tires");
    const q = query(tiresRef, where("status", "==", "AVAILABLE"));
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Tire[];
  } catch (error) {
    console.error("Error al obtener neumáticos disponibles:", error);
    return [];
  }
};

export const assignTireToTruck = async (
  tireId: string,
  truckId: string,
  position: string,
  initialOdometer: number, // <-- Este dato nuevo
) => {
  try {
    const tireRef = doc(db, "tires", tireId);
    await updateDoc(tireRef, {
      truckId: truckId,
      position: position,
      status: "IN_USE",
      initialOdometer: initialOdometer, // <-- Se guarda aquí
    });
    return { success: true };
  } catch (error) {
    console.error("Error al asignar neumático:", error);
    throw new Error("No se pudo asignar el neumático.");
  }
};

export const getTireById = async (tireId: string): Promise<Tire | null> => {
  try {
    const docRef = doc(db, "tires", tireId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Tire;
    } else {
      console.warn(`No se encontró el neumático con ID: ${tireId}`);
      return null;
    }
  } catch (error) {
    console.error("Error al obtener el neumático por ID:", error);
    return null;
  }
};

export const getTireHistory = async (tireId: string) => {
  try {
    const historyRef = collection(db, "inspections");
    // Buscamos todas las inspecciones de este neumático ordenadas por fecha
    const q = query(
      historyRef,
      where("tireId", "==", tireId),
      orderBy("date", "desc"),
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      // Convertimos el timestamp de Firebase a objeto Date de JS
      date: doc.data().date?.toDate(),
    }));
  } catch (error) {
    console.error("Error al obtener el historial:", error);
    return [];
  }
};

// src/services/tireService.ts
export const unmountTire = async (
  tireId: string,
  warehouseId: string,
  userId: string,
  currentOdometer: number,
  currentTreadDepth: number,
  notes: string,
) => {
  try {
    const tireRef = doc(db, "tires", tireId);

    // 1. Actualizamos la llanta
    await updateDoc(tireRef, {
      status: "AVAILABLE",
      truckId: null,
      position: null,
      warehouseId: warehouseId,
      currentTreadDepth: currentTreadDepth,
    });

    // 2. Guardamos el historial del desmontaje
    await addDoc(collection(db, "tire_history"), {
      tireId,
      truckId: "DESMONTADO",
      driverId: userId,
      date: serverTimestamp(),
      newTreadDepth: currentTreadDepth,
      currentOdometer: currentOdometer,
      notes: notes,
      type: "UNMOUNT",
    });

    return { success: true };
  } catch (error) {
    console.error("Error al desmontar llanta:", error);
    throw new Error("No se pudo registrar el desmontaje.");
  }
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
    throw new Error("No se pudo dar de baja el neumático.");
  }
};
