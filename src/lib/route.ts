export async function getRoute(
  start: [number, number],
  end: [number, number]
) {
  const apiKey =
    process.env.NEXT_PUBLIC_ORS_API_KEY;

  const res = await fetch(
    "https://api.openrouteservice.org/v2/directions/driving-car/geojson",
    {
      method: "POST",
      headers: {
        Authorization: apiKey!,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        coordinates: [start, end],
      }),
    }
  );

  if (!res.ok) {
    throw new Error("Failed to fetch route");
  }

  return res.json();
}