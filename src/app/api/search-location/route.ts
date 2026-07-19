import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("q");

  if (!query) {
    return NextResponse.json([]);
  }

  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
      query
    )}&countrycodes=in&addressdetails=1&limit=5`,
    {
      headers: {
        "User-Agent": "RideX",
      },
    }
  );

  const data = await response.json();

  return NextResponse.json(data);
}