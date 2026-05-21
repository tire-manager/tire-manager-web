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
  where,
} from "firebase/firestore";

export interface Warehouse {
  id: string;
  companyId: string;
  name: string;
  location: string;
  status: "ACTIVE" | "INACTIVE";
  createdAt?: any;
}

export const getWarehouses = async (
  companyId: string,
): Promise<Warehouse[]> => {
  try {
    const q = query(
      collection(db, "warehouses"),
      where("companyId", "==", companyId),
    ); // <-- FILTRO
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Warehouse[];
  } catch (error) {
    return [];
  }
};

export const addWarehouse = async (
  data: Omit<Warehouse, "id" | "createdAt" | "companyId">,
  companyId: string,
) => {
  try {
    const docRef = await addDoc(collection(db, "warehouses"), {
      ...data,
      companyId,
      createdAt: serverTimestamp(), // <-- GUARDA LA EMPRESA
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    throw new Error("No se pudo registrar el almacén.");
  }
};

export const updateWarehouse = async (id: string, data: Partial<Warehouse>) => {
  try {
    const docRef = doc(db, "warehouses", id);
    await updateDoc(docRef, data);
    return { success: true };
  } catch (error) {
    throw new Error("No se pudo actualizar el almacén.");
  }
};
