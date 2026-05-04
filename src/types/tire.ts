// src/types/tire.ts
export type TireStatus = "AVAILABLE" | "IN_USE" | "MAINTENANCE" | "DISCARDED";

export type TirePosition =
  | "FRONT_LEFT"
  | "FRONT_RIGHT"
  | "REAR_LEFT_OUTER"
  | "REAR_LEFT_INNER"
  | "REAR_RIGHT_INNER"
  | "REAR_RIGHT_OUTER";

export interface Tire {
  id: string;
  serialNumber: string;
  brand: string;
  model: string;
  currentTreadDepth: number; // en mm
  status: TireStatus;
  truckId?: string;
  position?: TirePosition;
  lastInspectionDate: number;
  price?: number; // Costo de compra de la llanta
  initialOdometer?: number;
}

export interface InspectionLog {
  id: string;
  tireId: string;
  recordedDepth: number;
  driverId: string;
  timestamp: number;
  notes?: string;
}
