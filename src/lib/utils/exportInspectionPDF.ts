// src/lib/utils/exportInspectionPDF.ts
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Truck } from "@/types/truck";
import { Tire, TireHistory } from "@/types/tire";

const CHART_COLORS = [
  "#2563eb",
  "#dc2626",
  "#16a34a",
  "#d97706",
  "#9333ea",
  "#0891b2",
  "#be123c",
  "#ea580c",
  "#4f46e5",
  "#059669",
];

// --- NUEVA FUNCIÓN CON COMPRESIÓN DE IMAGEN ---
const getBase64ImageFromUrl = async (imageUrl: string): Promise<string> => {
  // Descargamos primero para evitar bloqueos de seguridad del navegador (CORS)
  const res = await fetch(imageUrl);
  const blob = await res.blob();
  const localUrl = URL.createObjectURL(blob);

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");

      // Forzamos un tamaño máximo para que la foto no pese megabytes
      const MAX_WIDTH = 800;
      const MAX_HEIGHT = 800;
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > MAX_WIDTH) {
          height *= MAX_WIDTH / width;
          width = MAX_WIDTH;
        }
      } else {
        if (height > MAX_HEIGHT) {
          width *= MAX_HEIGHT / height;
          height = MAX_HEIGHT;
        }
      }
      ``;

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        // Comprimimos a formato JPEG con 60% de calidad (0.6)
        const dataUrl = canvas.toDataURL("image/jpeg", 0.6);
        URL.revokeObjectURL(localUrl); // Limpiamos la memoria
        resolve(dataUrl);
      } else {
        reject("Error en canvas");
      }
    };
    img.onerror = reject;
    img.src = localUrl;
  });
};

const getQuickChartImage = async (chartConfig: any): Promise<string> => {
  const res = await fetch("https://quickchart.io/chart", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chart: chartConfig,
      width: 800,
      height: 350,
      backgroundColor: "#ffffff",
    }),
  });
  const blob = await res.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

// --- AHORA LA FUNCIÓN YA NO RECIBE 'chartImage' ---
export const generateInspectionReportPDF = async (
  truck: Truck,
  targetOdometer: number,
  allTires: Tire[],
  tiresHistories: Record<string, TireHistory[]>,
) => {
  const doc = new jsPDF({ orientation: "portrait", compress: true });

  let inspectionDate = "N/D";
  const inspectedTires: any[] = [];
  const removedTires: any[] = [];

  for (const tire of allTires) {
    const history = tiresHistories[tire.id] || [];
    const eventsAtOdometer = history.filter(
      (h) => h.currentOdometer === targetOdometer,
    );

    eventsAtOdometer.forEach((ev) => {
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

  // --- 1. ENCABEZADO Y DATOS ---
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

  let currentY = 65;

  // --- 2. TABLA DE LLANTAS MEDIDAS ---
  if (inspectedTires.length > 0) {
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

  // --- 3. TABLA DE LLANTAS RETIRADAS ---
  if (removedTires.length > 0) {
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

  // --- 4. NUEVA PÁGINA: PROCESAMIENTO DE DATOS ---
  doc.addPage();
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42);
  doc.text(
    `CURVA Y TABLA DE CONTROLES (HASTA ${targetOdometer.toLocaleString()} KM)`,
    14,
    20,
  );

  // Combinamos todas las llantas del evento
  const allInvolved = [...inspectedTires, ...removedTires];

  // Filtramos para eliminar duplicados (por si una llanta se inspeccionó y luego se desmontó en el mismo KM)
  const involvedTires = Array.from(
    new Map(allInvolved.map((t) => [t.serial, t])).values(),
  );
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

  // PREPARAMOS DATOS PARA EL GRÁFICO AUTÓNOMO
  const chartLabels: string[] = [];
  const datasetsMap: Record<string, any> = {};

  involvedTires.forEach((t, i) => {
    datasetsMap[t.serial] = {
      label: `Serie ${t.serial}`,
      data: [],
      borderColor: CHART_COLORS[i % CHART_COLORS.length],
      backgroundColor: CHART_COLORS[i % CHART_COLORS.length],
      fill: false,
      datalabels: { align: "top", font: { weight: "bold" } },
    };
  });

  const controlRows = sortedPastEvents.map((point, index) => {
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

    chartLabels.push(`${point.odometer}K`);

    involvedTires.forEach((t) => {
      const mm = point[t.serial];
      if (mm !== undefined) {
        lastKnown[t.serial] = mm;
        row.push(`${mm.toFixed(1)}`);
        datasetsMap[t.serial].data.push(mm);
      } else if (lastKnown[t.serial] !== undefined) {
        row.push(`${lastKnown[t.serial].toFixed(1)}`);
        datasetsMap[t.serial].data.push(lastKnown[t.serial]);
      } else {
        row.push("-");
        datasetsMap[t.serial].data.push(null);
      }
    });
    return row;
  });

  // GENERAR GRÁFICO CON QUICKCHART
  let tableStartY = 28;
  try {
    const chartConfig = {
      type: "line",
      data: {
        labels: chartLabels,
        datasets: Object.values(datasetsMap),
      },
      options: {
        plugins: {
          datalabels: { display: true },
          legend: { position: "bottom" },
        },
        scales: { yAxes: [{ ticks: { min: 0, max: 22, stepSize: 4 } }] },
      },
    };

    const chartBase64 = await getQuickChartImage(chartConfig);
    doc.addImage(chartBase64, "PNG", 14, 25, 180, 75);
    tableStartY = 110; // Bajamos la tabla para que no pise el gráfico
  } catch (error) {
    console.error("No se pudo generar el gráfico automático:", error);
    // Si falla el internet, simplemente no dibuja el gráfico y la tabla sube
  }

  // DIBUJAMOS LA TABLA DEBAJO
  autoTable(doc, {
    startY: tableStartY,
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

  // --- 5. ANEXO FOTOGRÁFICO ---
  const imagesToRender = [...inspectedTires, ...removedTires].filter(
    (t) => t.url,
  );
  if (imagesToRender.length > 0) {
    doc.addPage();
    let imgY = 20;
    doc.setFontSize(14);
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
