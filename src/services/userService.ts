// src/services/userService.ts
import { db } from "@/lib/firebase/clientApp";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  where,
} from "firebase/firestore";
import { UserProfile, UserRole } from "@/types/user";

export type UserStatus = "ACTIVE" | "ON_VACATION" | "INACTIVE";

export const getUserProfile = async (
  uid: string,
): Promise<UserProfile | null> => {
  try {
    const docRef = doc(db, "users", uid);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return docSnap.data() as UserProfile;
    }
    return null;
  } catch (error) {
    console.error("Error obteniendo perfil:", error);
    return null;
  }
};

export const createUserProfile = async (
  profile: UserProfile,
): Promise<void> => {
  try {
    // Aseguramos que los usuarios nuevos entren como activos por defecto
    const newProfile = { ...profile, status: profile.status || "ACTIVE" };
    await setDoc(doc(db, "users", profile.uid), newProfile);
  } catch (error) {
    console.error("Error creando perfil:", error);
    throw new Error("No se pudo crear el perfil.");
  }
};

export const getUsers = async (): Promise<UserProfile[]> => {
  try {
    const usersRef = collection(db, "users");
    const snapshot = await getDocs(usersRef);

    return snapshot.docs.map((doc) => ({
      ...doc.data(),
    })) as UserProfile[];
  } catch (error) {
    console.error("Error al obtener usuarios:", error);
    return [];
  }
};

// <-- NUEVA FUNCIÓN PARA EDITAR USUARIOS -->
export const updateUserProfile = async (
  uid: string,
  data: Partial<UserProfile>,
) => {
  try {
    const docRef = doc(db, "users", uid);
    await setDoc(docRef, data, { merge: true });
    return { success: true };
  } catch (error) {
    console.error("Error al actualizar perfil:", error);
    throw new Error("No se pudo actualizar el perfil.");
  }
};

export const createUserViaApi = async (userData: any) => {
  try {
    const response = await fetch("/api/users", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(userData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Error al crear el usuario");
    }

    return data.user;
  } catch (error) {
    console.error("Error en createUserViaApi:", error);
    throw error;
  }
};

export const getDrivers = async (): Promise<UserProfile[]> => {
  try {
    // 1. Consultamos solo por rol para evitar el error de Índices en Firebase
    const q = query(collection(db, "users"), where("role", "==", "DRIVER"));
    const snapshot = await getDocs(q);

    const allDrivers = snapshot.docs.map((doc) => doc.data() as UserProfile);

    // 2. Filtramos localmente (JavaScript) aceptando a los ACTIVE
    // y a los usuarios antiguos que aún no tienen el campo status
    return allDrivers.filter(
      (driver) => !driver.status || driver.status === "ACTIVE",
    );
  } catch (error) {
    console.error("Error al obtener choferes:", error);
    return [];
  }
};
