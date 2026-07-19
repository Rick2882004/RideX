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

  // Database ride tracking state
  const [activeRideId, setActiveRideId] = useState<string | null>(null);

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

      const res = await axios.post("/api/rides", {
        riderId,
        pickupAddress: pickupAddress || pickupLocation?.name || "Pickup Location",
        pickupLat: pickupLocation?.lat,
        pickupLng: pickupLocation?.lng,
        destinationAddress: destinationAddress || destination?.name || "Destination Location",
        destinationLat: destination?.lat,
        destinationLng: destination?.lng,
        fare: selectedVehicle.fare,
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

  // Handle mock message sending
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
      const randomReply =
        replies[Math.floor(Math.random() * replies.length)];
      setChatMessages((prev) => [
        ...prev,
        { sender: "driver", text: randomReply, time: "Just now" },
      ]);
    }, 1500);
  }

  // Status mapping helper
  const getStatusLabel = () => {
    if (rideStatus === "searching") return "Searching Driver";
    if (rideStatus === "driverFound") {
      return currentEta.includes("2") || currentEta.includes("3")
        ? "Driver Accepted"
        : "Driver Coming";
    }
    if (rideStatus === "driverArrived") return "Driver Arrived";
    if (rideStatus === "tripStarted") {
      return currentEta === "Almost there"
        ? "Almost There"
        : "Trip Started";
    }
    if (rideStatus === "rideCompleted") return "Ride Completed";
    return "Idle";
  };

  // ===============================
  // SEARCHING SCREEN
  // ===============================
  if (rideStatus === "searching") {
    return (
      <div className="rounded-[35px] border border-white/10 bg-[#111] p-8">
        <h2 className="text-3xl font-bold text-white">Searching Drivers</h2>

        <div className="flex justify-center py-12">
          <Loader2 size={70} className="animate-spin text-cyan-400" />
        </div>

        <p className="text-center text-gray-400">Looking for nearby drivers...</p>
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

    return (
      <div className="relative rounded-[35px] border border-white/10 bg-[#111] p-8 overflow-hidden min-h-[460px]">
        {/* Mock Call Screen Overlay */}
        {isCalling && (
          <div className="absolute inset-0 z-50 flex flex-col justify-between bg-black/95 p-8 text-white animate-fade-in">
            <div className="text-center mt-8">
              <div className="relative mx-auto h-24 w-24 rounded-full bg-cyan-500/20 flex items-center justify-center animate-pulse">
                <PhoneCall size={44} className="text-cyan-400" />
              </div>
              <h3 className="mt-6 text-2xl font-bold">Rahul Sharma</h3>
              <p className="text-sm text-cyan-400 mt-2 animate-pulse">
                Calling...
              </p>
            </div>

            <div className="space-y-6 text-center">
              <div className="flex justify-center gap-6">
                <button className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition">
                  <Volume2 size={20} />
                </button>
                <button className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition">
                  <MessageCircle size={20} />
                </button>
              </div>

              <button
                onClick={() => setIsCalling(false)}
                className="w-full rounded-2xl bg-red-500 py-4 font-bold text-white transition hover:bg-red-600"
              >
                End Call
              </button>
            </div>
          </div>
        )}

        {/* Mock Chat Screen Overlay */}
        {isChatting && (
          <div className="absolute inset-0 z-50 flex flex-col justify-between bg-[#111] p-6 text-white animate-fade-in">
            {/* Chat Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <img
                  src="https://i.pravatar.cc/200?img=13"
                  alt="Driver"
                  className="h-10 w-10 rounded-full"
                />
                <div>
                  <h4 className="font-bold">Rahul Sharma</h4>
                  <p className="text-[10px] text-cyan-400">Online</p>
                </div>
              </div>
              <button
                onClick={() => setIsChatting(false)}
                className="rounded-full bg-white/10 p-2 hover:bg-white/20 transition"
              >
                <X size={16} />
              </button>
            </div>

            {/* Message Area */}
            <div className="flex-1 overflow-y-auto my-4 space-y-4 pr-1 text-sm">
              {chatMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex flex-col max-w-[80%] ${
                    msg.sender === "user" ? "ml-auto items-end" : "items-start"
                  }`}
                >
                  <div
                    className={`rounded-2xl px-4 py-3 ${
                      msg.sender === "user"
                        ? "bg-cyan-500 text-black font-medium"
                        : "bg-white/10 text-white"
                    }`}
                  >
                    {msg.text}
                  </div>
                  <span className="text-[9px] text-gray-500 mt-1 px-1">
                    {msg.time}
                  </span>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            {/* Input Form */}
            <form onSubmit={sendMessage} className="flex gap-2">
              <input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 rounded-xl bg-white/10 px-4 py-3 outline-none focus:ring-1 focus:ring-cyan-400"
              />
              <button
                type="submit"
                className="flex items-center justify-center rounded-xl bg-cyan-500 p-3 text-black transition hover:opacity-90"
              >
                <Send size={18} />
              </button>
            </form>
          </div>
        )}

        {/* ===============================
            MAIN ACTIVE SCREEN INTERFACE
            =============================== */}
        <h2 className="mb-4 text-3xl font-bold text-white">Active Trip</h2>

        {/* 1. STATUS STEPPER (Phase 5) */}
        <div className="mb-6 rounded-2xl bg-[#1b1b1b]/80 border border-white/5 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider">
              Status
            </span>
            <span className="text-sm font-bold text-cyan-400 animate-pulse">
              {getStatusLabel()}
            </span>
          </div>

          <div className="relative mt-4 flex items-center justify-between">
            {/* Stepper background line */}
            <div className="absolute left-0 right-0 top-1/2 h-[2px] -translate-y-1/2 bg-white/10"></div>
            {/* Stepper progress line */}
            <div
              className="absolute left-0 top-1/2 h-[2px] -translate-y-1/2 bg-gradient-to-r from-cyan-500 to-purple-500 transition-all duration-500"
              style={{
                width: `${((activeStep - 1) / (steps.length - 1)) * 100}%`,
              }}
            ></div>

            {steps.map((step) => {
              const isCompleted = activeStep > step.id;
              const isActive = activeStep === step.id;
              return (
                <div
                  key={step.id}
                  className="relative z-10 flex flex-col items-center"
                >
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full border text-xs font-bold transition-all duration-300
                      ${
                        isCompleted
                          ? "border-cyan-500 bg-cyan-500 text-black shadow-[0_0_10px_rgba(6,182,212,0.4)]"
                          : isActive
                            ? "border-cyan-400 bg-[#111] text-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.3)] animate-pulse"
                            : "border-white/20 bg-[#1b1b1b] text-gray-400"
                      }`}
                  >
                    {isCompleted ? <Check size={14} /> : step.id}
                  </div>
                  <span
                    className={`mt-2 text-[10px] font-medium tracking-tight
                      ${
                        isActive
                          ? "text-cyan-400 font-bold"
                          : isCompleted
                            ? "text-gray-300"
                            : "text-gray-500"
                      }`}
                  >
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* 2. DYNAMIC DRIVER DETAILS (Phase 6) */}
        <div className="rounded-3xl bg-[#1b1b1b]/80 border border-white/5 p-6 backdrop-blur-xl">
          <div className="flex items-center gap-4">
            <img
              src="https://i.pravatar.cc/200?img=13"
              alt="Driver"
              className="h-16 w-16 rounded-full border-2 border-white/10"
            />
            <div className="flex-1">
              <h3 className="text-xl font-bold text-white">Rahul Sharma</h3>
              <div className="flex items-center gap-2 text-sm text-cyan-400">
                <span className="flex items-center gap-1 font-semibold">
                  <Star size={14} className="fill-cyan-400 text-cyan-400" />
                  4.9
                </span>
                <span className="text-gray-600">•</span>
                <span className="text-gray-400">Premium Driver</span>
              </div>
            </div>
          </div>

          <div className="mt-5 border-t border-white/5 pt-4 space-y-2">
            <div className="flex justify-between text-sm text-gray-300">
              <span>Vehicle</span>
              <span className="font-semibold text-white">White Swift Dzire</span>
            </div>
            <div className="flex justify-between text-sm text-gray-300">
              <span>Plate Number</span>
              <span className="font-mono text-white">WB 06 AB 1234</span>
            </div>
            <div className="flex justify-between text-sm border-t border-white/5 pt-3 mt-2">
              <span className="text-gray-400 font-medium">Live ETA</span>
              <span className="font-bold text-cyan-400 text-base animate-pulse">
                {rideStatus === "driverArrived"
                  ? "Arrived"
                  : rideStatus === "tripStarted"
                    ? currentEta === "Almost there"
                      ? "Almost there!"
                      : `En Route: ${currentEta}`
                    : `Arriving in ${currentEta}`}
              </span>
            </div>
          </div>

          {/* Interactive buttons */}
          <div className="mt-6 flex gap-4">
            <button
              onClick={() => setIsCalling(true)}
              className="flex-1 flex gap-2 items-center justify-center rounded-xl bg-cyan-500 p-4 font-bold text-black transition hover:opacity-90"
            >
              <Phone size={18} />
              Call
            </button>

            <button
              onClick={() => setIsChatting(true)}
              className="flex-1 flex gap-2 items-center justify-center rounded-xl bg-purple-600 p-4 font-bold text-white transition hover:opacity-90"
            >
              <MessageCircle size={18} />
              Chat
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ===============================
  // RIDE COMPLETEDReceipt Card (Phase 4)
  // ===============================
  if (rideStatus === "rideCompleted") {
    return (
      <div className="rounded-[35px] border border-white/10 bg-[#111] p-8 text-white max-w-md mx-auto">
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
            <Check size={36} />
          </div>
          <h2 className="mt-6 text-3xl font-bold">Trip Completed</h2>
          <p className="text-gray-400 text-sm mt-1">Thank you for riding with RideX!</p>
        </div>

        {/* Receipt Overview */}
        <div className="mt-8 rounded-2xl bg-[#1b1b1b]/80 border border-white/5 p-5 space-y-4">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 text-gray-400">
              <RouteIcon size={16} /> Total Distance
            </span>
            <span className="font-semibold">{distance}</span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 text-gray-400">
              <Clock3 size={16} /> Total Time
            </span>
            <span className="font-semibold">{duration}</span>
          </div>

          <div className="flex items-center justify-between border-t border-white/5 pt-4 mt-2">
            <span className="flex items-center gap-2 text-gray-300 font-medium">
              <IndianRupee size={18} className="text-cyan-400" /> Total Fare
            </span>
            <span className="text-2xl font-bold text-cyan-400">₹{baseFare}</span>
          </div>
        </div>

        {/* Rate Driver Section */}
        <div className="mt-8 text-center">
          <h4 className="text-sm font-semibold uppercase tracking-wider text-gray-400">
            Rate Your Driver
          </h4>
          <p className="text-xs text-gray-500 mt-1">Rahul Sharma</p>

          <div className="flex justify-center gap-2 my-4">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onMouseEnter={() => !feedbackSubmitted && setHoverRating(star)}
                onMouseLeave={() => !feedbackSubmitted && setHoverRating(0)}
                onClick={() => !feedbackSubmitted && setUserRating(star)}
                disabled={feedbackSubmitted}
                className="p-1 focus:outline-none transition-transform hover:scale-110 active:scale-95 disabled:opacity-60"
              >
                <Star
                  size={32}
                  className={`transition-colors duration-200 ${
                    star <= (hoverRating || userRating)
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-gray-600"
                  }`}
                />
              </button>
            ))}
          </div>

          {userRating > 0 && !feedbackSubmitted && (
            <button
              onClick={submitRating}
              className="mt-2 text-sm text-cyan-400 font-semibold hover:underline"
            >
              Submit Rating
            </button>
          )}

          {feedbackSubmitted && (
            <p className="text-xs text-cyan-400 font-semibold animate-pulse mt-1">
              Feedback submitted. Thank you!
            </p>
          )}
        </div>

        {/* Back to default Book Another Ride */}
        <button
          onClick={resetRide}
          className="mt-8 h-16 w-full rounded-2xl bg-gradient-to-r from-purple-600 to-cyan-500 text-lg font-bold text-white transition hover:scale-[1.02]"
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
    <div className="rounded-[35px] border border-white/10 bg-[#111] p-8">
      <h2 className="mb-6 text-3xl font-bold text-white">Choose Your Ride</h2>

      <div className="space-y-4">
        {vehicles.map((vehicle) => (
          <div
            key={vehicle.id}
            onClick={() => setSelected(vehicle.id)}
            className={`cursor-pointer rounded-3xl border p-5 transition-all duration-300
            ${
              selected === vehicle.id
                ? "border-cyan-400 bg-cyan-500/10"
                : "border-white/10 bg-[#1b1b1b] hover:border-cyan-500/40"
            }`}
          >
            <div className="flex justify-between">
              <div className="flex gap-4">
                <div className="text-5xl">{vehicle.icon}</div>

                <div>
                  <h3 className="text-xl font-bold text-white">
                    {vehicle.name}
                  </h3>

                  <div className="mt-2 flex items-center gap-4 text-sm text-gray-400">
                    <span className="flex items-center gap-1">
                      <Star
                        size={15}
                        className="fill-yellow-400 text-yellow-400"
                      />
                      {vehicle.rating}
                    </span>

                    <span>{vehicle.eta}</span>

                    <span className="flex items-center gap-1">
                      <Users size={15} />
                      {vehicle.seats}
                    </span>

                    <span className="flex items-center gap-1">
                      <Snowflake size={15} />
                      AC
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-right">
                <p className="text-3xl font-bold text-cyan-400">
                  ₹{vehicle.fare}
                </p>

                <p className="text-sm text-gray-400">Estimated</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={confirmRide}
        className="mt-8 h-16 w-full rounded-2xl bg-gradient-to-r from-purple-600 to-cyan-500 text-xl font-bold text-white transition hover:scale-[1.02]"
      >
        Confirm Ride
      </button>
    </div>
  );
}