// src/services/truckService.ts
import { db } from "@/lib/firebase/clientApp";
import {
  collection,
  getDocs,
  addDoc,
  serverTimestamp,
  doc,
  getDoc,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import { Truck } from "@/types/truck";

export const getTrucks = async (): Promise<Truck[]> => {
  try {
    const trucksRef = collection(db, "trucks");
    const snapshot = await getDocs(trucksRef);

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Truck[];
  } catch (error) {
    console.error("Error al obtener camiones:", error);
    return [];
  }
};

export const addTruck = async (data: Omit<Truck, "id" | "createdAt">) => {
  try {
    const trucksRef = collection(db, "trucks");
    await addDoc(trucksRef, {
      ...data,
      createdAt: serverTimestamp(),
    });
    return { success: true };
  } catch (error) {
    console.error("Error al registrar camión:", error);
    throw new Error("No se pudo registrar el camión.");
  }
};

export const getTruckById = async (truckId: string): Promise<Truck | null> => {
  try {
    const docRef = doc(db, "trucks", truckId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Truck;
    }
    return null;
  } catch (error) {
    console.error("Error al obtener el camión:", error);
    return null;
  }
};

// Función auxiliar para actualizar el estado o asignar un chofer
export const updateTruck = async (truckId: string, data: Partial<Truck>) => {
  try {
    const docRef = doc(db, "trucks", truckId);
    await updateDoc(docRef, data);
    return { success: true };
  } catch (error) {
    console.error("Error al actualizar camión:", error);
    throw new Error("No se pudo actualizar la información.");
  }
};

export const assignDriverToTruck = async (
  truckId: string,
  newDriverId: string,
  oldDriverId?: string | null,
) => {
  try {
    const batch = writeBatch(db);

    // 1. Actualizamos el camión
    const truckRef = doc(db, "trucks", truckId);
    batch.update(truckRef, { assignedDriverId: newDriverId });

    // 2. Actualizamos el perfil del nuevo chofer
    const newDriverRef = doc(db, "users", newDriverId);
    batch.update(newDriverRef, { truckId: truckId });

    // 3. Si había un chofer anterior, le quitamos el camión
    if (oldDriverId) {
      const oldDriverRef = doc(db, "users", oldDriverId);
      batch.update(oldDriverRef, { truckId: null });
    }

    await batch.commit(); // Ejecutamos todo al mismo tiempo
    return { success: true };
  } catch (error) {
    console.error("Error en la asignación de chofer:", error);
    throw new Error("No se pudo completar la asignación.");
  }
};
