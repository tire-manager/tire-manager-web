// // src/app/driver/inspection/page.tsx
// "use client";
// import React, { useEffect, useState } from "react";
// import { auth } from "@/lib/firebase/clientApp";
// import { onAuthStateChanged } from "firebase/auth";
// import { getUserProfile } from "@/services/userService";
// import { getTiresByTruckId, recordInspection } from "@/services/tireService";
// import { Tire } from "@/types/tire";
// import { ClipboardCheck, AlertCircle, CheckCircle2 } from "lucide-react";

// export default function DriverInspectionPage() {
//   const [loading, setLoading] = useState(true);
//   const [submitting, setSubmitting] = useState(false);
//   const [success, setSuccess] = useState(false);
//   const [error, setError] = useState("");

//   const [driverId, setDriverId] = useState<string>("");
//   const [truckId, setTruckId] = useState<string>("");
//   const [tires, setTires] = useState<Tire[]>([]);

//   const [formData, setFormData] = useState({
//     tireId: "",
//     newTreadDepth: "",
//     notes: "",
//   });

//   useEffect(() => {
//     const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
//       if (currentUser) {
//         setDriverId(currentUser.uid);
//         try {
//           const profile = await getUserProfile(currentUser.uid);
//           if (profile?.truckId) {
//             setTruckId(profile.truckId);
//             const tiresData = await getTiresByTruckId(profile.truckId);
//             setTires(tiresData);

//             // Preseleccionar el primer neumático si existe
//             if (tiresData.length > 0) {
//               setFormData((prev) => ({ ...prev, tireId: tiresData[0].id }));
//             }
//           }
//         } catch (error) {
//           console.error("Error cargando datos para inspección:", error);
//         }
//       }
//       setLoading(false);
//     });

//     return () => unsubscribe();
//   }, []);

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     if (!formData.tireId || !formData.newTreadDepth) return;

//     setSubmitting(true);
//     setError("");
//     setSuccess(false);

//     try {
//       await recordInspection({
//         tireId: formData.tireId,
//         truckId: truckId,
//         driverId: driverId,
//         newTreadDepth: parseFloat(formData.newTreadDepth),
//         notes: formData.notes,
//       });

//       setSuccess(true);
//       // Limpiar el formulario excepto la llanta seleccionada
//       setFormData((prev) => ({ ...prev, newTreadDepth: "", notes: "" }));

//       // Ocultar el mensaje de éxito después de 3 segundos
//       setTimeout(() => setSuccess(false), 3000);
//     } catch (err: any) {
//       setError("Hubo un error al enviar el reporte. Intenta de nuevo.");
//     } finally {
//       setSubmitting(false);
//     }
//   };

//   if (loading) {
//     return (
//       <div className="text-center py-20 text-slate-500">
//         Cargando formulario...
//       </div>
//     );
//   }

//   if (!truckId || tires.length === 0) {
//     return (
//       <div className="bg-amber-50 border border-amber-200 p-6 rounded-2xl flex flex-col items-center text-center gap-4 mt-10">
//         <AlertCircle className="w-12 h-12 text-amber-500" />
//         <div>
//           <h2 className="text-lg font-bold text-amber-900">
//             No hay neumáticos asignados
//           </h2>
//           <p className="text-sm text-amber-700 mt-2">
//             No tienes neumáticos registrados en tu vehículo actual para
//             inspeccionar.
//           </p>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="space-y-6">
//       <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
//         <div className="flex items-center gap-3 mb-6">
//           <div className="bg-blue-100 p-3 rounded-xl text-blue-600">
//             <ClipboardCheck className="w-6 h-6" />
//           </div>
//           <div>
//             <h1 className="text-xl font-bold text-slate-900">
//               Nueva Inspección
//             </h1>
//             <p className="text-slate-500 text-sm">
//               Registra el desgaste actual
//             </p>
//           </div>
//         </div>

//         {success && (
//           <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
//             <CheckCircle2 className="w-6 h-6 text-emerald-600 flex-shrink-0" />
//             <p className="text-sm font-medium text-emerald-800">
//               ¡Inspección guardada con éxito!
//             </p>
//           </div>
//         )}

//         {error && (
//           <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
//             {error}
//           </div>
//         )}

//         <form onSubmit={handleSubmit} className="space-y-5">
//           <div>
//             <label className="block text-sm font-bold text-slate-700 mb-2">
//               Selecciona el Neumático
//             </label>
//             <select
//               required
//               value={formData.tireId}
//               onChange={(e) =>
//                 setFormData({ ...formData, tireId: e.target.value })
//               }
//               className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none appearance-none"
//             >
//               {tires.map((tire) => (
//                 <option key={tire.id} value={tire.id}>
//                   {tire.position?.replace(/_/g, " ")} (SN: {tire.serialNumber})
//                 </option>
//               ))}
//             </select>
//           </div>

//           <div>
//             <label className="block text-sm font-bold text-slate-700 mb-2">
//               Desgaste Actual (mm)
//             </label>
//             <input
//               type="number"
//               step="0.1"
//               required
//               min="0"
//               max="25"
//               value={formData.newTreadDepth}
//               onChange={(e) =>
//                 setFormData({ ...formData, newTreadDepth: e.target.value })
//               }
//               className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-lg font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none"
//               placeholder="Ej: 8.5"
//             />
//           </div>

//           <div>
//             <label className="block text-sm font-bold text-slate-700 mb-2">
//               Observaciones (Opcional)
//             </label>
//             <textarea
//               rows={3}
//               value={formData.notes}
//               onChange={(e) =>
//                 setFormData({ ...formData, notes: e.target.value })
//               }
//               className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none resize-none"
//               placeholder="Ej: Corte superficial en el lado derecho..."
//             />
//           </div>

//           <button
//             type="submit"
//             disabled={submitting}
//             className="w-full py-4 text-white bg-blue-600 hover:bg-blue-700 font-bold rounded-xl shadow-md transition-all disabled:opacity-50 text-lg mt-4"
//           >
//             {submitting ? "Guardando..." : "Enviar Reporte"}
//           </button>
//         </form>
//       </div>
//     </div>
//   );
// }

import React from "react";

export default function InspectionPage() {
  return <div>InspectionPage</div>;
}
