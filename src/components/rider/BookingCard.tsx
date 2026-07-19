"use client";

import { useState, useEffect } from "react";
import { Navigation, MapPinned, Clock3, Route, IndianRupee, Home, Briefcase, Calendar, Check, Search, Car, HelpCircle } from "lucide-react";
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
    activeRide,

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

  // Scheduled Ride State
  const [isScheduling, setIsScheduling] = useState(false);
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("");
  const [scheduledSuccess, setScheduledSuccess] = useState(false);

  // Vehicle type filters
  const [vehicleClass, setVehicleClass] = useState<"MINI" | "SEDAN" | "SUV">("SEDAN");
  const [hasAC, setHasAC] = useState(true);

  // Recent searches tracking
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("recent_searches");
      if (stored) setRecentSearches(JSON.parse(stored));
    }
  }, []);

  const addSearchToHistory = (name: string) => {
    if (!name || name.trim() === "") return;
    setRecentSearches((prev) => {
      const filtered = prev.filter((item) => item !== name);
      const updated = [name, ...filtered].slice(0, 3); // Keep top 3 searches
      localStorage.setItem("recent_searches", JSON.stringify(updated));
      return updated;
    });
  };

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
      const coordinates = feature.geometry.coordinates as [number, number][];
      const totalDistance = feature.properties.summary.distance;
      const totalDuration = feature.properties.summary.duration;

      setRoute({
        coordinates,
        distance: totalDistance,
        duration: totalDuration,
      });

      setDistance((totalDistance / 1000).toFixed(1) + " km");
      setDuration(Math.ceil(totalDuration / 60) + " mins");

      // Save search locations to history
      if (pickupLocation.name) addSearchToHistory(pickupLocation.name);
      if (destination.name) addSearchToHistory(destination.name);

      // Base local fare calculation
      const baseDistance = totalDistance / 1000;
      let multiplier = 15; // SEDAN default
      if (vehicleClass === "MINI") multiplier = 12;
      if (vehicleClass === "SUV") multiplier = 22;
      
      const estimatedFare = 60 + baseDistance * multiplier + (hasAC ? 20 : 0);
      setFare(Math.round(estimatedFare));

    } catch (err) {
      console.error("Routing error:", err);
      alert("Failed to calculate routing path. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const handleShortcutClick = (type: "home" | "work", input: "pickup" | "dest") => {
    const saltLake = { lat: 22.5726, lng: 88.3639, name: "Home (Salt Lake, Kolkata)" };
    const sectorV = { lat: 22.5800, lng: 88.4300, name: "Work (Sector V, Kolkata)" };
    const target = type === "home" ? saltLake : sectorV;

    if (input === "pickup") {
      setPickupLocation(target);
      setPickupAddress(target.name);
    } else {
      setDestination(target);
      setDestinationAddress(target.name);
    }
  };

  const handleScheduleConfirm = () => {
    if (!scheduleDate || !scheduleTime) {
      alert("Please specify scheduled date and time");
      return;
    }
    setScheduledSuccess(true);
    setTimeout(() => {
      setScheduledSuccess(false);
      setIsScheduling(false);
    }, 2500);
  };

  // Active ride view
  if (rideStatus !== "idle") {
    const displayDistance = activeRide?.distance || distance || "N/A";
    const displayDuration = activeRide?.duration || duration || "N/A";
    const displayFare = activeRide?.fare !== undefined ? activeRide.fare : fare || "N/A";

    return (
      <div className="rounded-[35px] border border-white/10 glass-panel p-8 animate-scale-in text-white mobile-floating-card">
        <h2 className="mb-6 text-2xl lg:text-3xl font-black tracking-tight flex items-center gap-3">
          <Car size={24} className="text-cyan-400 animate-pulse" /> Active Trip Details
        </h2>

        <div className="relative pl-6 border-l border-dashed border-white/20 space-y-6">
          {/* Pickup Node */}
          <div className="absolute -left-[6px] top-1.5 h-3 w-3 rounded-full bg-cyan-400 border-2 border-black shadow-[0_0_10px_rgba(34,211,238,0.8)]"></div>
          <div>
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Pickup point</span>
            <p className="text-sm font-semibold text-white leading-snug mt-1 max-h-12 overflow-hidden truncate">
              {pickupLocation?.name || pickupAddress || "Your Location"}
            </p>
          </div>

          {/* Destination Node */}
          <div className="absolute -left-[6px] bottom-1 h-3 w-3 rounded-full bg-pink-500 border-2 border-black shadow-[0_0_10px_rgba(236,72,153,0.8)]"></div>
          <div>
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Destination point</span>
            <p className="text-sm font-semibold text-white leading-snug mt-1 max-h-12 overflow-hidden truncate">
              {destination?.name || destinationAddress || "Destination Location"}
            </p>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-white/10 space-y-3">
          <div className="flex items-center justify-between text-sm text-gray-300">
            <span className="flex items-center gap-2 text-gray-400">
              <Route size={16} className="text-cyan-400" /> Distance
            </span>
            <span className="font-bold text-white">{displayDistance}</span>
          </div>

          <div className="flex items-center justify-between text-sm text-gray-300">
            <span className="flex items-center gap-2 text-gray-400">
              <Clock3 size={16} className="text-purple-400" /> Est. Time
            </span>
            <span className="font-bold text-white">{displayDuration}</span>
          </div>

          <div className="flex items-center justify-between border-t border-white/10 pt-4 mt-2">
            <span className="flex items-center gap-2 text-gray-300 font-bold">
              <IndianRupee size={18} className="text-cyan-400" /> Total Fare
            </span>
            <span className="text-2xl font-black text-cyan-400">₹{displayFare}</span>
          </div>
        </div>
      </div>
    );
  }

  // Idle booking view
  return (
    <div className="rounded-[35px] border border-white/10 glass-panel p-8 text-white mobile-floating-card relative">
      <h2 className="mb-6 text-3xl font-black tracking-tight flex items-center justify-between">
        <span>Book a Ride</span>
        <button
          onClick={() => setIsScheduling(!isScheduling)}
          className="text-xs bg-white/5 border border-white/5 px-3 py-2 rounded-xl text-cyan-400 hover:bg-white/10 font-bold flex items-center gap-1.5 transition cursor-pointer"
        >
          <Calendar size={14} /> {isScheduling ? "Cancel" : "Schedule"}
        </button>
      </h2>

      {/* Scheduling Sub-Panel */}
      {isScheduling && (
        <div className="mb-6 border border-cyan-500/20 bg-cyan-500/5 rounded-2xl p-4 space-y-4 animate-scale-in">
          <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider">Schedule Pickup Info</h4>
          {scheduledSuccess ? (
            <p className="text-xs text-green-400 font-bold flex items-center gap-1.5 animate-pulse bg-green-500/5 p-3 rounded-xl border border-green-500/10">
              <Check size={14} /> Ride Scheduled Successfully!
            </p>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-gray-400 block mb-1">Pickup Date</label>
                  <input
                    type="date"
                    value={scheduleDate}
                    onChange={(e) => setScheduleDate(e.target.value)}
                    className="w-full text-xs rounded-lg bg-black border border-white/10 p-2 text-white outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-gray-400 block mb-1">Pickup Time</label>
                  <input
                    type="time"
                    value={scheduleTime}
                    onChange={(e) => setScheduleTime(e.target.value)}
                    className="w-full text-xs rounded-lg bg-black border border-white/10 p-2 text-white outline-none"
                  />
                </div>
              </div>
              <button
                onClick={handleScheduleConfirm}
                className="w-full py-2.5 rounded-xl bg-cyan-500 text-black font-bold text-xs hover:opacity-90 transition cursor-pointer"
              >
                Confirm Scheduling
              </button>
            </div>
          )}
        </div>
      )}

      {/* Location inputs */}
      <div className="space-y-4">
        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Pickup Point</span>
            <div className="flex gap-2">
              <button onClick={() => handleShortcutClick("home", "pickup")} className="text-[10px] text-cyan-400 hover:underline flex items-center gap-0.5"><Home size={10} /> Home</button>
              <button onClick={() => handleShortcutClick("work", "pickup")} className="text-[10px] text-cyan-400 hover:underline flex items-center gap-0.5"><Briefcase size={10} /> Work</button>
            </div>
          </div>
          <SearchInput
            placeholder="Pickup Location"
            value={pickupAddress}
            icon={<Navigation className="text-cyan-400" size={20} />}
            onSelect={(location) => {
              setPickupLocation(location);
              setPickupAddress(location.name);
            }}
          />
        </div>

        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Destination</span>
            <div className="flex gap-2">
              <button onClick={() => handleShortcutClick("home", "dest")} className="text-[10px] text-pink-500 hover:underline flex items-center gap-0.5"><Home size={10} /> Home</button>
              <button onClick={() => handleShortcutClick("work", "dest")} className="text-[10px] text-pink-500 hover:underline flex items-center gap-0.5"><Briefcase size={10} /> Work</button>
            </div>
          </div>
          <SearchInput
            placeholder="Destination Address"
            value={destinationAddress}
            icon={<MapPinned className="text-pink-500" size={20} />}
            onSelect={(location) => {
              setDestination(location);
              setDestinationAddress(location.name);
            }}
          />
        </div>
      </div>

      {/* Recent history list tags */}
      {recentSearches.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2 items-center">
          <span className="text-[9px] text-gray-500 uppercase tracking-widest font-bold flex items-center gap-1"><Search size={10} /> Recents:</span>
          {recentSearches.map((name, idx) => (
            <button
              key={idx}
              onClick={() => {
                setDestinationAddress(name);
                // Locate coords mock based on Salt Lake fallback
                setDestination({ lat: 22.5800, lng: 88.4300, name });
              }}
              className="text-[10px] max-w-[120px] truncate bg-white/5 border border-white/5 px-2 py-1 rounded-lg text-gray-400 hover:text-white transition cursor-pointer"
            >
              {name}
            </button>
          ))}
        </div>
      )}

      {/* Vehicle class and preference filters */}
      <div className="mt-6 border-t border-white/5 pt-4">
        <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider block mb-3">Vehicle Preferences</span>
        
        <div className="grid grid-cols-3 gap-2">
          {[
            { id: "MINI", label: "Mini", icon: "🚗" },
            { id: "SEDAN", label: "Sedan", icon: "🚙" },
            { id: "SUV", label: "SUV", icon: "🚐" }
          ].map((v) => (
            <button
              key={v.id}
              onClick={() => setVehicleClass(v.id as any)}
              className={`py-3 rounded-2xl border text-xs font-bold transition-all flex flex-col items-center gap-1.5 cursor-pointer
                ${vehicleClass === v.id 
                  ? "border-cyan-400 bg-cyan-500/10 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.15)]" 
                  : "border-white/5 bg-[#1b1b1b]/50 text-gray-400 hover:border-white/20"
                }`}
            >
              <span className="text-xl">{v.icon}</span>
              <span>{v.label}</span>
            </button>
          ))}
        </div>

        <div className="mt-4 flex items-center justify-between p-3.5 rounded-xl bg-white/5 border border-white/5 text-xs text-gray-400">
          <span className="font-semibold flex items-center gap-1.5"><HelpCircle size={14} /> Air Conditioning (AC)</span>
          <button
            onClick={() => setHasAC(!hasAC)}
            className={`px-4 py-1.5 rounded-lg font-bold transition cursor-pointer ${hasAC ? "bg-cyan-500 text-black shadow-[0_0_8px_rgba(6,182,212,0.3)]" : "bg-white/10 text-gray-400"}`}
          >
            {hasAC ? "AC Active" : "Non-AC"}
          </button>
        </div>
      </div>

      {/* Action Button */}
      <button
        onClick={findDrivers}
        disabled={loading || !pickupLocation || !destination}
        className="mt-6 w-full h-14 rounded-2xl bg-gradient-to-r from-purple-600 to-cyan-500 font-bold text-white transition hover:scale-[1.02] active:scale-[0.98] cursor-pointer disabled:opacity-30 disabled:pointer-events-none hover:shadow-[0_0_20px_rgba(168,85,247,0.3)] flex items-center justify-center gap-2"
      >
        {loading ? "Calculating Route..." : "Estimate Fare"}
      </button>
    </div>
  );
}