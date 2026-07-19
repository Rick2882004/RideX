"use client";

import { Polyline } from "react-leaflet";
import { useRide } from "@/context/RideContext";

export default function RoutePolyline() {
  const { route, rideStatus, driverLocation, travelledRouteIndex } = useRide();

  if (!route) return null;

  // Full original positions
  const fullPositions = route.coordinates.map(
    ([lng, lat]) => [lat, lng] as [number, number]
  );

  // If en-route (tripStarted) and we have driver location, split the route
  if (rideStatus === "tripStarted" && driverLocation && travelledRouteIndex >= 0) {
    // Travelled route: From index 0 up to travelledRouteIndex, plus driver's current position
    const travelledPositions = [
      ...fullPositions.slice(0, travelledRouteIndex + 1),
      [driverLocation.lat, driverLocation.lng] as [number, number],
    ];

    // Remaining route: Driver's current position, plus index travelledRouteIndex + 1 to end
    const remainingPositions = [
      [driverLocation.lat, driverLocation.lng] as [number, number],
      ...fullPositions.slice(travelledRouteIndex + 1),
    ];

    return (
      <>
        {travelledPositions.length > 1 && (
          <Polyline
            positions={travelledPositions}
            pathOptions={{
              color: "#6b7280", // Slate gray for travelled route
              weight: 6,
              opacity: 0.8,
            }}
          />
        )}
        {remainingPositions.length > 1 && (
          <Polyline
            positions={remainingPositions}
            pathOptions={{
              color: "#7c3aed", // Original purple for remaining route
              weight: 6,
            }}
          />
        )}
      </>
    );
  }

  // Fallback: render the entire original polyline in purple
  return (
    <Polyline
      positions={fullPositions}
      pathOptions={{
        color: "#7c3aed",
        weight: 6,
      }}
    />
  );
}