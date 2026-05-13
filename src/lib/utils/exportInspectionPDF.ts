// src/lib/utils/exportInspectionPDF.ts
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Truck } from "@/types/truck";
import { Tire, TireHistory } from "@/types/tire";

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

export const generateInspectionReportPDF = async (
  truck: Truck,
  targetOdometer: number,
  allTires: Tire[],
  tiresHistories: Record<string, TireHistory[]>,
  chartImage?: string, // <-- AHORA RECIBE LA IMAGEN DEL GRÁFICO
) => {
  const doc = new jsPDF("portrait");

  let inspectionDate = "N/D";
  const inspectedTires: any[] = [];
  const removedTires: any[] = [];

  for (const tire of allTires) {
    const history = tiresHistories[tire.id] || [];
    const eventsAtOdometer = history.filter(
      (h) => h.currentOdometer === targetOdometer,
    );

    eventsAtOdometer.forEach((ev) => {
      // CORRECCIÓN DE FECHA: Maneja Timestamp o Date normal
      if (inspectionDate === "N/D" && ev.date) {
        inspectionDate = ev.date.seconds
          ? new Date(ev.date.seconds * 1000).toLocaleDateString()
          : new Date(ev.date).toLocaleDateString();
      }

      const tireInfo = {
        serial: tire.serialNumber,
        brand: tire.brand,
        model: tire.model,
        depth: ev.newTreadDepth,
        notes: ev.notes || "Sin observaciones",
        url: ev.imageUrl,
      };

      if (ev.type === "UNMOUNT")
        removedTires.push({ ...tireInfo, reason: ev.notes });
      else inspectedTires.push(tireInfo);
    });
  }

  if (inspectedTires.length === 0 && removedTires.length === 0) {
    throw new Error("No se encontraron registros para este kilometraje.");
  }

  // --- ENCABEZADO Y DATOS ---
  doc.setFillColor(30, 41, 59);
  doc.rect(0, 0, 210, 25, "F");
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.text("ACTA DE INSPECCIÓN DE NEUMÁTICOS", 14, 16);

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, 30, 182, 25, 2, 2, "FD");
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text(`UNIDAD: ${truck.licensePlate}`, 20, 40);
  doc.text(`MODELO: ${truck.brand} ${truck.model || ""}`, 90, 40);
  doc.setTextColor(220, 38, 38);
  doc.text(`ODÓMETRO: ${targetOdometer.toLocaleString()} KM`, 20, 48);
  doc.setTextColor(15, 23, 42);
  doc.text(`FECHA DE CONTROL: ${inspectionDate}`, 90, 48);

  let currentY = 65; // Puntero de altura dinámico

  // --- NUEVO: GRÁFICA DE DESGASTE ---
  if (chartImage) {
    doc.setFontSize(12);
    doc.text("CURVA DE DESGASTE HISTÓRICA", 14, currentY);
    doc.addImage(chartImage, "PNG", 14, currentY + 4, 180, 80);
    currentY += 95; // Bajamos el puntero para que la tabla no se monte encima
  }

  // --- TABLA DE LLANTAS MEDIDAS ---
  if (inspectedTires.length > 0) {
    if (currentY > 250) {
      doc.addPage();
      currentY = 20;
    }
    doc.setFontSize(12);
    doc.text("ESTADO DE NEUMÁTICOS INSPECCIONADOS", 14, currentY);

    autoTable(doc, {
      startY: currentY + 5,
      head: [["SERIE", "MARCA/MODELO", "REMANENTE", "OBSERVACIONES"]],
      body: inspectedTires.map((t) => [
        t.serial,
        `${t.brand} ${t.model}`,
        `${t.depth} mm`,
        t.notes,
      ]),
      theme: "grid",
      headStyles: { fillColor: [30, 41, 59], fontSize: 9 },
      bodyStyles: { fontSize: 9 },
    });
    currentY = (doc as any).lastAutoTable.finalY + 15;
  }

  // --- TABLA DE LLANTAS RETIRADAS ---
  if (removedTires.length > 0) {
    if (currentY > 250) {
      doc.addPage();
      currentY = 20;
    }
    doc.setFontSize(12);
    doc.setTextColor(220, 38, 38);
    doc.text("ALERTA: NEUMÁTICOS RETIRADOS EN ESTE CONTROL", 14, currentY);

    autoTable(doc, {
      startY: currentY + 5,
      head: [["SERIE", "PROFUNDIDAD FINAL", "CAUSA DE RETIRO"]],
      body: removedTires.map((t) => [t.serial, `${t.depth} mm`, t.reason]),
      theme: "grid",
      headStyles: { fillColor: [220, 38, 38], textColor: 255, fontSize: 9 },
      bodyStyles: { fontSize: 9 },
    });
    currentY = (doc as any).lastAutoTable.finalY + 15;
  }

  // --- TABLA DE CONTROLES HISTÓRICOS ---
  doc.addPage();
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text(
    `TABLA DE CONTROLES (HASTA ${targetOdometer.toLocaleString()} KM)`,
    14,
    20,
  );

  const involvedTires = [...inspectedTires, ...removedTires];
  const headers = ["CONTROL", "FECHA", "ODÓMETRO (KM)"];
  involvedTires.forEach((t) => headers.push(`SERIE\n${t.serial}`));

  const pastEventsMap = new Map<number, any>();
  allTires.forEach((tire) => {
    const history = tiresHistories[tire.id] || [];
    history.forEach((ev) => {
      if (ev.currentOdometer <= targetOdometer) {
        if (!pastEventsMap.has(ev.currentOdometer)) {
          pastEventsMap.set(ev.currentOdometer, {
            odometer: ev.currentOdometer,
            date: ev.date,
          });
        }
        const point = pastEventsMap.get(ev.currentOdometer);
        point[tire.serialNumber] = ev.newTreadDepth;
      }
    });
  });

  const sortedPastEvents = Array.from(pastEventsMap.values()).sort(
    (a, b) => a.odometer - b.odometer,
  );
  const lastKnown: Record<string, number> = {};

  const controlRows = sortedPastEvents.map((point, index) => {
    // CORRECCIÓN DE FECHA EN TABLA DE CONTROLES
    let dateStr = "N/D";
    if (point.date) {
      dateStr = point.date.seconds
        ? new Date(point.date.seconds * 1000).toLocaleDateString()
        : new Date(point.date).toLocaleDateString();
    }

    const row = [
      index === 0 ? "MONTAJE" : `${index}ER CONTROL`,
      dateStr,
      point.odometer.toLocaleString(),
    ];

    involvedTires.forEach((t) => {
      const mm = point[t.serial];
      if (mm !== undefined) {
        lastKnown[t.serial] = mm;
        row.push(`${mm.toFixed(1)}`);
      } else if (lastKnown[t.serial] !== undefined) {
        row.push(`${lastKnown[t.serial].toFixed(1)}`);
      } else {
        row.push("-");
      }
    });
    return row;
  });

  autoTable(doc, {
    startY: 25,
    head: [headers],
    body: controlRows,
    theme: "striped",
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: 255,
      fontSize: 8,
      halign: "center",
    },
    bodyStyles: { fontSize: 8, halign: "center" },
  });

  // --- ANEXO FOTOGRÁFICO ---
  const imagesToRender = [...inspectedTires, ...removedTires].filter(
    (t) => t.url,
  );
  if (imagesToRender.length > 0) {
    doc.addPage();
    let imgY = 20;
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text("EVIDENCIA FOTOGRÁFICA DEL CONTROL", 14, imgY);
    imgY += 10;

    let xPos = 14;
    for (const imgData of imagesToRender) {
      try {
        const base64Img = await getBase64ImageFromUrl(imgData.url);
        doc.setFillColor(248, 250, 252);
        doc.setDrawColor(203, 213, 225);
        doc.roundedRect(xPos, imgY, 85, 90, 2, 2, "FD");
        doc.setFontSize(9);
        doc.setFont("helvetica", "bold");
        doc.text(`Serie: ${imgData.serial}`, xPos + 5, imgY + 7);
        doc.setFont("helvetica", "normal");
        doc.text(`Remanente: ${imgData.depth} mm`, xPos + 5, imgY + 12);
        doc.addImage(base64Img, "JPEG", xPos + 5, imgY + 18, 75, 65);

        xPos += 90;
        if (xPos > 150) {
          xPos = 14;
          imgY += 95;
          if (imgY > 200) {
            doc.addPage();
            imgY = 20;
          }
        }
      } catch (error) {
        console.error("Error al cargar imagen", error);
      }
    }
  }

  doc.save(`Inspeccion_${truck.licensePlate}_${targetOdometer}KM.pdf`);
};
