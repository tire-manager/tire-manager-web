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
import { UserRole } from "@/types/user";

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  truckId?: string; // Solo para Choferes
  createdAt: number;
}

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
    await setDoc(doc(db, "users", profile.uid), profile);
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
    const q = query(collection(db, "users"), where("role", "==", "DRIVER"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => doc.data() as UserProfile);
  } catch (error) {
    console.error("Error al obtener choferes:", error);
    return [];
  }
};
