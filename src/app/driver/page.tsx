"use client";

import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import {
  Menu,
  Bell,
  Eye,
  X,
  Check,
  Star,
  DollarSign,
  Car,
  TrendingUp,
  MapPin,
  Clock,
  UserCircle2,
  ArrowRight,
  Loader2,
  Navigation,
  Compass,
  ArrowUpRight,
  MapPinned
} from "lucide-react";
import Map from "@/components/rider/Map";
import { useRide } from "@/context/RideContext";
import { getRoute } from "@/lib/route";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { socket } from "@/lib/socket";

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

  // Connect socket, handle connection status, and database polling fallback
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

    // Database polling fallback for Serverless environment (Vercel)
    let pollInterval: NodeJS.Timeout | null = null;
    if (status === "AVAILABLE" && !currentRide) {
      pollInterval = setInterval(async () => {
        try {
          const res = await axios.get("/api/driver/available-rides");
          if (res.data.success) {
            const rides = res.data.rides.filter(
              (r: any) => !rejectedRideIds.includes(r.id)
            );
            setAvailableRides(rides);
          }
        } catch (err) {
          console.error("Failed to poll available rides:", err);
        }
      }, 3000);
    }

    return () => {
      socket.off("ride_requested", handleRideRequested);
      if (pollInterval) clearInterval(pollInterval);
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

      // Update location in database every 2 seconds (10 steps) or on final step
      if (step % 10 === 0 || step >= totalSteps) {
        axios.post("/api/driver/profile", {
          lat: currentLat,
          lng: currentLng,
        }).catch((err) => console.error("Database driver location update failed:", err));
      }

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

      // Update location in database every 2 seconds (10 steps) or on final step
      if (step % 10 === 0 || step >= totalSteps) {
        axios.post("/api/driver/profile", {
          lat: currentLat,
          lng: currentLng,
        }).catch((err) => console.error("Database driver location update failed during trip:", err));
      }

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

  function getFlatDistance(lat1: number, lng1: number, lat2: number, lng2: number) {
    const dy = lat2 - lat1;
    const dx = (lng2 - lng1) * Math.cos(((lat1 + lat2) * Math.PI) / 360);
    return Math.sqrt(dx * dx + dy * dy) * 111320;
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-black flex items-center justify-center text-white">
        <div className="animate-pulse text-cyan-400 text-lg font-bold">Loading Driver Dashboard...</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black p-4 lg:p-8 text-white">
      {/* Driver Navbar */}
      <motion.div
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="h-20 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-3xl px-6 lg:px-8 flex items-center justify-between shadow-[0_8px_32px_rgba(0,0,0,0.37)] z-40 relative"
      >
        <div className="flex items-center gap-4">
          <button className="rounded-xl bg-white/5 border border-white/5 p-3 hover:bg-white/10 text-white transition cursor-pointer">
            <Menu className="text-white" size={20} />
          </button>

          <div>
            <h1 className="text-white text-xl lg:text-2xl font-black tracking-tight leading-none">
              RideX
            </h1>
            <p className="text-purple-400 text-[10px] tracking-[4px] font-bold mt-1 uppercase">
              Driver Panel
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 lg:gap-5">
          <button className="relative rounded-xl bg-white/5 border border-white/5 p-2.5 hover:bg-white/10 text-white transition cursor-pointer">
            <Bell size={18} />
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-purple-500" />
          </button>

          <div className="relative group">
            <button className="rounded-full bg-gradient-to-r from-purple-600 to-cyan-500 p-0.5 cursor-pointer shadow-[0_0_15px_rgba(168,85,247,0.3)]">
              <div className="h-10 w-10 rounded-full bg-black flex items-center justify-center text-white text-sm font-bold border border-black overflow-hidden">
                {driver?.name?.substring(0, 2).toUpperCase() || "DR"}
              </div>
            </button>

            <div className="absolute right-0 mt-2 w-48 rounded-2xl border border-white/10 bg-black/95 p-2 shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50">
              <button
                onClick={handleSignOut}
                className="w-full text-left rounded-xl px-4 py-2.5 text-xs text-red-400 hover:bg-white/5 transition cursor-pointer font-bold"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Main Dashboard Layout */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10">
        {/* Map column */}
        <div className="col-span-1 lg:col-span-2 mobile-map-height">
          <Map />
        </div>

        {/* Info & queue column */}
        <div className="space-y-6 lg:space-y-8 mobile-floating-card">
          {/* Driver Status Card */}
          <div className="rounded-[35px] border border-white/10 glass-panel p-6 lg:p-8">
            <h2 className="text-xl lg:text-2xl font-black text-white">{driver?.name || "Driver Profile"}</h2>
            <p className="text-gray-400 text-xs mt-1">License: {profile?.licenseNumber || "N/A"}</p>

            <div className="mt-6 flex items-center justify-between p-4 lg:p-5 rounded-2xl bg-white/5 border border-white/5">
              <div>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Duty Status</p>
                <p className={`text-base font-black mt-1 ${status === "AVAILABLE" ? "text-green-400 animate-pulse" : "text-gray-400"}`}>
                  {status === "AVAILABLE" ? "ONLINE" : status}
                </p>
              </div>

              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={toggleStatus}
                disabled={statusUpdating || currentRide}
                className={`px-5 py-2.5 rounded-xl font-bold text-xs transition cursor-pointer disabled:opacity-50 ${
                  status === "AVAILABLE"
                    ? "bg-red-500/10 text-red-400 border border-red-500/25 hover:bg-red-500/20"
                    : "bg-green-500 text-black hover:opacity-90"
                }`}
              >
                {statusUpdating ? "Updating..." : status === "AVAILABLE" ? "Go Offline" : "Go Online"}
              </motion.button>
            </div>

            {/* Micro Stats Row */}
            <div className="mt-6 grid grid-cols-2 gap-3">
              <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center gap-3.5">
                <div className="h-10 w-10 rounded-xl bg-yellow-500/20 flex items-center justify-center text-yellow-400"><Star size={18} className="fill-yellow-400" /></div>
                <div><p className="text-[10px] text-gray-500 font-bold uppercase">Rating</p><p className="text-sm font-black text-white">{averageRating} / 5.0</p></div>
              </div>
              <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center gap-3.5">
                <div className="h-10 w-10 rounded-xl bg-green-500/20 flex items-center justify-center text-green-400"><DollarSign size={18} /></div>
                <div><p className="text-[10px] text-gray-500 font-bold uppercase">Today</p><p className="text-sm font-black text-white">₹{totalEarnings.toFixed(0)}</p></div>
              </div>
            </div>

            <div className="mt-4 p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center gap-3.5">
              <div className="h-10 w-10 rounded-xl bg-cyan-500/20 flex items-center justify-center text-cyan-400"><Car size={18} /></div>
              <div className="min-w-0">
                <p className="text-[10px] text-gray-500 font-bold uppercase">Active Vehicle</p>
                <p className="text-xs font-black text-white truncate">
                  {profile?.vehicle?.color} {profile?.vehicle?.model} ({profile?.vehicle?.plateNumber})
                </p>
              </div>
            </div>
          </div>

          {/* Graphical Earnings Metrics Panel */}
          <div className="rounded-[35px] border border-white/10 glass-panel p-6 lg:p-8">
            <h3 className="text-lg font-black text-white mb-4 flex items-center justify-between">
              <span>Earnings Target</span>
              <TrendingUp size={18} className="text-cyan-400" />
            </h3>

            {/* Daily Target progress bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold text-gray-400">
                <span>Daily Goal (₹1,500)</span>
                <span className="text-cyan-400">{Math.min(100, Math.round((totalEarnings / 1500) * 100))}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-white/5 overflow-hidden">
                <div 
                  className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-purple-500 transition-all duration-1000"
                  style={{ width: `${Math.min(100, (totalEarnings / 1500) * 100)}%` }}
                ></div>
              </div>
            </div>

            {/* Weekly Target Progress bar */}
            <div className="space-y-2 mt-6">
              <div className="flex justify-between text-xs font-semibold text-gray-400">
                <span>Weekly Goal (₹8,000)</span>
                <span className="text-purple-400">{Math.min(100, Math.round(((totalEarnings + 4500) / 8000) * 100))}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-white/5 overflow-hidden">
                <div 
                  className="h-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-1000"
                  style={{ width: `${Math.min(100, ((totalEarnings + 4500) / 8000) * 100)}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Active Job Workflow OR Incoming Request Queue */}
          {currentRide ? (
            /* Current Ride Control Screen */
            <div className="rounded-[35px] border border-cyan-500/30 glass-panel p-6 lg:p-8 shadow-[0_8px_32px_rgba(6,182,212,0.15)] animate-scale-in">
              <div className="flex justify-between items-center mb-5">
                <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-cyan-500/20 text-cyan-400 uppercase tracking-widest animate-pulse">
                  Active Trip
                </span>
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider flex items-center gap-1">
                  <Compass size={12} className="text-cyan-400 animate-spin" /> Live Navigation
                </span>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5">
                  <div>
                    <p className="text-[9px] text-gray-500 uppercase font-bold">Rider</p>
                    <p className="text-base font-black text-white">{currentRide.rider?.name || "Rider"}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] text-gray-500 uppercase font-bold">Receipt Fare</p>
                    <p className="text-base font-black text-green-400">₹{currentRide.fare}</p>
                  </div>
                </div>

                {/* Routing Addresses Details */}
                <div className="relative pl-6 border-l border-dashed border-white/20 space-y-4">
                  <div className="absolute -left-[5px] top-1.5 h-2.5 w-2.5 rounded-full bg-cyan-400 border border-black shadow-[0_0_8px_rgba(34,211,238,0.7)]"></div>
                  <div>
                    <span className="text-[9px] text-gray-500 uppercase font-bold">Pickup point</span>
                    <p className="text-xs text-gray-300 truncate mt-0.5">{currentRide.pickupAddress}</p>
                  </div>
                  <div className="absolute -left-[5px] bottom-1 h-2.5 w-2.5 rounded-full bg-pink-500 border border-black shadow-[0_0_8px_rgba(236,72,153,0.7)]"></div>
                  <div>
                    <span className="text-[9px] text-gray-500 uppercase font-bold">Destination</span>
                    <p className="text-xs text-gray-300 truncate mt-0.5">{currentRide.destinationAddress}</p>
                  </div>
                </div>

                <div className="mt-6">
                  {currentRide.status === "ACCEPTED" ? (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => updateRideStatus("ON_THE_WAY")}
                      className="w-full h-14 rounded-2xl bg-cyan-500 font-bold text-black flex items-center justify-center gap-2 cursor-pointer hover:opacity-90 shadow-[0_4px_15px_rgba(6,182,212,0.3)] text-sm"
                    >
                      Start Trip <ArrowRight size={16} />
                    </motion.button>
                  ) : (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => updateRideStatus("COMPLETED")}
                      className="w-full h-14 rounded-2xl bg-green-500 font-bold text-black flex items-center justify-center gap-2 cursor-pointer hover:opacity-90 animate-pulse shadow-[0_4px_15px_rgba(34,197,94,0.3)] text-sm"
                    >
                      Complete Trip <Check size={16} />
                    </motion.button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* Incoming Rides Queue */
            <div className="rounded-[35px] border border-white/10 glass-panel p-6 lg:p-8 animate-scale-in">
              <h3 className="text-lg font-black text-white mb-4">Incoming Requests Queue</h3>

              {status === "OFFLINE" ? (
                <div className="flex flex-col items-center justify-center py-10 text-center bg-white/5 rounded-2xl border border-white/5">
                  <Eye className="text-gray-600 mb-3" size={32} />
                  <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">You are Offline</p>
                  <p className="text-[10px] text-gray-600 mt-1">Go online to receive incoming requests</p>
                </div>
              ) : availableRides.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center bg-white/5 rounded-2xl border border-white/5">
                  <Loader2 className="animate-spin text-cyan-400 mb-3" size={32} />
                  <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">Scanning area...</p>
                  <p className="text-[10px] text-gray-600 mt-1">Waiting for riders to make a request</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1">
                  <AnimatePresence>
                    {availableRides.map((ride) => (
                      <motion.div
                        key={ride.id}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -50 }}
                        className="p-5 rounded-2xl bg-white/5 border border-white/5 space-y-3 shadow-lg"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-black text-white text-sm">{ride.rider?.name || "Rider"}</p>
                            <p className="text-[10px] text-gray-500 mt-0.5">Fare: <span className="text-green-400 font-bold">₹{ride.fare}</span></p>
                          </div>
                          <span className="text-[10px] text-cyan-400 font-bold bg-cyan-500/10 border border-cyan-500/25 px-2 py-0.5 rounded-md">{ride.distance || "N/A"}</span>
                        </div>

                        {/* Pickup and Dest Address */}
                        <div className="text-[10px] text-gray-400 space-y-1.5 border-t border-b border-white/5 py-2.5">
                          <p className="truncate flex gap-1"><span className="text-cyan-400 font-bold">P:</span> {ride.pickupAddress}</p>
                          <p className="truncate flex gap-1"><span className="text-purple-400 font-bold">D:</span> {ride.destinationAddress}</p>
                        </div>

                        <div className="flex gap-2 pt-1">
                          <button
                            onClick={() => acceptRide(ride.id)}
                            disabled={acceptingId !== null}
                            className="flex-1 py-2.5 rounded-xl bg-cyan-500 text-black font-bold text-xs flex items-center justify-center gap-1 cursor-pointer hover:opacity-90 shadow-[0_3px_8px_rgba(6,182,212,0.2)]"
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
          <div className="rounded-[35px] border border-white/10 glass-panel p-6 lg:p-8">
            <h3 className="text-lg font-black text-white mb-4">Driver Ride History</h3>
            {rideHistory.length === 0 ? (
              <p className="text-xs text-gray-500 text-center py-6">No completed rides yet.</p>
            ) : (
              <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                {rideHistory.map((ride) => (
                  <div key={ride.id} className="p-4 rounded-2xl bg-white/5 border border-white/5 flex justify-between items-center text-xs">
                    <div className="min-w-0 flex-1">
                      <div className="flex justify-between items-center pr-2">
                        <p className="font-bold text-white truncate">{ride.rider?.name || "Rider"}</p>
                        <span className="text-[8px] text-gray-400 font-mono">#{ride.id.substring(0, 6).toUpperCase()}</span>
                      </div>
                      <p className="text-[10px] text-gray-500 mt-1 truncate">
                        {ride.pickupAddress} ➔ {ride.destinationAddress}
                      </p>
                    </div>
                    <div className="text-right ml-4">
                      <p className="font-black text-green-400">₹{ride.fare}</p>
                      <p className="text-[8px] text-gray-500 uppercase font-semibold mt-1">{ride.status}</p>
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
