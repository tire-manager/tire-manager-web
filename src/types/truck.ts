// src/types/truck.ts
export interface Truck {
  id: string; // Puede ser el mismo licensePlate o un ID generado
  licensePlate: string;
  brand: string;
  model: string;
  year: number;
  assignedDriverId: string | null; // UID del usuario con rol DRIVER
  status: "ACTIVE" | "IN_MAINTENANCE" | "INACTIVE";
  createdAt: number;
  currentOdometer?: number;
}
