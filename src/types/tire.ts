// src/types/tire.ts
export type TireStatus = "AVAILABLE" | "IN_USE" | "MAINTENANCE" | "DISCARDED";

export interface Tire {
  id: string;
  serialNumber: string;
  brand: string;
  model: string;
  currentTreadDepth: number;
  status: TireStatus;
  truckId: string | null;
  position: string | null;
  lastInspectionDate: any;
  createdAt: any;

  // Campos financieros y logísticos
  price?: number;
  currency?: "PEN" | "USD";
  initialOdometer?: number;
  warehouse?: string;
  size?: string; // Ej: "11R22.5"
  warehouseId?: string;
}

export interface InspectionLog {
  id: string;
  tireId: string;
  recordedDepth: number;
  driverId: string;
  timestamp: number;
  notes?: string;
}
