// src/types/user.ts
export type UserRole = "ADMIN" | "DRIVER";

// src/types/user.ts
export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: "ADMIN" | "DRIVER";
  status?: "ACTIVE" | "INACTIVE";

  // 👇 AQUÍ ESTÁ EL CAMBIO: Agregamos " | null "
  truckId?: string | null;

  createdAt?: any;
}
