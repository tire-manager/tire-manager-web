// src/app/api/users/route.ts
import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/serverApp";
import { UserRole } from "@/types/user";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    // <-- Agregamos 'companyId' a la desestructuración y quitamos 'truckId'
    const { email, password, displayName, role, status, companyId } = body;

    // 1. Validaciones básicas estrictas (SaaS)
    if (!email || !password || !displayName || !role || !companyId) {
      return NextResponse.json(
        {
          error:
            "Faltan campos requeridos (email, contraseña, nombre, rol o empresa)",
        },
        { status: 400 },
      );
    }

    // 2. Crear usuario en Firebase Auth usando Admin SDK
    const userRecord = await adminAuth.createUser({
      email,
      password,
      displayName,
    });

    // 3. Crear el perfil en la colección "users" de Firestore
    const userProfile = {
      uid: userRecord.uid,
      email: userRecord.email,
      displayName: userRecord.displayName,
      role: role as UserRole,
      status: status || "ACTIVE",
      companyId: companyId, // <-- MAGIA SAAS: El usuario queda blindado a su empresa
      createdAt: Date.now(),
    };

    await adminDb.collection("users").doc(userRecord.uid).set(userProfile);

    // 4. Retornar éxito
    return NextResponse.json(
      {
        success: true,
        user: userProfile,
      },
      { status: 201 },
    );
  } catch (error: any) {
    console.error("Error creating user API:", error);

    // <-- MANEJO DE ERRORES AMIGABLE PARA LA INTERFAZ -->
    let errorMessage =
      "Error interno del servidor. Verifica la terminal de Next.js.";

    if (error.code === "auth/email-already-exists") {
      errorMessage = "Este correo electrónico ya está registrado.";
    } else if (error.code === "auth/invalid-password") {
      errorMessage = "La contraseña debe tener al menos 6 caracteres.";
    } else if (error.message) {
      errorMessage = error.message;
    }

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
