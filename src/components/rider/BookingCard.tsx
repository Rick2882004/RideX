"use client";

import { useState } from "react";
import { Navigation, MapPinned, Clock3, Route, IndianRupee } from "lucide-react";

import SearchInput from "./SearchInput";
import { useRide } from "@/context/RideContext";
import { getRoute } from "@/lib/route";

export default function BookingCard() {
  const {
    pickupLocation,
    destination,
    pickupAddress,
    destinationAddress,
    distance,
    duration,
    rideStatus,

    setPickupLocation,
    setPickupAddress,
    setDestination,
    setDestinationAddress,

    setRoute,
    setDistance,
    setDuration,
  } = useRide();

  const [loading, setLoading] = useState(false);
  const [fare, setFare] = useState<number | null>(null);

  async function findDrivers() {
    if (!pickupLocation || !destination) {
      alert("Please select pickup & destination");
      return;
    }

    try {
      setLoading(true);

      const data = await getRoute(
        [pickupLocation.lng, pickupLocation.lat],
        [destination.lng, destination.lat]
      );

      const feature = data.features[0];

      setRoute({
        coordinates:
          feature.geometry.coordinates as [number, number][],
        distance: feature.properties.summary.distance,
        duration: feature.properties.summary.duration,
      });

      const totalDistance =
        feature.properties.summary.distance;

      const totalDuration =
        feature.properties.summary.duration;

      setDistance(
        (totalDistance / 1000).toFixed(1) + " km"
      );

      setDuration(
        Math.ceil(totalDuration / 60) + " mins"
      );

      // Base Fare Calculation
      const estimatedFare =
        60 + (totalDistance / 1000) * 15;

      setFare(Math.round(estimatedFare));
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  }

  // Active simulation view
  if (rideStatus !== "idle") {
    const km = distance ? parseFloat(distance) : 0;
    const baseFare = Math.round(60 + km * 15);

    return (
      <div className="rounded-[35px] border border-white/10 bg-[#111] p-8">
        <h2 className="mb-6 text-3xl font-bold text-white tracking-tight">
          Trip Details
        </h2>

        <div className="relative pl-6 border-l border-dashed border-white/20 space-y-6">
          {/* Dotted lines for pickup and destination */}
          <div className="absolute -left-[6px] top-1 h-3 w-3 rounded-full bg-cyan-400 border border-black shadow-[0_0_8px_rgba(34,211,238,0.6)]"></div>
          <div>
            <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">Pickup</span>
            <p className="text-sm font-semibold text-white line-clamp-2 mt-0.5">
              {pickupLocation?.name || pickupAddress || "Your Location"}
            </p>
          </div>

          <div className="absolute -left-[6px] bottom-1 h-3 w-3 rounded-full bg-pink-500 border border-black shadow-[0_0_8px_rgba(236,72,153,0.6)]"></div>
          <div>
            <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">Destination</span>
            <p className="text-sm font-semibold text-white line-clamp-2 mt-0.5">
              {destination?.name || destinationAddress || "Destination Location"}
            </p>
          </div>
        </div>

        {distance && (
          <div className="mt-8 pt-6 border-t border-white/10 space-y-3">
            <div className="flex items-center justify-between text-sm text-gray-400">
              <span className="flex items-center gap-2">
                <Route size={16} />
                Distance
              </span>
              <span className="font-semibold text-white">{distance}</span>
            </div>

            <div className="flex items-center justify-between text-sm text-gray-400">
              <span className="flex items-center gap-2">
                <Clock3 size={16} />
                Est. Time
              </span>
              <span className="font-semibold text-white">{duration}</span>
            </div>

            <div className="flex items-center justify-between border-t border-white/5 pt-3 mt-1 text-sm text-gray-400">
              <span className="flex items-center gap-2 text-gray-300">
                <IndianRupee size={16} />
                Est. Fare
              </span>
              <span className="text-lg font-bold text-cyan-400">₹{baseFare}</span>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Idle booking view
  return (
    <div className="rounded-[35px] border border-white/10 bg-[#111] p-8">
      <h2 className="mb-8 text-5xl font-bold text-white">
        Book a Ride
      </h2>

      <SearchInput
        placeholder="Pickup Location"
        icon={
          <Navigation
            className="text-cyan-400"
            size={22}
          />
        }
        onSelect={(location) => {
          setPickupLocation(location);
          setPickupAddress(location.name);
        }}
      />

      <SearchInput
        placeholder="Destination"
        icon={
          <MapPinned
            className="text-pink-500"
            size={22}
          />
        }
        onSelect={(location) => {
          setDestination(location);
          setDestinationAddress(location.name);
        }}
      />

      {distance && (
        <div className="mb-6 space-y-3 rounded-2xl border border-white/10 bg-[#1b1b1b] p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-gray-300">
              <Route size={18} />
              Distance
            </div>

            <span className="font-semibold text-white">
              {distance}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-gray-300">
              <Clock3 size={18} />
              ETA
            </div>

            <span className="font-semibold text-white">
              {duration}
            </span>
          </div>

          {fare && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-gray-300">
                <IndianRupee size={18} />
                Estimated Fare
              </div>

              <span className="text-xl font-bold text-cyan-400">
                ₹{fare}
              </span>
            </div>
          )}
        </div>
      )}

      <button
        onClick={findDrivers}
        disabled={loading}
        className="h-16 w-full rounded-2xl bg-gradient-to-r from-purple-600 to-cyan-500 text-xl font-bold text-white transition-all hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-70"
      >
        {loading
          ? "Searching Drivers..."
          : "Find Drivers"}
      </button>
    </div>
  );
}