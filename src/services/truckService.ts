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
  limit,
  orderBy,
  query,
  startAfter,
  where,
  getCountFromServer,
} from "firebase/firestore";
import { Truck } from "@/types/truck";

export const getTrucks = async (companyId: string): Promise<Truck[]> => {
  try {
    // FILTRO SAAS
    const q = query(
      collection(db, "trucks"),
      where("companyId", "==", companyId),
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Truck[];
  } catch (error) {
    return [];
  }
};

export const addTruck = async (data: Omit<Truck, "id" | "createdAt">) => {
  try {
    const trucksRef = collection(db, "trucks");

    // Guardamos la referencia al documento recién creado
    const docRef = await addDoc(trucksRef, {
      ...data,
      createdAt: serverTimestamp(),
    });

    // ¡ESTA ES LA CLAVE! Devolvemos el ID generado por Firebase
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error("Error al añadir camión:", error);
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
  newDriverId: string | null,
  oldDriverId: string | null = null,
) => {
  try {
    const batch = writeBatch(db);

    // 1. Actualizamos el documento del camión
    const truckRef = doc(db, "trucks", truckId);
    batch.update(truckRef, { assignedDriverId: newDriverId });

    // 2. Si hay un chofer nuevo, le asignamos este camión en su perfil
    if (newDriverId) {
      const newDriverRef = doc(db, "users", newDriverId);
      batch.update(newDriverRef, { truckId: truckId });
    }

    // 3. Si había un chofer anterior, lo liberamos quitándole el camión
    if (oldDriverId && oldDriverId !== newDriverId) {
      const oldDriverRef = doc(db, "users", oldDriverId);
      batch.update(oldDriverRef, { truckId: null });
    }

    // Ejecutamos todos los cambios al mismo tiempo
    await batch.commit();
    return { success: true };
  } catch (error) {
    console.error("Error al sincronizar asignación de chofer:", error);
    throw new Error("No se pudo asignar el chofer.");
  }
};

export const getPaginatedTrucks = async (
  companyId: string, // <-- NUEVO PARÁMETRO
  pageSize: number,
  lastVisible?: any,
  statusFilter?: string,
  searchTerm?: string,
) => {
  try {
    let constraints: any[] = [where("companyId", "==", companyId)];
    // Filtro por estado
    if (statusFilter && statusFilter !== "ALL") {
      constraints.push(where("status", "==", statusFilter));
    }

    // Búsqueda nativa en Firebase por Placa (Búsqueda por prefijo)
    if (searchTerm) {
      const searchUpper = searchTerm.toUpperCase();
      constraints.push(where("licensePlate", ">=", searchUpper));
      constraints.push(where("licensePlate", "<=", searchUpper + "\uf8ff"));
      constraints.push(orderBy("licensePlate", "asc"));
    } else {
      // Ordenamiento por defecto
      constraints.push(orderBy("licensePlate", "asc"));
    }

    if (lastVisible) {
      constraints.push(startAfter(lastVisible));
    }

    constraints.push(limit(pageSize));

    const q = query(collection(db, "trucks"), ...constraints);
    const snapshot = await getDocs(q);

    const trucks = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Truck[];

    return {
      trucks,
      lastVisible:
        snapshot.docs.length > 0
          ? snapshot.docs[snapshot.docs.length - 1]
          : null,
    };
  } catch (error) {
    console.error("Error al obtener camiones paginados:", error);
    throw error;
  }
};

export const addTruckWithPlanValidation = async (
  truckData: any,
  companyId: string,
) => {
  try {
    // 1. Obtener los límites de la empresa
    const companySnap = await getDoc(doc(db, "companies", companyId));
    if (!companySnap.exists()) throw new Error("Empresa no registrada.");
    const company = companySnap.data();

    // 2. Contar cuántos camiones ya tiene registrados esa empresa en el servidor (Escalable)
    const q = query(
      collection(db, "trucks"),
      where("companyId", "==", companyId),
    );
    const countSnapshot = await getCountFromServer(q);
    const currentTrucksCount = countSnapshot.data().count;

    // 3. Validar límite estricto
    if (currentTrucksCount >= company.limits.maxTrucks) {
      throw new Error(
        `Has alcanzado el límite de tu Plan ${company.plan} (${company.limits.maxTrucks} camiones). Contáctanos para actualizar tu plan.`,
      );
    }

    // 4. Si pasa la validación, se guarda el documento
    const docRef = await addDoc(collection(db, "trucks"), {
      ...truckData,
      companyId,
      createdAt: serverTimestamp(),
    });

    return { success: true, id: docRef.id };
  } catch (error: any) {
    console.error("Error al añadir camión con validación:", error);
    throw error;
  }
};
