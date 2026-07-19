import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    const where: any = {};
    if (status) where.status = status;

    const drivers = await prisma.driver.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        vehicle: true,
      },
    });

    return NextResponse.json({
      success: true,
      drivers,
    });
  } catch (error) {
    console.error("Get drivers error:", error);
    return NextResponse.json(
      { error: "Server Error" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { driverId, userId, status, currentLat, currentLng, licenseNumber, vehicleId } = body;

    const targetId = driverId || userId;
    if (!targetId) {
      return NextResponse.json(
        { error: "driverId or userId is required" },
        { status: 400 }
      );
    }

    let driverProfile = await prisma.driver.findFirst({
      where: driverId ? { id: driverId } : { userId: userId },
    });

    if (!driverProfile) {
      if (!userId || !licenseNumber) {
        return NextResponse.json(
          { error: "Driver profile not found. To create one, provide userId and licenseNumber" },
          { status: 404 }
        );
      }
      driverProfile = await prisma.driver.create({
        data: {
          userId,
          licenseNumber,
          status: status || "AVAILABLE",
          currentLat: currentLat ? parseFloat(currentLat) : null,
          currentLng: currentLng ? parseFloat(currentLng) : null,
          vehicleId,
        },
      });
    } else {
      const dataToUpdate: any = {};
      if (status !== undefined) dataToUpdate.status = status;
      if (currentLat !== undefined) dataToUpdate.currentLat = parseFloat(currentLat);
      if (currentLng !== undefined) dataToUpdate.currentLng = parseFloat(currentLng);
      if (licenseNumber !== undefined) dataToUpdate.licenseNumber = licenseNumber;
      if (vehicleId !== undefined) dataToUpdate.vehicleId = vehicleId;

      driverProfile = await prisma.driver.update({
        where: { id: driverProfile.id },
        data: dataToUpdate,
      });
    }

    return NextResponse.json({
      success: true,
      driver: driverProfile,
    });
  } catch (error) {
    console.error("Update driver profile error:", error);
    return NextResponse.json(
      { error: "Server Error" },
      { status: 500 }
    );
  }
}
