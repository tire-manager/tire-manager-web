// src/types/company.ts
export type CompanyPlan = "FREE" | "PREMIUM" | "ENTERPRISE";

export interface Company {
  id: string;
  businessName: string; // Razón Social (ej: Cruz del Sur)
  ruc: string;
  status: "ACTIVE" | "SUSPENDED";

  // Gestión de Suscripción
  plan: CompanyPlan;
  createdAt: any;
  expiresAt: any | null; // null si es ilimitado como el plan gratuito

  // Límites del Plan (Defensive Design)
  limits: {
    maxTrucks: number; // Ej: 3 camiones en plan gratis
    maxTires: number; // Ej: 20 llantas en plan gratis
  };
}
