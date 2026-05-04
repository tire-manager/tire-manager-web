import { Home, ClipboardCheck, Truck } from "lucide-react";
import Link from "next/link";

export const DriverNavbar = () => (
  <nav className="fixed bottom-0 w-full bg-white border-t flex justify-around items-center p-2 pb-6 shadow-2xl z-50">
    <Link
      href="/driver/dashboard"
      className="flex flex-col items-center p-2 text-gray-600 focus:text-blue-600"
    >
      <Home className="h-6 w-6" />
      <span className="text-xs mt-1 font-medium">Inicio</span>
    </Link>
    <Link
      href="/driver/inspection"
      className="flex flex-col items-center p-2 text-gray-600 focus:text-blue-600"
    >
      <div className="bg-blue-600 p-3 rounded-full -mt-8 shadow-lg">
        <ClipboardCheck className="h-6 w-6 text-white" />
      </div>
      <span className="text-xs mt-1 font-medium">Inspección</span>
    </Link>
    <Link
      href="/driver/my-truck"
      className="flex flex-col items-center p-2 text-gray-600 focus:text-blue-600"
    >
      <Truck className="h-6 w-6" />
      <span className="text-xs mt-1 font-medium">Mi Camión</span>
    </Link>
  </nav>
);
