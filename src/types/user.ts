// src/types/user.ts
export type UserRole = "SUPERADMIN" | "ADMIN" | "INSPECTOR"; // SUPERADMIN es para ti (dueño del SaaS)

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  status?: "ACTIVE" | "INACTIVE" | "ON_VACATION";

  companyId: string; // <-- EL NÚCLEO DEL SAAS: ID de la empresa a la que pertenece

  truckId?: string | null;
  createdAt?: any;
}
