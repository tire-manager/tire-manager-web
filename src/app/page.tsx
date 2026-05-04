// src/app/page.tsx
import { redirect } from "next/navigation";

export default function RootPage() {
  // Redirigimos automáticamente la raíz '/' hacia '/login'.
  // Si el usuario ya está autenticado, nuestro middleware.ts lo atrapará
  // antes de que cargue el login y lo mandará a su Dashboard correspondiente.
  redirect("/login");
}
