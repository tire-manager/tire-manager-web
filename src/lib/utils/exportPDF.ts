// src/lib/utils/exportPDF.ts
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Truck } from "@/types/truck";
import { Tire, TireHistory } from "@/types/tire";
import { getTireAdvancedStats } from "@/services/tireService";

// --- NUEVO: Función auxiliar para convertir imagen de URL a Base64 ---
const getBase64ImageFromUrl = async (imageUrl: string): Promise<string> => {
  const res = await fetch(imageUrl);
  const blob = await res.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

// --- AHORA ES ASYNC ---
export const generateTruckTechnicalReportPDF = async (
  truck: Truck,
  tires: Tire[],
  chartImage?: string,
  tiresHistories: Record<string, any[]> = {},
  chartData: any[] = [],
  pastTires: Tire[] = [], // <-- RECIBIMOS LAS HISTÓRICAS
) => {
  const doc = new jsPDF("landscape");
  const moneda = tires[0]?.currency === "USD" ? "$" : "S/";

  // --- 1. ENCABEZADO ---
  doc.setFillColor(30, 41, 59);
  doc.rect(0, 0, 297, 30, "F");

  doc.setFontSize(22);
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.text("INFORME TÉCNICO DE NEUMÁTICOS", 14, 20);

  // --- 2. DATOS DE LA UNIDAD ---
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, 35, 269, 25, 2, 2, "FD");

  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.setFont("helvetica", "normal");
  doc.text("DATOS DEL VEHÍCULO", 20, 42);

  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.text(`PLACA: ${truck.licensePlate}`, 20, 52);
  doc.text(`MODELO: ${truck.brand} ${truck.model || ""}`, 100, 52);
  doc.text(
    `ODO ACTUAL: ${truck.currentOdometer?.toLocaleString()} KM`,
    190,
    52,
  );

  // --- 3. GRÁFICA ---
  if (chartImage) {
    doc.setFontSize(12);
    doc.text("CURVA DE DESGASTE", 14, 72);
    doc.addImage(chartImage, "PNG", 14, 75, 180, 80);
  }

  // --- 4. RESUMEN FINANCIERO ---
  const totalInversion = tires.reduce((acc, t) => acc + (t.price || 0), 0);
  let sumCPK = 0;
  let validTires = 0;

  const tableData = tires.map((tire) => {
    const history = tiresHistories[tire.id] || [];
    const stats = getTireAdvancedStats(tire, history);

    if (stats.cpk > 0) {
      sumCPK += stats.cpk;
      validTires++;
    }

    const pctDesgaste = (
      ((tire.initialTreadDepth - tire.currentTreadDepth) /
        tire.initialTreadDepth) *
      100
    ).toFixed(1);

    return [
      tire.position?.replace("POS_", "") || "N/A",
      tire.serialNumber,
      `${tire.brand} ${tire.model}`,
      `${tire.currentTreadDepth} mm`,
      `${pctDesgaste}%`,
      stats.projectedKm > 0
        ? `${stats.projectedKm.toLocaleString()} KM`
        : "0 KM",
      stats.estimatedChangeDate
        ? stats.estimatedChangeDate.toLocaleDateString()
        : "N/D",
      `${moneda} ${stats.cpk.toFixed(4)}`,
    ];
  });

  const cpkPromedio = validTires > 0 ? sumCPK / validTires : 0;

  doc.setFillColor(15, 23, 42);
  doc.roundedRect(205, 75, 78, 80, 2, 2, "F");
  doc.setTextColor(255, 255, 255);
  doc.text("RESUMEN DE INVERSIÓN", 212, 85);

  doc.setFontSize(9);
  doc.setTextColor(148, 163, 184);
  doc.text("Inversión Total Ejes Activos:", 212, 95);
  doc.setFontSize(12);
  doc.setTextColor(255, 255, 255);
  doc.text(`${moneda} ${totalInversion.toLocaleString()}`, 212, 102);

  doc.setFontSize(9);
  doc.setTextColor(148, 163, 184);
  doc.text("CPK Promedio (Flota Actual):", 212, 115);
  doc.setFontSize(12);
  doc.setTextColor(52, 211, 153);
  doc.text(`${moneda} ${cpkPromedio.toFixed(4)} / KM`, 212, 122);

  // --- 5. TABLA DE RESUMEN ---
  autoTable(doc, {
    startY: 160,
    head: [
      [
        "POS",
        "SERIE",
        "MARCA/MODELO",
        "REMANENTE",
        "% DESG.",
        "PROYECCIÓN",
        "FECHA CAMBIO",
        "CPK",
      ],
    ],
    body: tableData,
    theme: "grid",
    headStyles: { fillColor: [30, 41, 59], fontSize: 8, halign: "center" },
    bodyStyles: { fontSize: 8, halign: "center" },
  });

  // --- 6. TABLA DE CONTROLES ---
  if (chartData.length > 0) {
    doc.addPage();
    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42);
    doc.setFont("helvetica", "bold");
    doc.text("TABLA DE CONTROLES (PROFUNDIDAD DE GRABADO)", 14, 20);

    const headers = ["CONTROL", "FECHA", "ODÓMETRO (KM)"];
    tires.forEach((t) => headers.push(`SERIE\n${t.serialNumber}`));

    // NUEVO: Objeto para recordar la última medida conocida de cada llanta
    const lastKnown: Record<string, number> = {};

    const controlRows = chartData.map((point, index) => {
      const row = [
        index === 0 ? "MONTAJE" : `${index}ER CONTROL`,
        point.date ? new Date(point.date).toLocaleDateString() : "N/D",
        point.odometer.toLocaleString(),
      ];

      tires.forEach((t) => {
        const mm = point[t.serialNumber];

        if (mm !== undefined) {
          // Si hay una medida explícita en este kilómetro, la guardamos en la memoria y la imprimimos
          lastKnown[t.serialNumber] = mm;
          row.push(`${mm.toFixed(1)}`);
        } else {
          // Si NO hay medida, pero la llanta ya había sido montada en este odómetro,
          // arrastramos (copiamos) su último valor conocido en lugar de poner un guion
          if (
            point.odometer >= (t.initialOdometer || 0) &&
            lastKnown[t.serialNumber] !== undefined
          ) {
            row.push(`${lastKnown[t.serialNumber].toFixed(1)}`);
          } else {
            // Si el odómetro es menor al de su instalación, significa que aún no existía en el camión
            row.push("-");
          }
        }
      });
      return row;
    });

    autoTable(doc, {
      startY: 30,
      head: [headers],
      body: controlRows,
      theme: "striped",
      headStyles: {
        fillColor: [220, 38, 38],
        textColor: 255,
        fontSize: 8,
        halign: "center",
      },
      bodyStyles: { fontSize: 8, halign: "center" },
      didParseCell: (data) => {
        if (data.section === "body" && data.column.index >= 3) {
          // Reemplazamos los guiones vacíos por 0 para la validación lógica sin que rompa
          const valText = data.cell.raw as string;
          if (valText !== "-") {
            const val = parseFloat(valText);
            if (val <= 8 && val > 4)
              data.cell.styles.fillColor = [253, 224, 71];
            if (val <= 4) {
              data.cell.styles.fillColor = [254, 226, 226];
              data.cell.styles.textColor = [220, 38, 38];
              data.cell.styles.fontStyle = "bold";
            }
          }
        }
      },
    });
  }

  // --- 7. ANEXO DE EVIDENCIAS FOTOGRÁFICAS ---
  // Buscamos todas las llantas retiradas de este camión que tengan fotos
  const annexImages: {
    serial: string;
    date: string;
    reason: string;
    url: string;
    depth: number;
  }[] = [];

  // Como `tires` solo trae las llantas "actuales", escaneamos TODO el historial que trajimos
  // para ver qué llantas fueron desmontadas de este camión en el pasado y tienen foto
  Object.keys(tiresHistories).forEach((tireId) => {
    const events = tiresHistories[tireId];
    events.forEach((ev) => {
      if ((ev.type === "UNMOUNT" || ev.type === "REPAIR") && ev.imageUrl) {
        // Encontramos la llanta en el inventario actual para sacar su serie (o la buscamos en el historial si es posible)
        const matchedTire = tires.find((t) => t.id === tireId);
        annexImages.push({
          serial: matchedTire ? matchedTire.serialNumber : tireId.slice(0, 8),
          date: ev.date ? new Date(ev.date).toLocaleDateString() : "N/D",
          reason: ev.notes || "Retiro",
          url: ev.imageUrl,
          depth: ev.newTreadDepth || 0,
        });
      }
    });
  });

  if (annexImages.length > 0) {
    doc.addPage();
    doc.setFillColor(30, 41, 59);
    doc.rect(0, 0, 297, 30, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.text("ANEXO: EVIDENCIA DE RETIROS Y DAÑOS", 14, 20);

    let xPos = 14;
    let yPos = 40;

    for (const imgData of annexImages) {
      try {
        const base64Img = await getBase64ImageFromUrl(imgData.url);

        // Dibujamos una tarjeta estilo Polaroid para la foto
        doc.setFillColor(248, 250, 252);
        doc.setDrawColor(203, 213, 225);
        doc.roundedRect(xPos, yPos, 85, 100, 2, 2, "FD");

        // Textos descriptivos
        doc.setTextColor(15, 23, 42);
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.text(`Serie: ${imgData.serial}`, xPos + 5, yPos + 8);

        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(71, 85, 105);
        doc.text(`Fecha: ${imgData.date}`, xPos + 5, yPos + 14);
        doc.text(`Remanente: ${imgData.depth} mm`, xPos + 5, yPos + 19);

        // Cortamos el motivo si es muy largo
        const splitReason = doc.splitTextToSize(
          `Motivo: ${imgData.reason}`,
          75,
        );
        doc.text(splitReason, xPos + 5, yPos + 24);

        // Imprimimos la imagen
        doc.addImage(base64Img, "JPEG", xPos + 5, yPos + 35, 75, 60);

        xPos += 90;

        // Salto de línea o de página para las fotos
        if (xPos > 250) {
          xPos = 14;
          yPos += 105;
          if (yPos > 170) {
            doc.addPage();
            yPos = 20;
          }
        }
      } catch (error) {
        console.error("Error cargando imagen al PDF:", imgData.url);
      }
    }
  }

  // --- NUEVA PÁGINA: DATOS DE RETIRO ---
  if (pastTires.length > 0) {
    doc.addPage();
    doc.setFillColor(220, 38, 38); // Rojo BOTO
    doc.rect(0, 0, 297, 20, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.text("DATOS DEL RETIRO (HISTORIAL DE LA UNIDAD)", 14, 13);

    const retiredData = pastTires.map((tire) => {
      const history = tiresHistories[tire.id] || [];
      // Buscamos el evento de UNMOUNT específico de este camión
      const unmountEvent = history.find(
        (h) => h.type === "UNMOUNT" && h.truckId === truck.id,
      );
      const mountEvent = history.find(
        (h) => h.type === "MOUNT" && h.truckId === truck.id,
      );

      const kmsRecorridos =
        (unmountEvent?.currentOdometer || 0) -
        (mountEvent?.currentOdometer || 0);
      const costoHr =
        tire.price && kmsRecorridos > 0 ? tire.price / kmsRecorridos : 0;

      return [
        tire.serialNumber,
        `${unmountEvent?.newTreadDepth || 0} mm`,
        unmountEvent?.currentOdometer?.toLocaleString() || "N/D",
        `${kmsRecorridos.toLocaleString()} KM`,
        `$ ${costoHr.toFixed(4)}`,
        unmountEvent?.notes || "N/D",
      ];
    });

    autoTable(doc, {
      startY: 25,
      head: [
        [
          "Nº IDENTIFICACIÓN",
          "PROF. FINAL",
          "ODO FINAL",
          "KM RECORRIDOS",
          "COSTO/KM",
          "CAUSA DE RETIRO",
        ],
      ],
      body: retiredData,
      theme: "grid",
      headStyles: {
        fillColor: [241, 245, 249],
        textColor: [15, 23, 42],
        fontStyle: "bold",
      },
      columnStyles: { 5: { cellWidth: 80 } }, // Espacio para la causa de retiro
    });
  }

  doc.save(`Reporte_Tecnico_${truck.licensePlate}.pdf`);
};

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
