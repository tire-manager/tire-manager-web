// src/lib/utils/exportPDF.ts
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Tire } from "@/types/tire";
import { Truck } from "@/types/truck";
import { getTireAdvancedStats } from "@/services/tireService";

export const generateTireKardexPDF = (tire: any, history: any[]) => {
  const doc = new jsPDF();
  const stats = getTireAdvancedStats(tire, history);
  const moneda = tire.currency === "USD" ? "$" : "S/";

  // --- FONDO Y MARCO ---
  doc.setFillColor(249, 250, 251); // Color de fondo sutil
  doc.rect(0, 0, 210, 297, "F");

  // --- ENCABEZADO ---
  doc.setFillColor(30, 41, 59); // Slate-800
  doc.rect(0, 0, 210, 40, "F");

  doc.setFontSize(22);
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.text("REPORTE TÉCNICO DE NEUMÁTICO", 14, 25);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(148, 163, 184);
  doc.text(
    `ID SISTEMA: ${tire.id} | GENERADO: ${new Date().toLocaleString()}`,
    14,
    33,
  );

  // --- BLOQUE 1: FICHA TÉCNICA ---
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(14, 48, 182, 35, 2, 2, "FD");

  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text("ESPECIFICACIONES DEL ACTIVO", 20, 56);

  doc.setFontSize(12);
  doc.setTextColor(0);
  doc.setFont("helvetica", "bold");
  doc.text(`${tire.brand} ${tire.model}`, 20, 65);
  doc.text(`Serie: ${tire.serialNumber}`, 20, 72);

  doc.setFont("helvetica", "normal");
  doc.text(`Medida: ${tire.size}`, 110, 65);
  doc.text(`Profundidad Inicial: ${tire.initialTreadDepth} mm`, 110, 72);

  // --- BLOQUE 2: ANALÍTICA PREDICTIVA (ESTILO DASHBOARD) ---
  const drawStatCard = (
    x: number,
    y: number,
    label: string,
    value: string,
    color: [number, number, number],
  ) => {
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(230);
    doc.roundedRect(x, y, 43, 25, 2, 2, "FD");
    doc.setFontSize(8);
    doc.setTextColor(100);
    doc.text(label, x + 5, y + 8);
    doc.setFontSize(11);
    doc.setTextColor(color[0], color[1], color[2]);
    doc.setFont("helvetica", "bold");
    doc.text(value, x + 5, y + 18);
  };

  drawStatCard(
    14,
    90,
    "COSTO/KM (CPK)",
    `${moneda}${stats.cpk.toFixed(4)}`,
    [16, 185, 129],
  );
  drawStatCard(
    60,
    90,
    "KM RESTANTES",
    `${stats.projectedKm.toLocaleString()} KM`,
    [37, 99, 235],
  );
  drawStatCard(
    106,
    90,
    "VALOR RESIDUAL",
    `${moneda}${stats.residualValue.toFixed(2)}`,
    [15, 23, 42],
  );
  drawStatCard(
    152,
    90,
    "TASA DESGASTE",
    `${stats.wearRate.toFixed(2)} mm/k`,
    [245, 158, 11],
  );

  // --- BLOQUE 3: PRONÓSTICO DE CAMBIO (PASO 3) ---
  doc.setFillColor(239, 246, 255); // Azul muy claro
  doc.setDrawColor(191, 219, 254);
  doc.roundedRect(14, 122, 182, 20, 2, 2, "FD");

  doc.setFontSize(11);
  doc.setTextColor(30, 58, 138); // Azul oscuro
  const fechaEstimada = stats.estimatedChangeDate
    ? stats.estimatedChangeDate.toLocaleDateString("es-PE", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "Datos insuficientes para predecir";

  doc.text(
    `PRONÓSTICO DE RELEVO: Se estima que el neumático llegará al límite el ${fechaEstimada}`,
    20,
    134,
  );

  // --- BLOQUE 4: TABLA DE HISTORIAL ---
  doc.setFontSize(12);
  doc.setTextColor(0);
  doc.text("Línea de Tiempo Operativa", 14, 155);

  autoTable(doc, {
    startY: 160,
    head: [["Fecha", "Evento", "Remanente", "Odómetro", "Observaciones"]],
    body: history.map((e) => [
      e.date?.toLocaleDateString() || "N/A",
      e.type === "MOUNT"
        ? "MONTAJE"
        : e.type === "UNMOUNT"
          ? "DESMONTAJE"
          : "INSPECCIÓN",
      `${e.newTreadDepth} mm`,
      e.currentOdometer ? `${e.currentOdometer.toLocaleString()} KM` : "---",
      e.notes || "---",
    ]),
    theme: "striped",
    headStyles: { fillColor: [30, 41, 59], fontSize: 9 },
    bodyStyles: { fontSize: 8 },
    columnStyles: { 4: { cellWidth: 60 } },
  });

  doc.save(`Kardex_Avanzado_${tire.serialNumber}.pdf`);
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
