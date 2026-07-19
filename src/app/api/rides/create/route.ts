import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      riderId,
      pickupAddress,
      destinationAddress,
    } = body;

    if (
      !riderId ||
      !pickupAddress ||
      !destinationAddress
    ) {
      return NextResponse.json(
        {
          error: "All fields are required",
        },
        {
          status: 400,
        }
      );
    }

const ride = await prisma.ride.create({
  data: {
    riderId,
    pickupAddress,
    destinationAddress,
  },
});


return NextResponse.json({
  success: true,
  ride,
});

  } catch (error) {
    console.log(error);

    return NextResponse.json(
      {
        error: "Server Error",
      },
      {
        status: 500,
      }
    );
  }
}