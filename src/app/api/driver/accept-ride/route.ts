import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const { rideId, driverId } = body;

    if (!rideId || !driverId) {
      return NextResponse.json(
        { error: "Ride ID and Driver ID are required" },
        { status: 400 }
      );
    }

    const ride = await prisma.ride.findUnique({
      where: {
        id: rideId,
      },
    });

    if (!ride) {
      return NextResponse.json(
        { error: "Ride not found" },
        { status: 404 }
      );
    }

    if (ride.status !== "REQUESTED") {
      return NextResponse.json(
        { error: "Ride already accepted" },
        { status: 400 }
      );
    }

    const updatedRide = await prisma.ride.update({
      where: {
        id: rideId,
      },
      data: {
        driverId,
        status: "ACCEPTED",
      },
      include: {
        rider: true,
        driver: true,
      },
    });

    return NextResponse.json({
      success: true,
      ride: updatedRide,
    });

  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Server Error" },
      { status: 500 }
    );
  }
}