"use client";

import { motion } from "framer-motion";
import MapPreview from "../components/MapPreview";
import DriverCard from "../components/DriverCard";

export default function PhoneMockup() {
  return (
    <motion.div
      initial={{ opacity: 0, x: 80 }}
      animate={{
        opacity: 1,
        x: 0,
        y: [0, -12, 0],
        rotate: [-2, 2, -2],
      }}
      transition={{
        opacity: { duration: 1 },
        x: { duration: 1 },
        y: {
          repeat: Infinity,
          duration: 6,
        },
        rotate: {
          repeat: Infinity,
          duration: 6,
        },
      }}
      className="relative"
    >
      {/* Glow */}

      <div className="absolute -inset-12 rounded-full bg-cyan-500/20 blur-[120px]" />

      {/* Phone */}

      <div
        className="
        relative
        h-[700px]
        w-[340px]
        overflow-hidden
        rounded-[50px]
        border
        border-white/20
        bg-white/10
        backdrop-blur-3xl
        shadow-[0_0_100px_rgba(0,255,255,.25)]
      "
      >
        {/* Status Bar */}

        <div className="flex justify-between px-6 pt-5 text-white">

          <span className="font-semibold">
            9:41
          </span>

          <span>
            📶 🔋
          </span>

        </div>

        {/* Dynamic Island */}

        <div className="mx-auto mt-3 h-8 w-40 rounded-full bg-black" />

        {/* Map */}

        <MapPreview />

        {/* Driver */}

        <DriverCard />

        {/* Floating Notification */}

        <motion.div
          animate={{
            y: [0, -8, 0],
          }}
          transition={{
            repeat: Infinity,
            duration: 3,
          }}
          className="
          absolute
          right-4
          top-36
          rounded-2xl
          border
          border-white/20
          bg-white/10
          px-4
          py-3
          backdrop-blur-xl
        "
        >
          <p className="text-xs text-cyan-300">
            Driver accepted your ride
          </p>
        </motion.div>
      </div>
    </motion.div>
  );
}