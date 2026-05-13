export type TireStatus = "AVAILABLE" | "IN_USE" | "MAINTENANCE" | "DISCARDED";
export interface Tire {
  id: string;
  serialNumber: string;
  brand: string;
  model: string;
  size: string;
  initialTreadDepth: number;
  currentTreadDepth: number;
  price?: number;
  currency?: "PEN" | "USD";
  status: TireStatus;
  warehouseId?: string;
  truckId?: string | null;
  position?: string | null;
  initialOdometer?: number; // Este lo usa el sistema para el montaje en el camión
  historicalKm?: number; // <-- NUEVO: KM previos antes de entrar al sistema
  createdAt?: any;
}

// src/types/tire.ts
export interface TireHistory {
  id?: string;
  tireId: string;
  truckId: string;
  driverId: string;
  date: any;
  newTreadDepth: number;
  currentOdometer: number;
  notes: string;
  type: "MOUNT" | "UNMOUNT" | "INSPECTION" | "REPAIR";
  imageUrl?: string; // <-- NUEVA PROPIEDAD
}
