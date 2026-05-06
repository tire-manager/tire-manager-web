// src/services/warehouseService.ts
import { db } from "@/lib/firebase/clientApp";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
  query,
  orderBy,
} from "firebase/firestore";

export interface Warehouse {
  id: string;
  name: string;
  location: string;
  status: "ACTIVE" | "INACTIVE";
  createdAt?: any;
}

export const getWarehouses = async (): Promise<Warehouse[]> => {
  try {
    const q = query(collection(db, "warehouses"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Warehouse[];
  } catch (error) {
    console.error("Error al obtener almacenes:", error);
    return [];
  }
};

export const addWarehouse = async (
  data: Omit<Warehouse, "id" | "createdAt">,
) => {
  try {
    const docRef = await addDoc(collection(db, "warehouses"), {
      ...data,
      createdAt: serverTimestamp(),
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error("Error al añadir almacén:", error);
    throw new Error("No se pudo registrar el almacén.");
  }
};

export const updateWarehouse = async (id: string, data: Partial<Warehouse>) => {
  try {
    const docRef = doc(db, "warehouses", id);
    await updateDoc(docRef, data);
    return { success: true };
  } catch (error) {
    console.error("Error al actualizar almacén:", error);
    throw new Error("No se pudo actualizar el almacén.");
  }
};
