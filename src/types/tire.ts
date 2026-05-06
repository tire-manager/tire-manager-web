// src/types/tire.ts
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
  initialOdometer?: number;
  createdAt?: any;
}

export interface TireHistory {
  id?: string;
  tireId: string;
  truckId: string; // Puede ser el ID del camión o "DESMONTADO"
  driverId: string; // ID del usuario que realizó la acción
  date: any;
  newTreadDepth: number;
  currentOdometer: number;
  notes: string;
  type: "MOUNT" | "UNMOUNT" | "INSPECTION" | "REPAIR"; // Unificamos tipos aquí
}
