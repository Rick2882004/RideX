"use client";

import { useState, useEffect, useRef } from "react";
import axios from "axios";
import {
  Users,
  Snowflake,
  Star,
  Loader2,
  Phone,
  MessageCircle,
  X,
  Send,
  PhoneCall,
  Volume2,
  Check,
  IndianRupee,
  Route as RouteIcon,
  Clock3,
  ShieldAlert,
  Share2,
  Wallet as WalletIcon,
  CreditCard,
  Percent
} from "lucide-react";
import { useRide } from "@/context/RideContext";
import { socket } from "@/lib/socket";

export default function NearbyDrivers() {
  const {
    rideId,
    setRideId,
    distance,
    duration,
    rideStatus,
    setRideStatus,
    driverLocation,
    currentEta,
    resetRide,
    pickupLocation,
    pickupAddress,
    destination,
    destinationAddress,
    activeRide,
    walletBalance,
    setWalletBalance,
    promoApplied,
    setPromoApplied
  } = useRide();

  const km = distance ? parseFloat(distance) : 0;
  const baseFare = Math.round(60 + km * 15);

  const vehicles = [
    {
      id: 1,
      name: "RideX Mini",
      icon: "🚗",
      eta: "2 min",
      seats: 4,
      rating: 4.9,
      fare: baseFare,
    },
    {
      id: 2,
      name: "RideX Sedan",
      icon: "🚙",
      eta: "4 min",
      seats: 4,
      rating: 4.8,
      fare: baseFare + 70,
    },
    {
      id: 3,
      name: "RideX SUV",
      icon: "🚐",
      eta: "6 min",
      seats: 6,
      rating: 4.9,
      fare: baseFare + 170,
    },
  ];

  const [selected, setSelected] = useState(1);

  // Payment states
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "WALLET">("CASH");

  // Promo code states
  const [promoInput, setPromoInput] = useState("");
  const [promoError, setPromoError] = useState("");

  // Share ride / SOS states
  const [shareCopied, setShareCopied] = useState(false);
  const [sosActive, setSosActive] = useState(false);

  // Mock call and chat states
  const [isCalling, setIsCalling] = useState(false);
  const [isChatting, setIsChatting] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<
    Array<{ sender: "user" | "driver"; text: string; time: string }>
  >([
    {
      sender: "driver",
      text: "Hello! I have accepted your ride request.",
      time: "Just now",
    },
    {
      sender: "driver",
      text: "I am heading to your pickup location now.",
      time: "Just now",
    },
  ]);

  // Rating and review states
  const [userRating, setUserRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  // Chat message container ref for auto scroll
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isChatting && chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [isChatting, chatMessages]);

  // Deduct fare automatically when ride is completed
  const fareDeductedRef = useRef<string | null>(null);
  useEffect(() => {
    if (rideStatus === "rideCompleted" && activeRide && activeRide.id !== fareDeductedRef.current) {
      const finalFare = activeRide.fare;
      if (paymentMethod === "WALLET") {
        setWalletBalance(Math.max(0, walletBalance - finalFare));
      }
      fareDeductedRef.current = activeRide.id;
    }
  }, [rideStatus, activeRide, paymentMethod, walletBalance, setWalletBalance]);

  // Database ride tracking state
  const [activeRideId, setActiveRideId] = useState<string | null>(null);

  const applyPromo = () => {
    setPromoError("");
    const code = promoInput.toUpperCase().trim();
    if (code === "WELCOME20") {
      setPromoApplied("WELCOME20");
    } else if (code === "RIDEX50") {
      setPromoApplied("RIDEX50");
    } else {
      setPromoError("Invalid code. Try WELCOME20 or RIDEX50.");
    }
  };

  const removePromo = () => {
    setPromoApplied(null);
    setPromoInput("");
  };

  const getDiscountedFare = (originalFare: number) => {
    if (promoApplied === "WELCOME20") return Math.round(originalFare * 0.8);
    if (promoApplied === "RIDEX50") return Math.round(originalFare * 0.5);
    return originalFare;
  };

  async function confirmRide() {
    try {
      const userJson = localStorage.getItem("user");
      const user = userJson ? JSON.parse(userJson) : null;
      let riderId = user?.id;

      // Fallback to seeded rider if not logged in
      if (!riderId) {
        const usersRes = await axios.get("/api/users?role=RIDER");
        if (usersRes.data.success && usersRes.data.users.length > 0) {
          riderId = usersRes.data.users[0].id;
        }
      }

      if (!riderId) {
        alert("Please log in to confirm a ride");
        return;
      }

      const selectedVehicle = vehicles.find((v) => v.id === selected) || vehicles[0];
      const finalFare = getDiscountedFare(selectedVehicle.fare);

      if (paymentMethod === "WALLET" && walletBalance < finalFare) {
        alert("Insufficient wallet balance. Please add funds or choose Cash.");
        return;
      }

      const res = await axios.post("/api/rides", {
        riderId,
        pickupAddress: pickupAddress || pickupLocation?.name || "Pickup Location",
        pickupLat: pickupLocation?.lat,
        pickupLng: pickupLocation?.lng,
        destinationAddress: destinationAddress || destination?.name || "Destination Location",
        destinationLat: destination?.lat,
        destinationLng: destination?.lng,
        fare: finalFare,
        distance,
        duration,
      });

      if (res.data.success) {
        const ride = res.data.ride;
        setActiveRideId(ride.id);
        setRideId(ride.id);
        setRideStatus("searching");

        // Notify online drivers in real-time
        socket.emit("request_ride", { ride });
      }
    } catch (err) {
      console.error("Failed to confirm ride:", err);
      alert("Error creating ride record in database.");
    }
  }

  async function submitRating() {
    try {
      const userJson = localStorage.getItem("user");
      const user = userJson ? JSON.parse(userJson) : null;
      let raterId = user?.id;

      if (!raterId) {
        const usersRes = await axios.get("/api/users?role=RIDER");
        if (usersRes.data.success && usersRes.data.users.length > 0) {
          raterId = usersRes.data.users[0].id;
        }
      }

      const driversRes = await axios.get("/api/users?role=DRIVER");
      const driverUser = driversRes.data.users.find((u: any) => u.email === "rahul@ridex.com") || driversRes.data.users[0];

      if (activeRideId && raterId && driverUser) {
        await axios.put("/api/rides", {
          rideId: activeRideId,
          rating: userRating,
          comment: "Trip completed",
          raterId,
          driverId: driverUser.id,
        });
      }
    } catch (err) {
      console.error("Error submitting rating:", err);
    } finally {
      setFeedbackSubmitted(true);
    }
  }

  function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMsg = chatInput.trim();
    setChatMessages((prev) => [
      ...prev,
      { sender: "user", text: userMsg, time: "Just now" },
    ]);
    setChatInput("");

    // Simulate driver reply
    setTimeout(() => {
      const replies = [
        "Got it, driving right now!",
        "Okay, I'll see you shortly.",
        "Understood, I am on the way.",
        "Thanks for the update!",
      ];
      const randomReply = replies[Math.floor(Math.random() * replies.length)];
      setChatMessages((prev) => [
        ...prev,
        { sender: "driver", text: randomReply, time: "Just now" },
      ]);
    }, 1500);
  }

  const handleShareRide = () => {
    if (typeof window !== "undefined") {
      const url = `${window.location.origin}/track/${rideId || "demo"}`;
      navigator.clipboard.writeText(url);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    }
  };

  const getStatusLabel = () => {
    if (rideStatus === "searching") return "Searching Driver";
    if (rideStatus === "driverFound") {
      return currentEta.includes("2") || currentEta.includes("3")
        ? "Driver Accepted"
        : "Driver Coming";
    }
    if (rideStatus === "driverArrived") return "Driver Arrived";
    if (rideStatus === "tripStarted") {
      return currentEta === "Almost there" ? "Almost There" : "Trip Started";
    }
    if (rideStatus === "rideCompleted") return "Ride Completed";
    return "Idle";
  };

  // ===============================
  // SEARCHING SCREEN
  // ===============================
  if (rideStatus === "searching") {
    return (
      <div className="rounded-[35px] border border-white/10 glass-panel p-8 animate-scale-in text-white mobile-floating-card">
        <h2 className="text-2xl lg:text-3xl font-black text-white text-center">Searching Drivers</h2>
        <div className="flex justify-center py-10">
          <Loader2 size={64} className="animate-spin text-cyan-400" />
        </div>
        <p className="text-center text-gray-400 text-sm">Matching you with nearby premium drivers...</p>
      </div>
    );
  }

  // ===============================
  // ACTIVE RIDE (FOUND, ARRIVED, STARTED)
  // ===============================
  if (
    rideStatus === "driverFound" ||
    rideStatus === "driverArrived" ||
    rideStatus === "tripStarted"
  ) {
    const steps = [
      { id: 1, label: "Accepted" },
      { id: 2, label: "Arrived" },
      { id: 3, label: "On Trip" },
      { id: 4, label: "Done" },
    ];

    let activeStep = 1;
    if (rideStatus === "driverFound") activeStep = 1;
    else if (rideStatus === "driverArrived") activeStep = 2;
    else if (rideStatus === "tripStarted") activeStep = 3;

    const displayDistance = activeRide?.distance || distance || "N/A";
    const displayFare = activeRide?.fare !== undefined ? activeRide.fare : "N/A";

    return (
      <div className="relative rounded-[35px] border border-white/10 glass-panel p-8 text-white min-h-[460px] animate-scale-in mobile-floating-card">
        {/* Mock Call Screen */}
        {isCalling && (
          <div className="absolute inset-0 z-50 flex flex-col justify-between bg-black/95 p-8 text-white animate-fade-in rounded-[35px]">
            <div className="text-center mt-8 animate-scale-in">
              <div className="relative mx-auto h-24 w-24 rounded-full bg-cyan-500/20 flex items-center justify-center animate-pulse">
                <PhoneCall size={44} className="text-cyan-400" />
              </div>
              <h3 className="mt-6 text-2xl font-bold">Rahul Sharma</h3>
              <p className="text-xs text-cyan-400 mt-2 animate-pulse">Calling...</p>
            </div>

            <div className="space-y-6 text-center">
              <div className="flex justify-center gap-6">
                <button className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition cursor-pointer">
                  <Volume2 size={20} />
                </button>
                <button className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition cursor-pointer">
                  <MessageCircle size={20} />
                </button>
              </div>
              <button
                onClick={() => setIsCalling(false)}
                className="w-full rounded-2xl bg-red-500 py-4 font-bold text-white transition hover:bg-red-600 cursor-pointer"
              >
                End Call
              </button>
            </div>
          </div>
        )}

        {/* Mock Chat Screen */}
        {isChatting && (
          <div className="absolute inset-0 z-50 flex flex-col justify-between bg-[#121212] p-6 text-white animate-fade-in rounded-[35px]">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gradient-to-r from-purple-500 to-cyan-500 flex items-center justify-center font-bold text-black text-sm">RS</div>
                <div>
                  <h4 className="font-bold text-sm">Rahul Sharma</h4>
                  <p className="text-[10px] text-cyan-400 font-semibold animate-pulse">Online</p>
                </div>
              </div>
              <button
                onClick={() => setIsChatting(false)}
                className="rounded-full bg-white/5 border border-white/5 p-2 hover:bg-white/10 transition cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto my-4 space-y-4 pr-1 text-xs">
              {chatMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex flex-col max-w-[80%] ${
                    msg.sender === "user" ? "ml-auto items-end" : "items-start"
                  }`}
                >
                  <div
                    className={`rounded-2xl px-4 py-2.5 ${
                      msg.sender === "user" ? "bg-cyan-500 text-black font-semibold" : "bg-white/5 border border-white/5 text-white"
                    }`}
                  >
                    {msg.text}
                  </div>
                  <span className="text-[8px] text-gray-500 mt-1 px-1">{msg.time}</span>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            <form onSubmit={sendMessage} className="flex gap-2">
              <input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 rounded-xl bg-white/5 border border-white/5 px-4 py-3 outline-none focus:ring-1 focus:ring-cyan-400 text-xs"
              />
              <button
                type="submit"
                className="flex items-center justify-center rounded-xl bg-cyan-500 p-3 text-black transition hover:opacity-90 cursor-pointer"
              >
                <Send size={16} />
              </button>
            </form>
          </div>
        )}

        {/* SOS Alert Modal */}
        {sosActive && (
          <div className="absolute inset-0 z-50 flex flex-col justify-center items-center bg-red-950/95 p-8 text-white animate-scale-in rounded-[35px] text-center">
            <ShieldAlert size={64} className="text-red-500 animate-bounce" />
            <h3 className="text-2xl font-black mt-4">SOS Emergency Active</h3>
            <p className="text-xs text-red-300 mt-2 max-w-xs leading-relaxed">
              We have broadcasted your current GPS coordinates to emergency responders and family contacts.
            </p>
            <button
              onClick={() => setSosActive(false)}
              className="mt-8 px-8 py-3 bg-white text-black font-bold text-xs rounded-xl hover:opacity-90 transition cursor-pointer"
            >
              Cancel Alert
            </button>
          </div>
        )}

        <h2 className="mb-4 text-2xl lg:text-3xl font-black tracking-tight">Active Trip Info</h2>

        {/* Status Stepper */}
        <div className="mb-6 rounded-2xl bg-white/5 border border-white/5 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Status</span>
            <span className="text-xs font-bold text-cyan-400 animate-pulse">{getStatusLabel()}</span>
          </div>

          <div className="relative mt-4 flex items-center justify-between">
            <div className="absolute left-0 right-0 top-1/2 h-[2px] -translate-y-1/2 bg-white/10"></div>
            <div
              className="absolute left-0 top-1/2 h-[2px] -translate-y-1/2 bg-gradient-to-r from-cyan-500 to-purple-500 transition-all duration-500"
              style={{ width: `${((activeStep - 1) / (steps.length - 1)) * 100}%` }}
            ></div>

            {steps.map((step) => {
              const isCompleted = activeStep > step.id;
              const isActive = activeStep === step.id;
              return (
                <div key={step.id} className="relative z-10 flex flex-col items-center">
                  <div
                    className={`flex h-7 w-7 items-center justify-center rounded-full border text-[10px] font-bold transition-all duration-300
                      ${isCompleted ? "border-cyan-500 bg-cyan-500 text-black shadow-[0_0_8px_rgba(6,182,212,0.4)]"
                        : isActive ? "border-cyan-400 bg-black text-cyan-400 shadow-[0_0_6px_rgba(6,182,212,0.3)] animate-pulse"
                        : "border-white/10 bg-white/5 text-gray-500"
                      }`}
                  >
                    {isCompleted ? <Check size={12} /> : step.id}
                  </div>
                  <span className={`mt-2 text-[9px] font-bold tracking-tight ${isActive ? "text-cyan-400" : "text-gray-500"}`}>
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Driver Details Card */}
        <div className="rounded-3xl bg-white/5 border border-white/5 p-6 relative">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-full bg-gradient-to-r from-purple-500 to-cyan-500 flex items-center justify-center text-black font-bold text-lg">RS</div>
            <div className="flex-1">
              <h3 className="text-lg font-black">Rahul Sharma</h3>
              <div className="flex items-center gap-2 text-xs text-cyan-400">
                <span className="flex items-center gap-0.5 font-bold">
                  <Star size={12} className="fill-cyan-400 text-cyan-400" /> 4.9
                </span>
                <span className="text-gray-600">•</span>
                <span className="text-gray-400 text-[10px] uppercase font-bold">Swift Dzire (WB 06 AB 1234)</span>
              </div>
            </div>
          </div>

          <div className="mt-4 border-t border-white/5 pt-3 text-xs space-y-1 text-gray-400">
            <div className="flex justify-between"><span>Distance Remaining</span><span className="text-white font-semibold">{displayDistance}</span></div>
            <div className="flex justify-between"><span>Trip Fare (Locked)</span><span className="text-green-400 font-bold">₹{displayFare}</span></div>
            <div className="flex justify-between border-t border-white/5 pt-2 mt-2 font-bold">
              <span>Dynamic ETA</span>
              <span className="text-cyan-400 animate-pulse">
                {rideStatus === "driverArrived" ? "Arrived" : rideStatus === "tripStarted" ? `En Route: ${currentEta}` : `Arriving in ${currentEta}`}
              </span>
            </div>
          </div>

          <div className="mt-5 flex gap-2">
            <button
              onClick={() => setIsCalling(true)}
              className="flex-1 flex gap-1.5 items-center justify-center rounded-xl bg-cyan-500 py-3 text-xs font-bold text-black transition hover:opacity-90 cursor-pointer"
            >
              <Phone size={14} /> Call
            </button>
            <button
              onClick={() => setIsChatting(true)}
              className="flex-1 flex gap-1.5 items-center justify-center rounded-xl bg-white/5 border border-white/5 py-3 text-xs font-bold text-white transition hover:bg-white/10 cursor-pointer"
            >
              <MessageCircle size={14} /> Chat
            </button>
          </div>
        </div>

        {/* Floating Utility actions */}
        <div className="mt-5 flex gap-3">
          <button
            onClick={handleShareRide}
            className="flex-1 flex gap-1.5 items-center justify-center rounded-xl bg-white/5 border border-white/5 py-3 text-xs font-bold text-gray-300 hover:text-white transition cursor-pointer"
          >
            <Share2 size={14} /> {shareCopied ? "Link Copied!" : "Share Link"}
          </button>
          <button
            onClick={() => setSosActive(true)}
            className="flex-1 flex gap-1.5 items-center justify-center rounded-xl bg-red-500/10 border border-red-500/20 py-3 text-xs font-bold text-red-400 hover:bg-red-500/20 transition cursor-pointer animate-pulse"
          >
            <ShieldAlert size={14} /> Emergency SOS
          </button>
        </div>
      </div>
    );
  }

  // ===============================
  // RIDE COMPLETED Receipt Card
  // ===============================
  if (rideStatus === "rideCompleted") {
    const finalDistance = activeRide?.distance || distance || "N/A";
    const finalDuration = activeRide?.duration || duration || "N/A";
    const finalFare = activeRide?.fare !== undefined ? activeRide.fare : baseFare;

    return (
      <div className="rounded-[35px] border border-white/10 glass-panel p-8 text-white max-w-md mx-auto animate-scale-in mobile-floating-card">
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
            <Check size={28} />
          </div>
          <h2 className="mt-4 text-2xl font-black">Trip Completed</h2>
          <p className="text-gray-400 text-xs mt-1">Thank you for riding with RideX!</p>
        </div>

        <div className="mt-6 rounded-2xl bg-white/5 border border-white/5 p-5 space-y-3">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span className="flex items-center gap-1.5"><RouteIcon size={14} /> Total Distance</span>
            <span className="font-semibold text-white">{finalDistance}</span>
          </div>
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span className="flex items-center gap-1.5"><Clock3 size={14} /> Total Time</span>
            <span className="font-semibold text-white">{finalDuration}</span>
          </div>
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span className="flex items-center gap-1.5"><CreditCard size={14} /> Payment Method</span>
            <span className="font-semibold text-white">{paymentMethod}</span>
          </div>
          <div className="flex items-center justify-between border-t border-white/10 pt-3 mt-1 text-sm">
            <span className="font-semibold text-gray-300">Total Paid (Invoice)</span>
            <span className="text-xl font-black text-cyan-400">₹{finalFare}</span>
          </div>
        </div>

        {/* Rate Driver */}
        <div className="mt-6 text-center border-t border-white/5 pt-4">
          <h4 className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Rate Driver</h4>
          <p className="text-xs text-gray-500 mt-0.5">Rahul Sharma</p>

          <div className="flex justify-center gap-1.5 my-3">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onMouseEnter={() => !feedbackSubmitted && setHoverRating(star)}
                onMouseLeave={() => !feedbackSubmitted && setHoverRating(0)}
                onClick={() => !feedbackSubmitted && setUserRating(star)}
                disabled={feedbackSubmitted}
                className="transition-transform hover:scale-110 active:scale-95 disabled:opacity-60 cursor-pointer"
              >
                <Star
                  size={28}
                  className={`transition-colors duration-200 ${
                    star <= (hoverRating || userRating) ? "fill-yellow-400 text-yellow-400" : "text-gray-700"
                  }`}
                />
              </button>
            ))}
          </div>

          {userRating > 0 && !feedbackSubmitted && (
            <button
              onClick={submitRating}
              className="text-xs text-cyan-400 font-bold hover:underline transition cursor-pointer"
            >
              Submit Feedback
            </button>
          )}

          {feedbackSubmitted && (
            <p className="text-xs text-cyan-400 font-semibold animate-pulse">Feedback submitted. Thank you!</p>
          )}
        </div>

        <button
          onClick={resetRide}
          className="mt-6 h-14 w-full rounded-2xl bg-gradient-to-r from-purple-600 to-cyan-500 text-sm font-bold text-white transition hover:scale-[1.02] cursor-pointer"
        >
          Book Another Ride
        </button>
      </div>
    );
  }

  // ===============================
  // DEFAULT VEHICLE SELECTION (IDLE)
  // ===============================
  return (
    <div className="rounded-[35px] border border-white/10 glass-panel p-8 text-white mobile-floating-card">
      <h2 className="mb-4 text-2xl font-black tracking-tight">Choose Your Ride</h2>

      <div className="space-y-3">
        {vehicles.map((vehicle) => {
          const discountedFare = getDiscountedFare(vehicle.fare);
          const hasDiscount = promoApplied !== null;
          return (
            <div
              key={vehicle.id}
              onClick={() => setSelected(vehicle.id)}
              className={`cursor-pointer rounded-2xl border p-4 transition-all duration-300 flex items-center justify-between
              ${selected === vehicle.id 
                ? "border-cyan-400 bg-cyan-500/10 shadow-[0_0_15px_rgba(6,182,212,0.1)]" 
                : "border-white/5 bg-[#1b1b1b]/50 hover:border-white/20"
              }`}
            >
              <div className="flex gap-3 items-center">
                <span className="text-3xl">{vehicle.icon}</span>
                <div>
                  <h3 className="text-sm font-black text-white">{vehicle.name}</h3>
                  <div className="mt-1 flex items-center gap-2.5 text-[10px] text-gray-400">
                    <span className="flex items-center gap-0.5"><Star size={10} className="fill-yellow-400 text-yellow-400" /> {vehicle.rating}</span>
                    <span>{vehicle.eta}</span>
                    <span className="flex items-center gap-0.5"><Users size={10} /> {vehicle.seats}</span>
                    <span className="flex items-center gap-0.5"><Snowflake size={10} /> AC</span>
                  </div>
                </div>
              </div>

              <div className="text-right">
                {hasDiscount ? (
                  <>
                    <span className="text-[9px] text-gray-500 line-through">₹{vehicle.fare}</span>
                    <p className="text-lg font-black text-cyan-400">₹{discountedFare}</p>
                  </>
                ) : (
                  <p className="text-lg font-black text-cyan-400">₹{vehicle.fare}</p>
                )}
                <span className="text-[9px] text-gray-500">Estimated</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Promo code panel */}
      <div className="mt-4 p-3 rounded-2xl bg-white/5 border border-white/5 flex gap-2 items-center">
        <Percent size={14} className="text-purple-400" />
        <div className="flex-1 flex gap-2">
          {promoApplied ? (
            <div className="flex-1 flex items-center justify-between text-xs text-purple-400 font-bold bg-purple-500/10 border border-purple-500/25 px-2.5 py-1.5 rounded-lg">
              <span>Code Applied: {promoApplied}</span>
              <button onClick={removePromo} className="text-red-400 hover:text-red-300 font-black cursor-pointer"><X size={12} /></button>
            </div>
          ) : (
            <>
              <input
                placeholder="PROMO CODE"
                value={promoInput}
                onChange={(e) => setPromoInput(e.target.value)}
                className="flex-1 text-[10px] uppercase font-bold tracking-widest bg-transparent border-b border-white/10 outline-none focus:border-cyan-400 text-white"
              />
              <button
                onClick={applyPromo}
                className="px-3 py-1.5 bg-purple-600 rounded-lg text-[10px] font-bold text-white hover:opacity-90 cursor-pointer"
              >
                Apply
              </button>
            </>
          )}
        </div>
      </div>
      {promoError && <p className="text-[9px] text-red-400 font-semibold mt-1 px-1">{promoError}</p>}

      {/* Payment methods selectors */}
      <div className="mt-4 border-t border-white/5 pt-4">
        <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider block mb-2">Payment Method</span>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setPaymentMethod("CASH")}
            className={`py-2 rounded-xl border text-[10px] font-bold transition flex items-center justify-center gap-1.5 cursor-pointer
              ${paymentMethod === "CASH" ? "border-cyan-400 bg-cyan-500/10 text-cyan-400" : "border-white/5 bg-[#1b1b1b]/50 text-gray-500"}`}
          >
            <CreditCard size={12} /> Cash / UPI
          </button>
          <button
            onClick={() => setPaymentMethod("WALLET")}
            className={`py-2 rounded-xl border text-[10px] font-bold transition flex items-center justify-center gap-1.5 cursor-pointer
              ${paymentMethod === "WALLET" ? "border-cyan-400 bg-cyan-500/10 text-cyan-400" : "border-white/5 bg-[#1b1b1b]/50 text-gray-500"}`}
          >
            <WalletIcon size={12} /> Wallet (Balance: ₹{walletBalance.toFixed(0)})
          </button>
        </div>
      </div>

      <button
        onClick={confirmRide}
        className="mt-6 w-full h-14 rounded-2xl bg-gradient-to-r from-purple-600 to-cyan-500 font-bold text-white transition hover:scale-[1.02] active:scale-[0.98] cursor-pointer hover:shadow-[0_0_20px_rgba(6,182,212,0.25)]"
      >
        Confirm Booking
      </button>
    </div>
  );
}