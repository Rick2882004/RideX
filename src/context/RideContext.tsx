"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  ReactNode,
} from "react";
import { socket } from "@/lib/socket";

export type Location = {
  lat: number;
  lng: number;
  name?: string;
};

export type RouteInfo = {
  coordinates: [number, number][]; // [longitude, latitude] pairs
  distance: number; // in meters
  duration: number; // en route time in seconds
};

export type RideStatus =
  | "idle"
  | "searching"
  | "driverFound"
  | "driverArrived"
  | "tripStarted"
  | "rideCompleted";

type RideContextType = {
  // Ride ID tracking
  rideId: string | null;
  setRideId: (id: string | null) => void;

  // Pickup
  pickupLocation: Location | null;
  pickupAddress: string;

  // Destination
  destination: Location | null;
  destinationAddress: string;

  // Route
  route: RouteInfo | null;

  // Distance & ETA
  distance: string;
  duration: string;

  // Ride Status
  rideStatus: RideStatus;

  // Driver state
  driverLocation: Location | null;
  driverRotation: number;
  travelledRouteIndex: number;
  currentEta: string;

  // Setters
  setPickupLocation: (location: Location | null) => void;
  setPickupAddress: (address: string) => void;

  setDestination: (location: Location | null) => void;
  setDestinationAddress: (address: string) => void;

  setRoute: (route: RouteInfo | null) => void;

  setDistance: (distance: string) => void;
  setDuration: (duration: string) => void;

  setRideStatus: (status: RideStatus) => void;

  setDriverLocation: (location: Location | null) => void;
  setDriverRotation: (rotation: number) => void;
  setTravelledRouteIndex: (index: number) => void;
  setCurrentEta: (eta: string) => void;
  resetRide: () => void;
};

const RideContext = createContext<RideContextType>(
  {} as RideContextType
);

// Flat distance helper for short distances in cities (meters)
function getFlatDistance(lat1: number, lng1: number, lat2: number, lng2: number) {
  const dy = lat2 - lat1;
  const dx = (lng2 - lng1) * Math.cos(((lat1 + lat2) * Math.PI) / 360);
  return Math.sqrt(dx * dx + dy * dy) * 111320;
}

