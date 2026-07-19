import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { predictETA, calculateDynamicPricing, detectFraud, findSmartDriverMatch } from "@/lib/intelligence";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const riderId = searchParams.get("riderId");
    const driverId = searchParams.get("driverId");
    const status = searchParams.get("status");

    const where: any = {};
    if (riderId) where.riderId = riderId;
    if (driverId) where.driverId = driverId;
    if (status) where.status = status;

    const rides = await prisma.ride.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        rider: {
          select: { id: true, name: true, email: true },
        },
        driver: {
          include: {
            driverProfile: {
              include: {
                vehicle: true,
              },
            },
          },
        },
        payments: true,
        ratings: true,
        statusLogs: true,
      },
    });

    return NextResponse.json({
      success: true,
      rides,
    });
  } catch (error) {
    console.error("Get rides error:", error);
    return NextResponse.json(
      { error: "Server Error" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      riderId,
      pickupAddress,
      destinationAddress,
      pickupLat,
      pickupLng,
      destinationLat,
      destinationLng,
      fare,
      distance,
      duration,
      paymentMethod = "CASH",
    } = body;

    if (!riderId || !pickupAddress || !destinationAddress) {
      return NextResponse.json(
        { error: "Rider ID, Pickup Address, and Destination Address are required" },
        { status: 400 }
      );
    }

    const pLat = pickupLat ? parseFloat(pickupLat) : 22.5726;
    const pLng = pickupLng ? parseFloat(pickupLng) : 88.3639;
    const dLat = destinationLat ? parseFloat(destinationLat) : 22.5726;
    const dLng = destinationLng ? parseFloat(destinationLng) : 88.3639;
    const rawFare = fare ? parseFloat(fare) : 120;
    
    // Parse duration string like "15 mins" into minutes
    let rawDurationMins = 10;
    if (duration) {
      const match = duration.match(/\d+/);
      if (match) rawDurationMins = parseInt(match[0]);
    }

    // 1. Fetch live metrics for pricing and matching
    const [activeRides, onlineDrivers, riderPastRides] = await Promise.all([
      prisma.ride.findMany({
        where: { status: { in: ["REQUESTED", "ACCEPTED", "ON_THE_WAY"] } }
      }),
      prisma.user.findMany({
        where: { role: "DRIVER", driverProfile: { status: { in: ["AVAILABLE", "BUSY"] } } },
        include: { driverProfile: { include: { vehicle: true } } }
      }),
      prisma.ride.findMany({
        where: { riderId },
        orderBy: { createdAt: "desc" },
        take: 10
      })
    ]);

    // 2. Run Intelligent AI ETA Prediction
    const { etaSeconds, trafficFactor, weather } = predictETA(
      [pLng, pLat],
      [dLng, dLat],
      rawDurationMins * 60
    );
    const predictedDurationText = `${Math.round(etaSeconds / 60)} mins`;

    // 3. Run Intelligent Dynamic Pricing
    const demandCount = activeRides.length;
    const supplyCount = onlineDrivers.filter((d) => d.driverProfile?.status === "AVAILABLE").length;
    const { fare: finalFare, surgeMultiplier } = calculateDynamicPricing(
      rawFare,
      demandCount,
      supplyCount,
      weather
    );

    // 4. Run Intelligent Fraud Detection
    const { flagged, reason: flagReason } = detectFraud(
      riderId,
      [pLng, pLat],
      finalFare,
      paymentMethod,
      riderPastRides
    );

    // 5. Run Intelligent Smart Driver Matching
    const availableDrivers = onlineDrivers.filter(
      (d) => d.driverProfile?.status === "AVAILABLE" && d.driverProfile?.approved === true
    );
    const matchedDriver = findSmartDriverMatch(pLat, pLng, availableDrivers);

    // Transactional write
    const ride = await prisma.$transaction(async (tx) => {
      const createdRide = await tx.ride.create({
        data: {
          riderId,
          pickupAddress,
          destinationAddress,
          pickupLat: pLat,
          pickupLng: pLng,
          destinationLat: dLat,
          destinationLng: dLng,
          fare: finalFare,
          distance,
          duration: predictedDurationText,
          status: "REQUESTED",
          driverId: matchedDriver ? matchedDriver.id : null,
          surgeMultiplier,
          flagged,
          flagReason,
          trafficFactor,
          weather,
        },
      });

      await tx.rideStatus.create({
        data: {
          rideId: createdRide.id,
          status: "REQUESTED",
        },
      });

      return createdRide;
    });

    return NextResponse.json({
      success: true,
      ride,
    });
  } catch (error) {
    console.error("Create ride error:", error);
    return NextResponse.json(
      { error: "Server Error" },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { rideId, driverId, status, fare, distance, duration, rating, comment, raterId } = body;

    if (!rideId) {
      return NextResponse.json(
        { error: "Ride ID is required" },
        { status: 400 }
      );
    }

    const currentRide = await prisma.ride.findUnique({
      where: { id: rideId },
    });

    if (!currentRide) {
      return NextResponse.json(
        { error: "Ride not found" },
        { status: 404 }
      );
    }

    const dataToUpdate: any = {};
    if (driverId !== undefined) dataToUpdate.driverId = driverId;
    if (status !== undefined) dataToUpdate.status = status;
    if (fare !== undefined) dataToUpdate.fare = parseFloat(fare);
    if (distance !== undefined) dataToUpdate.distance = distance;
    if (duration !== undefined) dataToUpdate.duration = duration;

    const updatedRide = await prisma.$transaction(async (tx) => {
      const updated = await tx.ride.update({
        where: { id: rideId },
        data: dataToUpdate,
        include: {
          rider: { select: { id: true, name: true, email: true } },
          driver: {
            include: {
              driverProfile: {
                include: {
                  vehicle: true,
                },
              },
            },
          },
        },
      });

      if (status !== undefined && status !== currentRide.status) {
        await tx.rideStatus.create({
          data: {
            rideId,
            status,
          },
        });
      }

      if (rating !== undefined && raterId !== undefined) {
        const driverUserId = driverId || currentRide.driverId || updated.driverId;
        if (driverUserId) {
          const driverProfile = await tx.driver.findUnique({
            where: { userId: driverUserId },
          });
          if (driverProfile) {
            await tx.rating.create({
              data: {
                rideId,
                raterId,
                driverId: driverProfile.id,
                rating: parseInt(rating),
                comment: comment || "",
              },
            });
          }
        }
      }

      return updated;
    });

    return NextResponse.json({
      success: true,
      ride: updatedRide,
    });
  } catch (error) {
    console.error("Update ride error:", error);
    return NextResponse.json(
      { error: "Server Error" },
      { status: 500 }
    );
  }
}
