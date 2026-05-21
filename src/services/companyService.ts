// src/services/companyService.ts
import { db } from "@/lib/firebase/clientApp";
import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";

export interface CompanyData {
  id?: string;
  businessName: string;
  ruc: string;
  plan: "FREE" | "PREMIUM" | "ENTERPRISE";
  status: "ACTIVE" | "SUSPENDED";
  createdAt?: any;
}

// 1. Obtener todas las empresas registradas en el SaaS
export const getAllCompanies = async (): Promise<CompanyData[]> => {
  try {
    const q = query(collection(db, "companies"), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as CompanyData[];
  } catch (error) {
    console.error("Error al obtener empresas:", error);
    throw new Error("No se pudo cargar la lista de empresas.");
  }
};

// 2. Crear una empresa y su Administrador raíz (Onboarding unificado)
export const createCompanyWithAdmin = async (
  company: Omit<CompanyData, "id" | "status" | "createdAt">,
  adminUid: string,
  adminEmail: string,
  adminName: string,
) => {
  try {
    // Crear referencia con ID automático para la empresa
    const companyRef = doc(collection(db, "companies"));
    const companyId = companyRef.id;

    // Guardar la empresa en Firestore
    await setDoc(companyRef, {
      ...company,
      id: companyId,
      status: "ACTIVE",
      createdAt: serverTimestamp(),
    });

    // Guardar el perfil del usuario administrador asociado a esa empresa
    const userRef = doc(db, "users", adminUid);
    await setDoc(userRef, {
      uid: adminUid,
      email: adminEmail,
      displayName: adminName,
      role: "ADMIN",
      status: "ACTIVE",
      companyId: companyId, // Enlace relacional multitenant
      createdAt: serverTimestamp(),
    });

    return { success: true, companyId };
  } catch (error) {
    console.error("Error en el onboarding corporativo:", error);
    throw new Error("Error al registrar la empresa y su administrador.");
  }
};

// 3. Interruptor de Acceso (Kill-Switch para suspender/activar clientes)
export const updateCompanyStatus = async (
  companyId: string,
  newStatus: "ACTIVE" | "SUSPENDED",
) => {
  try {
    const companyRef = doc(db, "companies", companyId);
    await updateDoc(companyRef, { status: newStatus });
    return { success: true };
  } catch (error) {
    console.error("Error al cambiar estado de empresa:", error);
    throw new Error("No se pudo actualizar el estado de la empresa.");
  }
};
