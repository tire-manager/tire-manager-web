// src/lib/utils/exportPDF.ts
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Tire } from "@/types/tire";

export const generateTireKardexPDF = (tire: Tire, history: any[]) => {
  const doc = new jsPDF();

  // Encabezado del reporte
  doc.setFontSize(18);
  doc.text("Kardex de Control de Neumático", 14, 22);

  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Fecha de generación: ${new Date().toLocaleDateString()}`, 14, 30);

  // Información General
  doc.setDrawColor(200);
  doc.line(14, 35, 196, 35);

  doc.setFontSize(12);
  doc.setTextColor(0);
  doc.text("Información del Neumático", 14, 45);

  doc.setFontSize(10);
  doc.text(`Número de Serie: ${tire.serialNumber}`, 14, 55);
  doc.text(`Marca/Modelo: ${tire.brand} ${tire.model}`, 14, 62);
  doc.text(`Estado Actual: ${tire.currentTreadDepth} mm`, 14, 69);
  doc.text(
    `Ubicación: ${tire.truckId ? "Camión " + tire.truckId : "Almacén"}`,
    14,
    76,
  );

  // Tabla de Historial
  const tableRows = history.map((event) => [
    event.date?.toLocaleDateString() || "N/A",
    `${event.newTreadDepth} mm`,
    event.driverId || "Sistema",
    event.notes || "Sin observaciones",
  ]);

  autoTable(doc, {
    startY: 85,
    head: [["Fecha", "Desgaste", "Chofer/Responsable", "Observaciones"]],
    body: tableRows,
    theme: "striped",
    headStyles: { fillColor: [37, 99, 235] }, // Azul similar al de nuestra UI
  });

  // Guardar archivo
  doc.save(`Kardex_${tire.serialNumber}.pdf`);
};
