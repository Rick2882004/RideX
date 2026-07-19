import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || session.user.role !== "DRIVER") {
      return NextResponse.json(
        { error: "Unauthorized: Access limited to drivers" },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Retrieve Driver Profile
    let driverProfile = await prisma.driver.findUnique({
      where: { userId },
      include: { vehicle: true },
    });

    // Resilient fallback: Create profile/vehicle on-demand if missing (e.g. for newly registered users)
    if (!driverProfile) {
      const tempPlate = "DRV-" + userId.substring(0, 6).toUpperCase();
      const vehicle = await prisma.vehicle.create({
        data: {
          model: "Standard Sedan",
          plateNumber: tempPlate,
          color: "Silver",
          type: "SEDAN",
        },
      });

      driverProfile = await prisma.driver.create({
        data: {
          userId,
          licenseNumber: "LIC-" + Math.floor(10000000 + Math.random() * 90000000),
          status: "AVAILABLE",
          vehicleId: vehicle.id,
        },
        include: { vehicle: true },
      });
    }

    // Calculate Average Rating
    const ratings = await prisma.rating.aggregate({
      where: { driverId: driverProfile.id },
      _avg: { rating: true },
    });
    const averageRating = ratings._avg.rating ? parseFloat(ratings._avg.rating.toFixed(1)) : 5.0;

    // Calculate Total Earnings
    const earningsAgg = await prisma.ride.aggregate({
      where: {
        driverId: userId,
        status: "COMPLETED",
      },
      _sum: { fare: true },
    });
    const totalEarnings = earningsAgg._sum.fare || 0.0;

    // Retrieve Ride History
    const rides = await prisma.ride.findMany({
      where: { driverId: userId },
      orderBy: { createdAt: "desc" },
      include: {
        rider: {
          select: { name: true, email: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      user: session.user,
      profile: driverProfile,
      averageRating,
      totalEarnings,
      rides,
    });

  } catch (error) {
    console.error("Driver Profile GET Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || session.user.role !== "DRIVER") {
      return NextResponse.json(
        { error: "Unauthorized: Access limited to drivers" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { status } = body; // AVAILABLE, OFFLINE

    if (status !== "AVAILABLE" && status !== "OFFLINE") {
      return NextResponse.json(
        { error: "Invalid status: Must be AVAILABLE or OFFLINE" },
        { status: 400 }
      );
    }

    // Update status in database
    const updatedProfile = await prisma.driver.update({
      where: { userId: session.user.id },
      data: { status },
    });

    return NextResponse.json({
      success: true,
      profile: updatedProfile,
    });

  } catch (error) {
    console.error("Driver Profile POST Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
