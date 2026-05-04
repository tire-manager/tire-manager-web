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
} from "firebase/firestore";
import { Tire, TirePosition, TireStatus } from "@/types/tire";

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
  initialTreadDepth: number;
  price: number; // Ya lo estabas recibiendo aquí
}) => {
  try {
    const tiresRef = collection(db, "tires");
    const newTire = {
      serialNumber: data.serialNumber,
      brand: data.brand,
      model: data.model,
      currentTreadDepth: data.initialTreadDepth,
      price: data.price, // <-- ¡ESTA ES LA LÍNEA QUE FALTABA!
      status: "AVAILABLE",
      truckId: null,
      position: null,
      lastInspectionDate: serverTimestamp(),
      createdAt: serverTimestamp(),
    };

    await addDoc(tiresRef, newTire);
    return { success: true };
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

// Asegúrate de que tu función reciba y guarde el initialOdometer
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
