// src/lib/utils/exportPDF.ts
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Tire } from "@/types/tire";
import { Truck } from "@/types/truck";

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

export const generateTruckTechnicalReportPDF = (
  truck: Truck,
  tires: Tire[],
) => {
  const doc = new jsPDF("landscape"); // Horizontal para que quepan todos los datos financieros

  // 1. TÍTULO Y CABECERA (Estilo Corporativo)
  doc.setFontSize(20);
  doc.setTextColor(15, 23, 42); // slate-900
  doc.setFont("helvetica", "bold");
  doc.text("INFORME TÉCNICO DE NEUMÁTICOS", 14, 22);

  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139); // slate-500
  doc.setFont("helvetica", "normal");
  const fechaHora = new Date().toLocaleString("es-PE");
  doc.text(`Generado el: ${fechaHora}`, 14, 30);
  doc.text("Departamento Técnico de Flota - FlotaERP", 14, 35);

  // 2. DATOS DEL CAMIÓN (Caja Gris)
  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.roundedRect(14, 42, 269, 25, 3, 3, "FD");

  doc.setFontSize(14);
  doc.setTextColor(37, 99, 235); // blue-600
  doc.setFont("helvetica", "bold");
  doc.text(`UNIDAD: ${truck.licensePlate}`, 20, 52);

  doc.setFontSize(10);
  doc.setTextColor(71, 85, 105); // slate-600
  doc.text(
    `Odómetro Actual: ${truck.currentOdometer?.toLocaleString() || 0} KM`,
    20,
    60,
  );

  doc.text(`Marca/Modelo: ${truck.brand} ${truck.model || ""}`, 120, 52);
  doc.text(
    `Configuración: ${truck.axleConfig?.replace(/_/g, " ") || "N/A"}`,
    120,
    60,
  );

  doc.text(`Total Llantas: ${tires.length}`, 220, 52);
  const criticas = tires.filter((t) => t.currentTreadDepth <= 4).length;
  if (criticas > 0) {
    doc.setTextColor(220, 38, 38); // red-600
  }
  doc.text(`Alertas Críticas: ${criticas}`, 220, 60);

  // 3. PROCESAMIENTO DE DATOS (La Matemática)
  const tableData = tires.map((tire) => {
    const kmRecorridos =
      (truck.currentOdometer || 0) - (tire.initialOdometer || 0);
    const mmGastados = tire.initialTreadDepth - tire.currentTreadDepth;

    // Porcentaje de desgaste
    const pctDesgaste =
      tire.initialTreadDepth > 0
        ? ((mmGastados / tire.initialTreadDepth) * 100).toFixed(1)
        : "0.0";

    // Costo por Kilómetro (CPK) Actual
    const cpk =
      tire.price && kmRecorridos > 0
        ? (tire.price / kmRecorridos).toFixed(4)
        : "0.0000";

    // Proyección de KM (Asumiendo que mueren a los 3mm)
    let proyeccion = "N/D";
    if (mmGastados > 0 && kmRecorridos > 0) {
      const kmPorMm = kmRecorridos / mmGastados;
      const mmUtilesTotales = tire.initialTreadDepth - 3; // Límite de 3mm
      const kmProyectadosTotales = Math.round(kmPorMm * mmUtilesTotales);
      proyeccion = kmProyectadosTotales.toLocaleString();
    }

    // Observación (Reglas de negocio)
    let observacion = "ÓPTIMO";
    if (tire.currentTreadDepth <= 4) observacion = "CAMBIO URGENTE";
    else if (tire.currentTreadDepth <= 6) observacion = "PLANIFICAR RELEVO";

    return [
      tire.position?.replace("POS_", "") || "N/A", // Eje/Posición
      tire.serialNumber,
      `${tire.brand} ${tire.model}`,
      `${kmRecorridos.toLocaleString()} KM`,
      `${tire.currentTreadDepth} mm`,
      `${pctDesgaste} %`,
      proyeccion,
      tire.currency === "USD" ? `$${cpk}` : `S/${cpk}`,
      observacion,
    ];
  });

  // 4. TABLA PRINCIPAL
  autoTable(doc, {
    startY: 75,
    head: [
      [
        "POS",
        "N° SERIE",
        "MARCA / DISEÑO",
        "KM RECORRIDOS",
        "REMANENTE",
        "% DESGASTE",
        "KM PROYECTADO",
        "CPK ACTUAL",
        "OBSERVACIÓN",
      ],
    ],
    body: tableData,
    theme: "grid",
    headStyles: {
      fillColor: [30, 41, 59], // slate-800
      textColor: 255,
      fontSize: 8,
      fontStyle: "bold",
      halign: "center",
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [51, 65, 85], // slate-700
      halign: "center",
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252], // slate-50
    },
    didParseCell: function (data) {
      // Pintar de rojo la celda si el remanente es bajo
      if (data.section === "body" && data.column.index === 4) {
        const mm = parseFloat(data.cell.raw as string);
        if (mm <= 4) {
          data.cell.styles.textColor = [220, 38, 38]; // Rojo
          data.cell.styles.fontStyle = "bold";
        }
      }
      // Pintar la columna de observación
      if (data.section === "body" && data.column.index === 8) {
        if (data.cell.raw === "CAMBIO URGENTE") {
          data.cell.styles.textColor = [220, 38, 38];
          data.cell.styles.fontStyle = "bold";
        } else if (data.cell.raw === "PLANIFICAR RELEVO") {
          data.cell.styles.textColor = [217, 119, 6]; // Ambar
          data.cell.styles.fontStyle = "bold";
        } else {
          data.cell.styles.textColor = [5, 150, 105]; // Verde
        }
      }
    },
  });

  // Descargar
  doc.save(`Informe_Tecnico_${truck.licensePlate}.pdf`);
};