export function RideProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [rideId, setRideId] = useState<string | null>(null);

  // Pickup
  const [pickupLocation, setPickupLocation] =
    useState<Location | null>(null);

  const [pickupAddress, setPickupAddress] =
    useState("");

  // Destination
  const [destination, setDestination] =
    useState<Location | null>(null);

  const [destinationAddress, setDestinationAddress] =
    useState("");

  // Route
  const [route, setRoute] =
    useState<RouteInfo | null>(null);

  // Distance & ETA
  const [distance, setDistance] =
    useState("");

  const [duration, setDuration] =
    useState("");

  // Ride Status
  const [rideStatus, setRideStatus] =
    useState<RideStatus>("idle");

  // Driver Simulated/Socket States
  const [driverLocation, setDriverLocation] =
    useState<Location | null>(null);

  const [driverRotation, setDriverRotation] =
    useState<number>(0);

  const [travelledRouteIndex, setTravelledRouteIndex] =
    useState<number>(-1);

  const [currentEta, setCurrentEta] =
    useState<string>("");

  const driverLocationRef = useRef(driverLocation);
  useEffect(() => {
    driverLocationRef.current = driverLocation;
  }, [driverLocation]);

  // Reset helper
  const resetRide = () => {
    setRideId(null);
    setPickupLocation(null);
    setPickupAddress("");
    setDestination(null);
    setDestinationAddress("");
    setRoute(null);
    setDistance("");
    setDuration("");
    setRideStatus("idle");
    setDriverLocation(null);
    setDriverRotation(0);
    setTravelledRouteIndex(-1);
    setCurrentEta("");
  };

  // Real-Time Socket.IO Synchronization Listener
  useEffect(() => {
    if (!rideId) return;

    // Join room for this specific ride
    socket.emit("join_ride", { rideId });
    console.log(`Rider joined room for ride ID: ${rideId}`);

    const handleRideAccepted = (data: any) => {
      console.log("Socket: ride_accepted", data);
      setRideStatus("driverFound");
    };

    const handleLocationUpdated = (data: { lat: number; lng: number; rotation: number }) => {
      setDriverLocation({ lat: data.lat, lng: data.lng });
      setDriverRotation(data.rotation);

      // Dynamically calculate ETA on the fly
      if (rideStatus === "driverFound" && pickupLocation) {
        const dist = getFlatDistance(data.lat, data.lng, pickupLocation.lat, pickupLocation.lng);
        const etaMins = Math.max(1, Math.ceil(dist / 200));
        setCurrentEta(`${etaMins} mins`);
      } else if (rideStatus === "tripStarted" && destination) {
        const dist = getFlatDistance(data.lat, data.lng, destination.lat, destination.lng);
        const etaMins = Math.max(1, Math.ceil(dist / 200));
        setCurrentEta(`${etaMins} mins`);
      }
    };

    const handleTripStarted = () => {
      console.log("Socket: trip_started");
      setRideStatus("tripStarted");
    };

    const handleTripCompleted = () => {
      console.log("Socket: trip_completed");
      setRideStatus("rideCompleted");
    };

    const handleRideCancelled = () => {
      console.log("Socket: ride_cancelled");
      alert("This ride was cancelled by the driver or system.");
      resetRide();
    };

    socket.on("ride_accepted", handleRideAccepted);
    socket.on("location_updated", handleLocationUpdated);
    socket.on("trip_started", handleTripStarted);
    socket.on("trip_completed", handleTripCompleted);
    socket.on("ride_cancelled", handleRideCancelled);

    // Fallback database polling for Vercel/Production serverless environments
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/rides?rideId=${rideId}`);
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.rides && data.rides.length > 0) {
            const ride = data.rides[0];

            // 1. Sync status changes
            if (ride.status === "ACCEPTED" && rideStatus === "searching") {
              setRideStatus("driverFound");
            } else if (ride.status === "ON_THE_WAY" && (rideStatus === "searching" || rideStatus === "driverFound" || rideStatus === "driverArrived")) {
              setRideStatus("tripStarted");
            } else if (ride.status === "COMPLETED" && rideStatus !== "rideCompleted") {
              setRideStatus("rideCompleted");
            } else if (ride.status === "CANCELLED") {
              alert("This ride was cancelled by the driver or system.");
              resetRide();
              return;
            }

            // 2. Sync driver location changes
            if (ride.driver && ride.driver.driverProfile) {
              const profile = ride.driver.driverProfile;
              if (profile.currentLat !== null && profile.currentLng !== null) {
                const newLat = profile.currentLat;
                const newLng = profile.currentLng;

                // Sync rotation based on difference from previous location
                const prevLoc = driverLocationRef.current;
                if (prevLoc && (prevLoc.lat !== newLat || prevLoc.lng !== newLng)) {
                  const bearing = (Math.atan2(newLng - prevLoc.lng, newLat - prevLoc.lat) * 180) / Math.PI;
                  setDriverRotation(bearing);
                }

                setDriverLocation({ lat: newLat, lng: newLng });

                // Sync ETA & arrival transitions
                if (ride.status === "ACCEPTED" && pickupLocation) {
                  const dist = getFlatDistance(newLat, newLng, pickupLocation.lat, pickupLocation.lng);
                  if (dist < 20) {
                    setRideStatus("driverArrived");
                    setCurrentEta("Arrived");
                  } else {
                    const etaMins = Math.max(1, Math.ceil(dist / 200));
                    setCurrentEta(`${etaMins} mins`);
                  }
                } else if (ride.status === "ON_THE_WAY" && destination) {
                  const dist = getFlatDistance(newLat, newLng, destination.lat, destination.lng);
                  const etaMins = Math.max(1, Math.ceil(dist / 200));
                  setCurrentEta(`${etaMins} mins`);
                }
              }
            }
          }
        }
      } catch (err) {
        console.error("Polled ride fetch failed:", err);
      }
    }, 3000);

    return () => {
      socket.off("ride_accepted", handleRideAccepted);
      socket.off("location_updated", handleLocationUpdated);
      socket.off("trip_started", handleTripStarted);
      socket.off("trip_completed", handleTripCompleted);
      socket.off("ride_cancelled", handleRideCancelled);
      clearInterval(pollInterval);
    };
  }, [rideId, rideStatus, pickupLocation, destination]);

  return (
    <RideContext.Provider
      value={{
        rideId,
        setRideId,

        pickupLocation,
        pickupAddress,

        destination,
        destinationAddress,

        route,

        distance,
        duration,

        rideStatus,

        driverLocation,
        driverRotation,
        travelledRouteIndex,
        currentEta,

        setPickupLocation,
        setPickupAddress,

        setDestination,
        setDestinationAddress,

        setRoute,

        setDistance,
        setDuration,

        setRideStatus,

        setDriverLocation,
        setDriverRotation,
        setTravelledRouteIndex,
        setCurrentEta,
        resetRide,
      }}
    >
      {children}
    </RideContext.Provider>
  );
}

export const useRide = () => useContext(RideContext);