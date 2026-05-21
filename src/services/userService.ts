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

// ACTUALIZADO: Filtro de seguridad SaaS (companyId)
export const getUsers = async (companyId: string): Promise<UserProfile[]> => {
  try {
    const q = query(
      collection(db, "users"),
      where("companyId", "==", companyId),
    );
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => ({
      ...doc.data(),
    })) as UserProfile[];
  } catch (error) {
    console.error("Error al obtener usuarios:", error);
    return [];
  }
};

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

// NUEVO: Reemplaza a getDrivers. Útil si a futuro necesitas listar solo Inspectores de una empresa
export const getInspectors = async (
  companyId: string,
): Promise<UserProfile[]> => {
  try {
    const q = query(
      collection(db, "users"),
      where("companyId", "==", companyId),
      where("role", "==", "INSPECTOR"),
    );
    const snapshot = await getDocs(q);

    const allInspectors = snapshot.docs.map((doc) => doc.data() as UserProfile);

    // Filtramos localmente (JavaScript) aceptando solo a los ACTIVE
    // o usuarios que aún no tienen el campo status
    return allInspectors.filter(
      (inspector) => !inspector.status || inspector.status === "ACTIVE",
    );
  } catch (error) {
    console.error("Error al obtener inspectores:", error);
    return [];
  }
};
