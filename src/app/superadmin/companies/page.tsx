// src/app/superadmin/companies/page.tsx
"use client";
import React, { useEffect, useState } from "react";
import {
  ShieldAlert,
  Plus,
  Building2,
  UserCheck,
  Key,
  Shield,
  X,
} from "lucide-react";
import {
  getAllCompanies,
  createCompanyWithAdmin,
  updateCompanyStatus,
  CompanyData,
} from "@/services/companyService";
import toast from "react-hot-toast";

export default function SuperAdminCompaniesPage() {
  const [companies, setCompanies] = useState<CompanyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Estados del Formulario de Alta
  const [businessName, setBusinessName] = useState("");
  const [ruc, setRuc] = useState("");
  const [plan, setPlan] = useState<"FREE" | "PREMIUM" | "ENTERPRISE">("FREE");
  const [adminUid, setAdminUid] = useState(""); // UID generado previamente en Firebase Auth
  const [adminEmail, setAdminEmail] = useState("");
  const [adminName, setAdminName] = useState("");

  const loadCompanies = async () => {
    setLoading(true);
    try {
      const data = await getAllCompanies();
      setCompanies(data);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCompanies();
  }, []);

  const handleToggleStatus = async (
    companyId: string,
    currentStatus: string,
  ) => {
    const nextStatus = currentStatus === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
    const confirmMsg =
      nextStatus === "SUSPENDED"
        ? "¿Está seguro de suspender esta empresa? Todos sus inspectores y administradores perderán acceso al instante."
        : "¿Reactivar el acceso para esta empresa?";

    if (window.confirm(confirmMsg)) {
      try {
        await updateCompanyStatus(companyId, nextStatus);
        toast.success(
          nextStatus === "SUSPENDED"
            ? "Empresa suspendida"
            : "Empresa reactivada",
        );
        loadCompanies();
      } catch (error: any) {
        toast.error(error.message);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessName || !ruc || !adminUid || !adminEmail || !adminName) {
      return toast.error(
        "Por favor, completa todos los campos del formulario.",
      );
    }

    const toastId = toast.loading("Registrando entorno corporativo...");
    try {
      await createCompanyWithAdmin(
        { businessName, ruc, plan },
        adminUid.trim(),
        adminEmail.trim(),
        adminName.trim(),
      );
      toast.success("Empresa e ID Administrador vinculados con éxito", {
        id: toastId,
      });
      setIsModalOpen(false);
      // Limpiar Formulario
      setBusinessName("");
      setRuc("");
      setPlan("FREE");
      setAdminUid("");
      setAdminEmail("");
      setAdminName("");
      loadCompanies();
    } catch (error: any) {
      toast.error(error.message, { id: toastId });
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* CABECERA */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900 text-white p-6 rounded-3xl shadow-xl">
        <div>
          <h1 className="text-2xl font-black flex items-center gap-2 tracking-tight">
            <Shield className="w-6 h-6 text-blue-400" /> Control Maestro SaaS
            (Multi-Empresa)
          </h1>
          <p className="text-slate-400 text-xs mt-1 font-medium">
            Alta de clientes corporativos, gestión de licencias y suspensión de
            entornos de datos.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-black uppercase text-xs tracking-wider px-4 py-3 rounded-xl transition-colors shadow-md"
        >
          <Plus className="w-4 h-4" /> Registrar Empresa
        </button>
      </div>

      {/* TABLA DE EMPRESAS CLIENTE */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-200">
                <th className="px-6 py-4 w-16">N°</th>
                <th className="px-6 py-4">Razón Social / RUC</th>
                <th className="px-6 py-4">Plan Asignado</th>
                <th className="px-6 py-4">Estado de Licencia</th>
                <th className="px-6 py-4 text-right">Control de Acceso</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm font-medium">
              {loading ? (
                <tr>
                  <td
                    colSpan={5}
                    className="p-8 text-center text-slate-500 font-bold"
                  >
                    Consultando servidores maestros...
                  </td>
                </tr>
              ) : companies.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="p-8 text-center text-slate-500 font-medium"
                  >
                    No hay empresas clientes registradas.
                  </td>
                </tr>
              ) : (
                companies.map((company, idx) => (
                  <tr
                    key={company.id}
                    className="hover:bg-slate-50/60 transition-colors"
                  >
                    <td className="px-6 py-4 font-bold text-slate-400">
                      #{idx + 1}
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-black text-slate-800 uppercase">
                        {company.businessName}
                      </p>
                      <p className="text-xs font-mono font-bold text-slate-400 mt-0.5">
                        RUC: {company.ruc}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${
                          company.plan === "ENTERPRISE"
                            ? "bg-purple-100 text-purple-700 border border-purple-200"
                            : company.plan === "PREMIUM"
                              ? "bg-blue-100 text-blue-700 border border-blue-200"
                              : "bg-slate-100 text-slate-600 border border-slate-200"
                        }`}
                      >
                        Plan {company.plan}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${
                          company.status === "ACTIVE"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-red-100 text-red-700 animate-pulse"
                        }`}
                      >
                        {company.status === "ACTIVE"
                          ? "Activo / Operando"
                          : "Acceso Suspendido"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() =>
                          handleToggleStatus(company.id!, company.status)
                        }
                        className={`text-xs font-black uppercase tracking-wider px-3 py-2 rounded-lg transition-colors border ${
                          company.status === "ACTIVE"
                            ? "bg-white border-red-200 text-red-600 hover:bg-red-50"
                            : "bg-emerald-600 border-emerald-700 text-white hover:bg-emerald-700"
                        }`}
                      >
                        {company.status === "ACTIVE"
                          ? "Suspender"
                          : "Activar Acceso"}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL DE REGISTRO */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-xl shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-5 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <h3 className="font-black text-slate-800 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-600" /> Configurar Nueva
                Empresa
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* SECCIÓN DATOS EMPRESA */}
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-black text-slate-500 uppercase mb-1">
                    Razón Social Cliente
                  </label>
                  <input
                    type="text"
                    required
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="Ej. Transportes Cruz del Sur S.A."
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-500 uppercase mb-1">
                    Número de RUC
                  </label>
                  <input
                    type="text"
                    maxLength={11}
                    required
                    value={ruc}
                    onChange={(e) => setRuc(e.target.value)}
                    placeholder="11 dígitos"
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-bold outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-500 uppercase mb-1">
                    Plan de Licencia
                  </label>
                  <select
                    value={plan}
                    onChange={(e) => setPlan(e.target.value as any)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none cursor-pointer bg-white"
                  >
                    <option value="FREE">Plan Gratuito (Free)</option>
                    <option value="PREMIUM">Plan Premium</option>
                    <option value="ENTERPRISE">Plan Enterprise</option>
                  </select>
                </div>
              </div>

              {/* SECCIÓN ADMINISTRADOR PRINCIPAL */}
              <div className="pt-4 border-t border-slate-100 space-y-3">
                <h4 className="text-xs font-black text-blue-600 uppercase tracking-widest flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4" /> Administrador Raíz de la
                  Empresa
                </h4>

                <div>
                  <label className="block text-xs font-black text-slate-500 uppercase mb-1">
                    UID de Firebase Authentication
                  </label>
                  <input
                    type="text"
                    required
                    value={adminUid}
                    onChange={(e) => setAdminUid(e.target.value)}
                    placeholder="Pega el UID generado en la consola de Auth"
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  />
                  <p className="text-[10px] text-slate-400 font-bold mt-1 flex items-center gap-1">
                    <Key className="w-3 h-3" /> Primero crea el usuario en
                    Firebase Auth y luego copia su UID aquí.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black text-slate-500 uppercase mb-1">
                      Nombre Completo
                    </label>
                    <input
                      type="text"
                      required
                      value={adminName}
                      onChange={(e) => setAdminName(e.target.value)}
                      placeholder="Ej. Juan Pérez"
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-500 uppercase mb-1">
                      Correo Electrónico
                    </label>
                    <input
                      type="email"
                      required
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                      placeholder="admin@empresa.com"
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* BOTONES ACCIÓN */}
              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors bg-slate-50 border border-slate-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 text-sm font-black text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md transition-colors uppercase tracking-wider"
                >
                  Dar de Alta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
