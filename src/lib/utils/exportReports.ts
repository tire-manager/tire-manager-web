// src/lib/utils/exportReports.ts
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

// Exportar a Excel (CSV)
export const exportProjectionsToCSV = (projections: any[]) => {
  if (projections.length === 0) {
    alert("No hay datos para exportar.");
    return;
  }

  const headers = [
    "Código",
    "Marca",
    "Diseño",
    "KM Proyectado",
    "Costo x KM Proyectado",
    "% Desgaste",
    "Remanente (mm)",
  ];

  const rows = projections.map((p) => [
    p.serialNumber,
    p.brand,
    p.model,
    p.projectedKm,
    p.costPerKm.toFixed(4),
    `${p.wearPercentage}%`,
    p.remainingTread,
  ]);

  const csvContent = [
    headers.join(","),
    ...rows.map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","),
    ),
  ].join("\n");

  const blob = new Blob(["\uFEFF" + csvContent], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;

  const dateStr = new Date().toISOString().split("T")[0];
  link.setAttribute("download", `Proyecciones_Financieras_${dateStr}.csv`);

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Exportar a PDF
export const exportProjectionsToPDF = (projections: any[]) => {
  if (projections.length === 0) {
    alert("No hay datos para exportar.");
    return;
  }

  const doc = new jsPDF();

  doc.setFontSize(16);
  doc.text("Reporte de Proyecciones y Costos de Neumáticos", 14, 20);

  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Fecha de generación: ${new Date().toLocaleDateString()}`, 14, 28);

  const tableRows = projections.map((p) => [
    p.serialNumber,
    p.brand,
    p.model,
    p.projectedKm.toLocaleString(),
    `$${p.costPerKm.toFixed(4)}`,
    `${p.wearPercentage}%`,
    `${p.remainingTread} mm`,
  ]);

  autoTable(doc, {
    startY: 35,
    head: [
      [
        "Código",
        "Marca",
        "Diseño",
        "KM Proy.",
        "Costo/KM",
        "% Desgaste",
        "Remanente",
      ],
    ],
    body: tableRows,
    theme: "striped",
    headStyles: { fillColor: [37, 99, 235] }, // Azul
  });

  const dateStr = new Date().toISOString().split("T")[0];
  doc.save(`Proyecciones_Financieras_${dateStr}.pdf`);
};
