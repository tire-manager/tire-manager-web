// src/types/truck.ts
export interface Truck {
  id: string;
  companyId: string; // <-- NUEVO
  licensePlate: string;
  brand: string;
  model: string;
  year: number;
  assignedDriverId: string | null;
  status: "ACTIVE" | "IN_MAINTENANCE" | "INACTIVE" | "DISCARDED";
  createdAt: number;
  currentOdometer?: number;
  axleConfig?:
    | "2_EJES"
    | "3_EJES_10_LLANTAS"
    | "3_EJES_BALON"
    | "3_EJES_12_LLANTAS"
    | "4_EJES";
}
