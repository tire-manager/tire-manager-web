// src/types/truck.ts
export interface Truck {
  id: string; // Puede ser el mismo licensePlate o un ID generado
  licensePlate: string;
  brand: string;
  model: string;
  year: number;
  assignedDriverId: string | null; // UID del usuario con rol DRIVER
  status: "ACTIVE" | "IN_MAINTENANCE" | "INACTIVE" | "DISCARDED";
  createdAt: number;
  currentOdometer?: number;
  // Actualizado con los 5 ejes exactos
  axleConfig?:
    | "2_EJES"
    | "3_EJES_10_LLANTAS"
    | "3_EJES_BALON"
    | "3_EJES_12_LLANTAS"
    | "4_EJES";
}
