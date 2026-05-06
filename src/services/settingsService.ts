// src/services/settingsService.ts
import { db } from "@/lib/firebase/clientApp";
import { doc, getDoc, setDoc } from "firebase/firestore";

// Usamos una sola interfaz porque la estructura es idéntica
export interface Brand {
  id: string;
  name: string;
  models: string[];
}

export interface GlobalSettings {
  companyName?: string;
  companyRuc?: string;
  companyAddress?: string;
  exchangeRateUSD?: number;
  criticalWearLimit: number;
  defaultInitialDepth: number;
  alertEmail: string;

  // Catálogos separados para mantener la base de datos limpia
  tireBrands: Brand[];
  vehicleBrands: Brand[];
}

const SETTINGS_ID = "general";

export const getGlobalSettings = async (): Promise<GlobalSettings> => {
  try {
    const docRef = doc(db, "settings", SETTINGS_ID);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        companyName: data.companyName || "",
        companyRuc: data.companyRuc || "",
        companyAddress: data.companyAddress || "",
        exchangeRateUSD: data.exchangeRateUSD || 3.75,
        criticalWearLimit: data.criticalWearLimit || 3.0,
        defaultInitialDepth: data.defaultInitialDepth || 12.0,
        alertEmail: data.alertEmail || "",

        // Migración automática: Si existía 'brands' antiguo, lo toma como 'tireBrands'
        tireBrands: data.tireBrands || data.brands || [],

        // Catálogo de Vehículos con valores por defecto
        vehicleBrands: data.vehicleBrands || [
          { id: "1", name: "VOLVO", models: ["FH16", "FMX"] },
          { id: "2", name: "SCANIA", models: ["G410", "R450"] },
          { id: "3", name: "HONDA", models: ["NL 150"] },
        ],
      };
    } else {
      return {
        companyName: "",
        companyRuc: "",
        companyAddress: "",
        exchangeRateUSD: 3.75,
        criticalWearLimit: 3.0,
        defaultInitialDepth: 12.0,
        alertEmail: "",
        tireBrands: [
          { id: "1", name: "MICHELIN", models: ["X MULTI Z", "X LINE ENERGY"] },
          { id: "2", name: "BRIDGESTONE", models: ["R249", "M729"] },
        ],
        vehicleBrands: [
          { id: "1", name: "VOLVO", models: ["FH16", "FMX"] },
          { id: "2", name: "SCANIA", models: ["G410", "R450"] },
          { id: "3", name: "HONDA", models: ["NL 150"] },
        ],
      };
    }
  } catch (error) {
    console.error("Error al obtener configuración:", error);
    throw error;
  }
};

export const updateGlobalSettings = async (settings: GlobalSettings) => {
  try {
    const docRef = doc(db, "settings", SETTINGS_ID);
    // Eliminamos el campo 'brands' antiguo antes de guardar para limpiar Firebase
    const dataToSave = { ...settings };
    if ("brands" in dataToSave) {
      delete (dataToSave as any).brands;
    }

    await setDoc(docRef, dataToSave, { merge: true });
    return { success: true };
  } catch (error) {
    console.error("Error al actualizar configuración:", error);
    throw error;
  }
};
