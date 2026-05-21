// src/app/(auth)/login/page.tsx
"use client";
import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase/clientApp";
import { useRouter } from "next/navigation";
import { getUserProfile } from "@/services/userService";
import { Truck } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("gsinuiri@gmail.com");
  const [password, setPassword] = useState("123456");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password,
      );
      const profile = await getUserProfile(userCredential.user.uid);
      console.log("Perfil obtenido tras login:", profile); // <-- Debugging

      // Guardamos tokens en cookies para que el Middleware de Next.js las lea
      const token = await userCredential.user.getIdToken();
      document.cookie = `firebaseToken=${token}; path=/; max-age=86400; SameSite=Strict`;

      if (profile) {
        document.cookie = `userRole=${profile.role}; path=/; max-age=86400; SameSite=Strict`;
      }

      // REDIRECCIÓN BASADA EN EL ROL
      if (profile?.role === "SUPERADMIN") {
        router.push("/superadmin/companies");
      } else if (profile?.role === "ADMIN") {
        router.push("/admin/dashboard");
      } else if (profile?.role === "INSPECTOR") {
        // Redirigimos a la app móvil del inspector
        router.push("/inspector");
      }
    } catch (err) {
      console.error(err);
      setError("Credenciales incorrectas. Verifica tu correo y contraseña.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-6">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-100 p-8 overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-2 bg-blue-600"></div>

        <div className="flex flex-col items-center mb-8">
          <div className="bg-blue-100 p-4 rounded-full mb-4">
            <Truck className="h-8 w-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 text-center tracking-tight">
            TireManager
          </h1>
          <p className="text-slate-500 text-sm mt-1 font-medium">
            Control inteligente de flota
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">
              Usuario / Correo
            </label>
            <input
              type="email"
              required
              className="block w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-base text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium"
              placeholder="chofer@flota.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">
              Contraseña
            </label>
            <input
              type="password"
              required
              className="block w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-base text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100 text-center font-bold">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-4 text-white font-black rounded-xl text-base shadow-lg transition-all flex justify-center items-center gap-2 ${
              loading
                ? "bg-blue-400 cursor-wait"
                : "bg-blue-600 hover:bg-blue-700 active:scale-[0.98]"
            }`}
          >
            {loading ? "Iniciando..." : "Ingresar al Sistema"}
          </button>
        </form>
      </div>
    </div>
  );
}
