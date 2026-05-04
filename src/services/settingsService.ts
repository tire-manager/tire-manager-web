// src/services/settingsService.ts
import { db } from "@/lib/firebase/clientApp";
import { doc, getDoc, setDoc } from "firebase/firestore";

// Actualiza la interfaz en src/services/settingsService.ts

export interface Brand {
  id: string;
  name: string;
  models: string[];
}

export interface GlobalSettings {
  criticalWearLimit: number;
  defaultInitialDepth: number;
  alertEmail: string;
  // Nuevos campos para diccionarios
  brands: Brand[];
  positions: string[];
}

// Actualiza los valores por defecto en getGlobalSettings
const defaultSettings: GlobalSettings = {
  criticalWearLimit: 3.0,
  defaultInitialDepth: 12.0,
  alertEmail: "",
  brands: [
    { id: "1", name: "Michelin", models: ["X Multi Z", "X Line Energy"] },
    { id: "2", name: "Bridgestone", models: ["R249", "M729"] },
  ],
  positions: [
    "FRONT_LEFT",
    "FRONT_RIGHT",
    "REAR_LEFT_OUTER",
    "REAR_LEFT_INNER",
    "REAR_RIGHT_INNER",
    "REAR_RIGHT_OUTER",
  ],
};

const SETTINGS_ID = "general";

// src/services/settingsService.ts

export const getGlobalSettings = async (): Promise<GlobalSettings> => {
  try {
    const docRef = doc(db, "settings", SETTINGS_ID);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return docSnap.data() as GlobalSettings;
    } else {
      // Este objeto debe tener TODAS las propiedades de la interfaz
      return {
        criticalWearLimit: 3.0,
        defaultInitialDepth: 12.0,
        alertEmail: "",
        brands: [], // IMPORTANTE
        positions: [
          // Sugerencia: pon las básicas por defecto
          "FRONT_LEFT",
          "FRONT_RIGHT",
          "REAR_LEFT_OUTER",
          "REAR_LEFT_INNER",
          "REAR_RIGHT_INNER",
          "REAR_RIGHT_OUTER",
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
    await setDoc(docRef, settings, { merge: true });
    return { success: true };
  } catch (error) {
    console.error("Error al actualizar configuración:", error);
    throw error;
  }
};
