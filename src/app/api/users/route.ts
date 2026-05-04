// src/app/api/users/route.ts
import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/serverApp";
import { UserRole } from "@/types/user";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, displayName, role, truckId } = body;

    // 1. Validaciones básicas
    if (!email || !password || !displayName || !role) {
      return NextResponse.json(
        { error: "Missing required fields" },
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
      truckId: truckId || null,
      createdAt: Date.now(),
    };

    await adminDb.collection("users").doc(userRecord.uid).set(userProfile);

    // 4. Retornar éxito sin contraseña
    return NextResponse.json(
      {
        success: true,
        user: userProfile,
      },
      { status: 201 },
    );
  } catch (error: any) {
    console.error("Error creating user API:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 },
    );
  }
}
