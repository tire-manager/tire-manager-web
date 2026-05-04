// src/app/layout.tsx
import "./globals.css";
import { Inter } from "next/font/google";
import { Toaster } from "react-hot-toast"; // 1. Añadimos la importación

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Control de Flota ERP",
  description: "Sistema de gestión de neumáticos y vehículos",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className={inter.className}>
        {/* 2. Colocamos el Toaster aquí. Configuramos la posición y el estilo general */}
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 3000,
            style: {
              background: "#334155",
              color: "#fff",
              borderRadius: "12px",
              fontWeight: "500",
            },
            success: {
              style: { background: "#10b981" }, // Verde esmeralda para éxito
            },
            error: {
              style: { background: "#ef4444" }, // Rojo para errores
            },
          }}
        />
        {children}
      </body>
    </html>
  );
}
