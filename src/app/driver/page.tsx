"use client";

import { useState, useEffect, useRef } from "react";
import { Bell, Menu, UserCircle2, Star, DollarSign, Car, Eye, MapPin, Check, X, ArrowRight, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useRide } from "@/context/RideContext";
import { getRoute } from "@/lib/route";
import { socket } from "@/lib/socket";
import Map from "@/components/rider/Map";
import axios from "axios";

// Flat distance helper
function getFlatDistance(lat1: number, lng1: number, lat2: number, lng2: number) {
  const dy = lat2 - lat1;
  const dx = (lng2 - lng1) * Math.cos(((lat1 + lat2) * Math.PI) / 360);
  return Math.sqrt(dx * dx + dy * dy) * 111320;
}

export default function DriverPage() {
  const router = useRouter();
  const {
    setPickupLocation,
    setDestination,
    setPickupAddress,
    setDestinationAddress,
    setRoute,
    setDistance,
    setDuration,
    setRideStatus,
    resetRide,
  } = useRide();

  // Driver states
  const [driver, setDriver] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [status, setStatus] = useState("OFFLINE");
  const [averageRating, setAverageRating] = useState(5.0);
  const [totalEarnings, setTotalEarnings] = useState(0.0);
  const [rideHistory, setRideHistory] = useState<any[]>([]);

  // Ride queue & current ride
  const [availableRides, setAvailableRides] = useState<any[]>([]);
  const [rejectedRideIds, setRejectedRideIds] = useState<string[]>([]);
  const [currentRide, setCurrentRide] = useState<any>(null);

  // App UI states
  const [loading, setLoading] = useState(true);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [statusUpdating, setStatusUpdating] = useState(false);

  // Refs for tracking active simulation timers
  const simIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const simTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch driver profile statistics
  const fetchProfile = async () => {
    try {
      const res = await axios.get("/api/driver/profile");
      if (res.data.success) {
        setDriver(res.data.user);
        setProfile(res.data.profile);
        setStatus(res.data.profile.status);
        setAverageRating(res.data.averageRating);
        setTotalEarnings(res.data.totalEarnings);
        setRideHistory(res.data.rides);

        // Recover active ride if any exists in database
        const activeRide = res.data.rides.find(
          (r: any) => r.status === "ACCEPTED" || r.status === "ON_THE_WAY"
        );
        if (activeRide && !currentRide) {
          setupCurrentRideMap(activeRide);
        }
      }
    } catch (error) {
      console.error("Failed to load driver profile:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  // Connect socket and handle connection status
  useEffect(() => {
    if (!socket.connected) {
      socket.connect();
    }

    if (status === "AVAILABLE" && driver) {
      socket.emit("join_drivers");
      console.log("Socket: Joined drivers channel");
    }

    // Listen to real-time requested rides
    const handleRideRequested = (ride: any) => {
      if (status === "AVAILABLE" && !currentRide && !rejectedRideIds.includes(ride.id)) {
        setAvailableRides((prev) => {
          if (prev.some((r) => r.id === ride.id)) return prev;
          return [ride, ...prev];
        });
      }
    };

    socket.on("ride_requested", handleRideRequested);

    return () => {
      socket.off("ride_requested", handleRideRequested);
    };
  }, [status, currentRide, rejectedRideIds, driver]);

  // Clean simulation timers on unmount
  useEffect(() => {
    return () => {
      if (simIntervalRef.current) clearInterval(simIntervalRef.current);
      if (simTimeoutRef.current) clearTimeout(simTimeoutRef.current);
    };
  }, []);

  const handleSignOut = async () => {
    try {
      if (simIntervalRef.current) clearInterval(simIntervalRef.current);
      await authClient.signOut();
      localStorage.removeItem("user");
      resetRide();
      router.push("/login");
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  // Toggle online/offline status in database
  const toggleStatus = async () => {
    const nextStatus = status === "AVAILABLE" ? "OFFLINE" : "AVAILABLE";
    try {
      setStatusUpdating(true);
      const res = await axios.post("/api/driver/profile", { status: nextStatus });
      if (res.data.success) {
        setStatus(nextStatus);
        if (nextStatus === "OFFLINE") {
          setAvailableRides([]);
        } else if (driver) {
          socket.emit("join_drivers");
        }
      }
    } catch (error) {
      console.error("Failed to update status:", error);
      alert("Error updating status.");
    } finally {
      setStatusUpdating(false);
    }
  };

  // Helper to load current ride coordinates onto the Leaflet Map
  const setupCurrentRideMap = async (ride: any) => {
    setCurrentRide(ride);
    setPickupLocation({ lat: ride.pickupLat, lng: ride.pickupLng });
    setDestination({ lat: ride.destinationLat, lng: ride.destinationLng });
    setPickupAddress(ride.pickupAddress);
    setDestinationAddress(ride.destinationAddress);

    if (ride.status === "ACCEPTED") {
      setRideStatus("driverFound");
    } else if (ride.status === "ON_THE_WAY") {
      setRideStatus("tripStarted");
    }

    // Join room for this specific ride
    socket.emit("join_ride", { rideId: ride.id });

    // Retrieve and draw routing polyline
    try {
      const data = await getRoute(
        [ride.pickupLng, ride.pickupLat],
        [ride.destinationLng, ride.destinationLat]
      );
      const feature = data.features[0];
      const coordinates = feature.geometry.coordinates as [number, number][];
      const distanceVal = feature.properties.summary.distance;
      const durationVal = feature.properties.summary.duration;

      setRoute({
        coordinates,
        distance: distanceVal,
        duration: durationVal,
      });
      setDistance((distanceVal / 1000).toFixed(1) + " km");
      setDuration(Math.round(durationVal / 60) + " mins");

      // Start Driver simulation towards pickup if status is ACCEPTED
      if (ride.status === "ACCEPTED") {
        simulateDriverMovementToPickup(ride);
      } else if (ride.status === "ON_THE_WAY") {
        simulateTripMovement(ride, coordinates);
      }

    } catch (err) {
      console.error("Routing calculation failed:", err);
    }
  };

  // 1. Simulation: Driver moving towards pickup point
  const simulateDriverMovementToPickup = (ride: any) => {
    if (simIntervalRef.current) clearInterval(simIntervalRef.current);

    const pLat = ride.pickupLat;
    const pLng = ride.pickupLng;

    // Generate start position 400 meters away
    const distanceInMeters = 400;
    const angle = Math.random() * 2 * Math.PI;
    const dLat = distanceInMeters / 111111;
    const dLng = distanceInMeters / (111111 * Math.cos((pLat * Math.PI) / 180));

    const startLat = pLat + dLat * Math.sin(angle);
    const startLng = pLng + dLng * Math.cos(angle);

    // Initial bearing rotation
    const rotation = (Math.atan2(pLng - startLng, pLat - startLat) * 180) / Math.PI;

    let step = 0;
    const totalSteps = 60; // 60 steps of 200ms = 12 seconds
    const intervalMs = 200;

    simIntervalRef.current = setInterval(() => {
      step++;
      const ratio = step / totalSteps;
      const currentLat = startLat + (pLat - startLat) * ratio;
      const currentLng = startLng + (pLng - startLng) * ratio;

      // Broadcast location update to rider via socket.io
      socket.emit("update_location", {
        rideId: ride.id,
        lat: currentLat,
        lng: currentLng,
        rotation,
      });

      if (step >= totalSteps) {
        clearInterval(simIntervalRef.current!);
        simIntervalRef.current = null;
        setRideStatus("driverArrived");
      }
    }, intervalMs);
  };

  // 2. Simulation: Driver moving along polyline path during trip
  const simulateTripMovement = (ride: any, pathCoords: [number, number][]) => {
    if (simIntervalRef.current) clearInterval(simIntervalRef.current);

    const pathPoints = pathCoords.map(([lng, lat]) => ({ lat, lng }));
    const segmentDistances: number[] = [];
    let totalPathDistance = 0;

    for (let i = 0; i < pathPoints.length - 1; i++) {
      const d = getFlatDistance(
        pathPoints[i].lat,
        pathPoints[i].lng,
        pathPoints[i + 1].lat,
        pathPoints[i + 1].lng
      );
      segmentDistances.push(d);
      totalPathDistance += d;
    }

    let step = 0;
    const totalSteps = 100; // 100 steps of 200ms = 20 seconds trip
    const intervalMs = 200;

    simIntervalRef.current = setInterval(() => {
      step++;
      const ratio = step / totalSteps;
      const targetD = ratio * totalPathDistance;

      let currentSum = 0;
      let idx = 0;
      while (idx < segmentDistances.length - 1 && currentSum + segmentDistances[idx] < targetD) {
        currentSum += segmentDistances[idx];
        idx++;
      }

      const segmentD = segmentDistances[idx];
      const segmentProgress = segmentD > 0 ? (targetD - currentSum) / segmentD : 0;

      const p1 = pathPoints[idx];
      const p2 = pathPoints[idx + 1] || p1;

      const currentLat = p1.lat + (p2.lat - p1.lat) * segmentProgress;
      const currentLng = p1.lng + (p2.lng - p1.lng) * segmentProgress;

      const rotation = (Math.atan2(p2.lng - p1.lng, p2.lat - p1.lat) * 180) / Math.PI;

      // Broadcast location update
      socket.emit("update_location", {
        rideId: ride.id,
        lat: currentLat,
        lng: currentLng,
        rotation,
      });

      if (step >= totalSteps) {
        clearInterval(simIntervalRef.current!);
        simIntervalRef.current = null;
      }
    }, intervalMs);
  };

  // Accept a ride request
  const acceptRide = async (rideId: string) => {
    if (!driver) return;
    try {
      setAcceptingId(rideId);
      const res = await axios.post("/api/driver/accept-ride", {
        rideId,
        driverId: driver.id,
      });
      if (res.data.success) {
        const ride = res.data.ride;
        await setupCurrentRideMap(ride);
        setAvailableRides([]);

        // Emit accept ride via socket
        socket.emit("accept_ride", {
          rideId,
          driver: { id: driver.id, name: driver.name },
        });
      }
    } catch (error: any) {
      console.error("Error accepting ride:", error);
      alert(error.response?.data?.error || "Error accepting ride.");
    } finally {
      setAcceptingId(null);
    }
  };

  // Reject a ride request (dismiss locally)
  const rejectRide = (rideId: string) => {
    setRejectedRideIds((prev) => [...prev, rideId]);
    setAvailableRides((prev) => prev.filter((r) => r.id !== rideId));
  };

  // Progress the active ride status (ACCEPTED -> ON_THE_WAY -> COMPLETED)
  const updateRideStatus = async (nextState: string) => {
    if (!currentRide) return;
    try {
      const res = await axios.post("/api/driver/update-status", {
        rideId: currentRide.id,
        status: nextState,
      });

      if (res.data.success) {
        if (nextState === "ON_THE_WAY") {
          setCurrentRide({ ...currentRide, status: "ON_THE_WAY" });
          setRideStatus("tripStarted");

          // Notify rider and start trip simulation along path
          socket.emit("start_trip", { rideId: currentRide.id });
          if (useRide().route) {
            simulateTripMovement(currentRide, useRide().route!.coordinates);
          }
        } else if (nextState === "COMPLETED") {
          if (simIntervalRef.current) clearInterval(simIntervalRef.current);
          
          // Notify rider
          socket.emit("complete_trip", { rideId: currentRide.id });

          resetRide();
          setCurrentRide(null);
          alert("Ride completed successfully! 🎉");
          fetchProfile(); // Reload profile to update earnings & history
        }
      }
    } catch (error) {
      console.error("Failed to progress ride status:", error);
      alert("Error updating ride status.");
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-black flex items-center justify-center text-white">
        <div className="animate-pulse text-cyan-400 text-lg">Loading Driver Dashboard...</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black p-8 text-white">
      {/* Driver Navbar */}
      <motion.div
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="
        h-20
        rounded-3xl
        border
        border-white/10
        bg-white/5
        backdrop-blur-3xl
        px-8
        flex
        items-center
        justify-between
        shadow-[0_0_40px_rgba(0,255,255,.15)]
        "
      >
        <div className="flex items-center gap-4">
          <button className="rounded-xl bg-white/10 p-3 hover:bg-white/20 transition cursor-pointer">
            <Menu className="text-white" />
          </button>

          <div>
            <h1 className="text-white text-2xl font-black">
              RideX
            </h1>

            <p className="text-purple-400 text-xs tracking-[4px]">
              DRIVER
            </p>
          </div>
        </div>

        <div className="flex items-center gap-5">
          <button className="relative rounded-xl bg-white/10 p-3 hover:bg-white/20 transition cursor-pointer">
            <Bell className="text-white" />
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-purple-500" />
          </button>

          <div className="relative group">
            <button className="rounded-full bg-gradient-to-r from-purple-600 to-cyan-500 p-1 cursor-pointer">
              <UserCircle2
                size={42}
                className="text-white"
              />
            </button>

            <div className="absolute right-0 mt-2 w-48 rounded-2xl border border-white/10 bg-black/95 p-2 shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50">
              <button
                onClick={handleSignOut}
                className="w-full text-left rounded-xl px-4 py-3 text-sm text-red-400 hover:bg-white/5 transition cursor-pointer font-bold"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Main Dashboard Layout */}
      <div className="mt-8 grid grid-cols-3 gap-8">
        {/* Map column */}
        <div className="col-span-2">
          <Map />
        </div>

        {/* Info & queue column */}
        <div className="space-y-8">
          {/* Driver Status Card */}
          <div className="rounded-[35px] border border-white/10 bg-[#111] p-8">
            <h2 className="text-2xl font-bold text-white mb-2">{driver?.name || "Driver Profile"}</h2>
            <p className="text-gray-400 text-sm mb-6">License: {profile?.licenseNumber || "N/A"}</p>

            <div className="flex items-center justify-between p-5 rounded-2xl bg-white/5 border border-white/5 mb-6">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Duty Status</p>
                <p className={`text-lg font-black mt-1 ${status === "AVAILABLE" ? "text-green-400 animate-pulse" : "text-gray-400"}`}>
                  {status}
                </p>
              </div>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={toggleStatus}
                disabled={statusUpdating || currentRide}
                className={`px-6 py-3 rounded-xl font-bold transition cursor-pointer disabled:opacity-50 ${
                  status === "AVAILABLE"
                    ? "bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20"
                    : "bg-green-500 text-black hover:opacity-90"
                }`}
              >
                {statusUpdating ? "Updating..." : status === "AVAILABLE" ? "Go Offline" : "Go Online"}
              </motion.button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/5">
                <div className="h-10 w-10 rounded-lg bg-yellow-500/20 flex items-center justify-center text-yellow-400">
                  <Star size={20} className="fill-yellow-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Rating</p>
                  <p className="text-sm font-bold">{averageRating} / 5.0</p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/5">
                <div className="h-10 w-10 rounded-lg bg-green-500/20 flex items-center justify-center text-green-400">
                  <DollarSign size={20} />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Today's Earnings</p>
                  <p className="text-sm font-bold">₹{totalEarnings.toFixed(2)}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/5">
                <div className="h-10 w-10 rounded-lg bg-cyan-500/20 flex items-center justify-center text-cyan-400">
                  <Car size={20} />
                </div>
                <div>
                  <p className="text-xs text-gray-500">Vehicle</p>
                  <p className="text-sm font-bold">
                    {profile?.vehicle?.color} {profile?.vehicle?.model} ({profile?.vehicle?.plateNumber})
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Active Job Workflow OR Incoming Request Queue */}
          {currentRide ? (
            /* Current Ride Control Screen */
            <div className="rounded-[35px] border border-cyan-500/30 bg-[#111] p-8 shadow-[0_0_40px_rgba(6,182,212,0.1)]">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-cyan-500/20 text-cyan-400">
                ACTIVE RIDE
              </span>

              <div className="mt-5 space-y-4">
                <div>
                  <p className="text-xs text-gray-500">Rider</p>
                  <p className="text-lg font-bold text-white">{currentRide.rider?.name || "Rider"}</p>
                </div>

                <div className="border-l border-white/10 pl-4 space-y-3">
                  <div>
                    <p className="text-xs text-cyan-400 font-semibold">Pickup</p>
                    <p className="text-sm text-gray-300 truncate">{currentRide.pickupAddress}</p>
                  </div>
                  <div>
                    <p className="text-xs text-purple-400 font-semibold">Destination</p>
                    <p className="text-sm text-gray-300 truncate">{currentRide.destinationAddress}</p>
                  </div>
                </div>

                <div className="flex justify-between items-center border-t border-white/5 pt-4">
                  <div>
                    <p className="text-xs text-gray-500">Fare Amount</p>
                    <p className="text-xl font-bold text-green-400">₹{currentRide.fare}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 text-right">Distance</p>
                    <p className="text-sm font-bold text-white text-right">{currentRide.distance || "N/A"}</p>
                  </div>
                </div>

                <div className="mt-6">
                  {currentRide.status === "ACCEPTED" ? (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => updateRideStatus("ON_THE_WAY")}
                      className="w-full h-14 rounded-2xl bg-cyan-500 font-bold text-black flex items-center justify-center gap-2 cursor-pointer hover:opacity-90"
                    >
                      Start Trip <ArrowRight size={18} />
                    </motion.button>
                  ) : (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => updateRideStatus("COMPLETED")}
                      className="w-full h-14 rounded-2xl bg-green-500 font-bold text-black flex items-center justify-center gap-2 cursor-pointer hover:opacity-90 animate-pulse"
                    >
                      Complete Trip <Check size={18} />
                    </motion.button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* Incoming Rides Queue */
            <div className="rounded-[35px] border border-white/10 bg-[#111] p-8">
              <h3 className="text-xl font-bold text-white mb-4">Live Ride Requests</h3>

              {status === "OFFLINE" ? (
                <div className="flex flex-col items-center justify-center py-8 text-center bg-white/5 rounded-2xl border border-white/5">
                  <Eye className="text-gray-600 mb-3" size={32} />
                  <p className="text-gray-400 text-sm font-medium">You are Offline</p>
                  <p className="text-xs text-gray-600 mt-1">Go online to receive incoming requests</p>
                </div>
              ) : availableRides.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center bg-white/5 rounded-2xl border border-white/5">
                  <Loader2 className="animate-spin text-cyan-400 mb-3" size={32} />
                  <p className="text-gray-400 text-sm font-medium">Scanning area...</p>
                  <p className="text-xs text-gray-600 mt-1">Waiting for riders to make a request</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1">
                  <AnimatePresence>
                    {availableRides.map((ride) => (
                      <motion.div
                        key={ride.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -50 }}
                        className="p-5 rounded-2xl bg-white/5 border border-white/5 space-y-3"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-bold text-white">{ride.rider?.name || "Rider"}</p>
                            <p className="text-[10px] text-gray-500">Fare: <span className="text-green-400 font-bold">₹{ride.fare}</span></p>
                          </div>
                          <span className="text-xs text-cyan-400 font-bold">{ride.distance || "N/A"}</span>
                        </div>

                        <div className="text-xs text-gray-400 space-y-1">
                          <p className="truncate"><span className="text-cyan-400 font-semibold">P:</span> {ride.pickupAddress}</p>
                          <p className="truncate"><span className="text-purple-400 font-semibold">D:</span> {ride.destinationAddress}</p>
                        </div>

                        <div className="flex gap-3 pt-2">
                          <button
                            onClick={() => acceptRide(ride.id)}
                            disabled={acceptingId !== null}
                            className="flex-1 py-2.5 rounded-xl bg-cyan-500 text-black font-bold text-xs flex items-center justify-center gap-1 cursor-pointer hover:opacity-90"
                          >
                            {acceptingId === ride.id ? "Accepting..." : "Accept"}
                          </button>
                          <button
                            onClick={() => rejectRide(ride.id)}
                            disabled={acceptingId !== null}
                            className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/5 text-gray-400 font-bold text-xs hover:bg-white/10 cursor-pointer"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>
          )}

          {/* Ride History */}
          <div className="rounded-[35px] border border-white/10 bg-[#111] p-8">
            <h3 className="text-xl font-bold text-white mb-4">Ride History</h3>
            {rideHistory.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">No completed rides yet.</p>
            ) : (
              <div className="space-y-4 max-h-[220px] overflow-y-auto pr-1">
                {rideHistory.map((ride) => (
                  <div key={ride.id} className="p-4 rounded-2xl bg-white/5 border border-white/5 flex justify-between items-center text-sm">
                    <div className="min-w-0">
                      <p className="font-semibold text-white truncate">{ride.rider?.name || "Rider"}</p>
                      <p className="text-xs text-gray-500 mt-1 truncate">
                        {ride.pickupAddress} ➔ {ride.destinationAddress}
                      </p>
                    </div>
                    <div className="text-right ml-4">
                      <p className="font-black text-green-400">₹{ride.fare}</p>
                      <p className="text-[10px] text-gray-500 uppercase font-semibold mt-1">{ride.status}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
