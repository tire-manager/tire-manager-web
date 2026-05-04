// src/lib/utils/exportCSV.ts
import { Tire } from "@/types/tire";

export const exportTiresToCSV = (tires: Tire[]) => {
  if (tires.length === 0) {
    alert("No hay datos para exportar.");
    return;
  }

  // 1. Definimos las cabeceras de nuestro Excel
  const headers = [
    "N° Serie",
    "Marca",
    "Modelo",
    "Desgaste Actual (mm)",
    "Estado",
    "Ubicación",
  ];

  // 2. Mapeamos los datos de cada neumático para que coincidan con las cabeceras
  const rows = tires.map((tire) => {
    // Traducimos el estado para que sea legible en el reporte
    const statusText =
      tire.status === "AVAILABLE"
        ? "En Almacén"
        : tire.status === "IN_USE"
          ? "En Uso"
          : "Descartado";

    // Limpiamos la ubicación
    const locationText = tire.truckId
      ? `Camión ${tire.truckId} (${tire.position?.replace(/_/g, " ") || ""})`
      : "Stock (Sin asignar)";

    return [
      tire.serialNumber,
      tire.brand,
      tire.model,
      tire.currentTreadDepth,
      statusText,
      locationText,
    ];
  });

  // 3. Unimos todo con comas y saltos de línea
  const csvContent = [
    headers.join(","),
    ...rows.map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","),
    ),
  ].join("\n");

  // 4. Truco Pro: Añadir el BOM (Byte Order Mark) para que Excel lea los acentos (ñ, á) correctamente
  const blob = new Blob(["\uFEFF" + csvContent], {
    type: "text/csv;charset=utf-8;",
  });

  // 5. Crear un enlace invisible y forzar la descarga
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;

  // Nombre del archivo con la fecha actual
  const dateStr = new Date().toISOString().split("T")[0];
  link.setAttribute("download", `Inventario_Flota_${dateStr}.csv`);

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
