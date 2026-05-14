// src/services/tireService.ts
import { db, storage } from "@/lib/firebase/clientApp";
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
  limit,
  QueryDocumentSnapshot,
  startAfter,
} from "firebase/firestore";
import { Tire, TireHistory } from "@/types/tire";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

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

// src/services/tireService.ts

// En src/services/tireService.ts
// Asegúrate de tener importado 'getDoc' de firebase/firestore en la parte superior

export const unmountTire = async (
  tireId: string,
  warehouseId: string,
  userId: string, // <-- NUEVO: ID del administrador
  currentOdometer: number,
  currentTreadDepth: number,
  reason: string,
  imageUrl?: string,
) => {
  try {
    const tireRef = doc(db, "tires", tireId);
    const tireSnap = await getDoc(tireRef);

    if (!tireSnap.exists()) throw new Error("Llanta no encontrada");
    const tireData = tireSnap.data();

    // --- REGLA DE NEGOCIO: LÓGICA DE ESTADOS ---
    let finalStatus = "AVAILABLE"; // Por defecto, si se quita, va al almacén

    // Si la razón contiene las palabras clave de descarte, se da de baja
    if (
      reason.includes("Límite") ||
      reason.includes("Desgaste") ||
      reason.includes("Baja")
    ) {
      finalStatus = "DISCARDED";
    }

    // 1. Actualizamos el neumático
    await updateDoc(tireRef, {
      truckId: null,
      position: null,
      // Si es baja física, ya no debería ocupar espacio en tu "warehouseId"
      warehouseId: finalStatus === "DISCARDED" ? null : warehouseId,
      status: finalStatus,
      currentTreadDepth: currentTreadDepth,
      updatedAt: new Date(),
    });

    // 2. Guardamos la auditoría exacta en el Historial
    const historyRef = collection(db, "tire_history");
    await addDoc(historyRef, {
      tireId,
      truckId: tireData.truckId, // Guardamos de qué camión salió
      type: "UNMOUNT",
      date: new Date(),
      currentOdometer,
      newTreadDepth: currentTreadDepth,
      notes: reason,
      imageUrl: imageUrl || null,
      userId: userId || "SYSTEM", // <-- TRAZABILIDAD: Guardamos quién hizo la acción
    });
  } catch (error) {
    console.error("Error al desmontar neumático:", error);
    throw error;
  }
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

// En src/services/tireService.ts

export const updateTireStatus = async (tireId: string, newStatus: string) => {
  try {
    const tireRef = doc(db, "tires", tireId);

    // Al actualizar, forzamos que el estado en la base de datos cambie al que le pasamos (ej. "DISCARDED")
    await updateDoc(tireRef, {
      status: newStatus,
      updatedAt: new Date(),
    });
  } catch (error) {
    console.error("Error al actualizar el estado del neumático:", error);
    throw error;
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

export const uploadTirePhoto = async (
  file: File,
  tireId: string,
): Promise<string> => {
  try {
    // Creamos una ruta única: tires/ID_LLANTA/timestamp_nombre.jpg
    const fileRef = ref(storage, `tires/${tireId}/${Date.now()}_${file.name}`);
    await uploadBytes(fileRef, file);
    const downloadUrl = await getDownloadURL(fileRef);
    return downloadUrl;
  } catch (error) {
    console.error("Error al subir la foto:", error);
    throw new Error("No se pudo subir la imagen de evidencia.");
  }
};

// src/services/tireService.ts
// Asegúrate de tener estas importaciones arriba:
// import { collection, query, where, orderBy, limit, getDocs, startAfter } from "firebase/firestore";

export const getTruckInspectionHistory = async (
  truckId: string,
  pageSize: number = 50, // Subimos a 50 porque ahora agruparemos por inspección
  lastVisible?: any,
  startDate?: string,
  endDate?: string,
) => {
  try {
    // Construimos los filtros dinámicamente
    let constraints: any[] = [
      where("truckId", "==", truckId),
      orderBy("date", "desc"),
    ];

    if (startDate) {
      constraints.push(where("date", ">=", new Date(`${startDate}T00:00:00`)));
    }
    if (endDate) {
      constraints.push(where("date", "<=", new Date(`${endDate}T23:59:59`)));
    }

    if (lastVisible) {
      constraints.push(startAfter(lastVisible));
    }

    constraints.push(limit(pageSize));

    const q = query(collection(db, "tire_history"), ...constraints);
    const snapshot = await getDocs(q);

    const events = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as any[];

    return {
      events,
      lastVisible:
        snapshot.docs.length > 0
          ? snapshot.docs[snapshot.docs.length - 1]
          : null,
    };
  } catch (error) {
    console.error("Error al obtener historial:", error);
    throw error;
  }
};

// src/services/tireService.ts
// Asegúrate de importar esto arriba: import { query, where, orderBy, limit, startAfter } from "firebase/firestore";

export const getPaginatedInventory = async (
  pageSize: number,
  lastVisible?: any,
  statusFilter?: string,
  searchTerm?: string,
) => {
  try {
    let constraints: any[] = [];

    // Filtro por estado
    if (statusFilter && statusFilter !== "ALL") {
      constraints.push(where("status", "==", statusFilter));
    }

    // Búsqueda por Número de Serie (El truco de Firebase para buscar texto)
    if (searchTerm) {
      constraints.push(where("serialNumber", ">=", searchTerm));
      constraints.push(where("serialNumber", "<=", searchTerm + "\uf8ff"));
      // Firestore requiere ordenar por el mismo campo usado en operadores de desigualdad
      constraints.push(orderBy("serialNumber", "asc"));
    } else {
      // Ordenamiento por defecto si no hay búsqueda
      constraints.push(orderBy("createdAt", "desc")); // Asegúrate de que tus llantas tengan un campo createdAt
    }

    if (lastVisible) {
      constraints.push(startAfter(lastVisible));
    }

    constraints.push(limit(pageSize));

    const q = query(collection(db, "tires"), ...constraints);
    const snapshot = await getDocs(q);

    const tires = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Tire[];

    return {
      tires,
      lastVisible:
        snapshot.docs.length > 0
          ? snapshot.docs[snapshot.docs.length - 1]
          : null,
    };
  } catch (error) {
    console.error("Error al obtener inventario paginado:", error);
    throw error;
  }
};
