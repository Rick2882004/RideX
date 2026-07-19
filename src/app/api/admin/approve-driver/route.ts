import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized: Admins only" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { driverId, approved } = body;

    if (!driverId || approved === undefined) {
      return NextResponse.json(
        { error: "Driver ID and Approved status are required" },
        { status: 400 }
      );
    }

    const updatedDriver = await prisma.driver.update({
      where: { id: driverId },
      data: { approved: Boolean(approved) },
    });

    return NextResponse.json({
      success: true,
      driver: updatedDriver,
    });
  } catch (error) {
    console.error("Approve Driver API Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
