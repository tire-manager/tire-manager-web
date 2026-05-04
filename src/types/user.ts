// src/types/user.ts
export type UserRole = "ADMIN" | "DRIVER";

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  truckId?: string; // Solo para Choferes
  createdAt: number;
}
