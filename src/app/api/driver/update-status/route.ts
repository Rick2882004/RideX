import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const { rideId, status } = body;

    if (!rideId || !status) {
      return NextResponse.json(
        { error: "Ride ID and Status are required" },
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

    const updatedRide = await prisma.ride.update({
      where: {
        id: rideId,
      },
      data: {
        status,
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