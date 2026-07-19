"use client";

import { motion } from "framer-motion";

export default function MapPreview() {
  return (
    <div
      className="
      relative
      mx-5
      mt-6
      h-80
      overflow-hidden
      rounded-3xl
      border
      border-white/10
      bg-gradient-to-br
      from-slate-800
      via-slate-900
      to-black
      "
    >
      {/* Grid */}

      <div className="absolute inset-0 opacity-20">
        <div className="absolute left-12 top-0 h-full w-[2px] bg-white/20"></div>
        <div className="absolute left-36 top-0 h-full w-[2px] bg-white/20"></div>
        <div className="absolute left-64 top-0 h-full w-[2px] bg-white/20"></div>

        <div className="absolute top-16 left-0 h-[2px] w-full bg-white/20"></div>
        <div className="absolute top-36 left-0 h-[2px] w-full bg-white/20"></div>
        <div className="absolute top-60 left-0 h-[2px] w-full bg-white/20"></div>
      </div>

      {/* Route */}

      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 320 320"
      >
        <motion.path
          d="M60 60 C110 120 170 130 210 210"
          stroke="#22d3ee"
          strokeWidth="5"
          fill="none"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{
            duration: 2,
            repeat: Infinity,
            repeatType: "reverse",
          }}
        />
      </svg>

      {/* Pickup */}

      <motion.div
        animate={{
          scale: [1, 1.2, 1],
        }}
        transition={{
          repeat: Infinity,
          duration: 1.5,
        }}
        className="absolute left-12 top-12 text-3xl"
      >
        📍
      </motion.div>

      {/* Destination */}

      <div className="absolute bottom-14 right-16 text-3xl">
        🏁
      </div>

      {/* Car */}

      <motion.div
        animate={{
          x: [0, 70, 130],
          y: [0, 50, 120],
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
        }}
        className="absolute left-16 top-16 text-4xl"
      >
        🚗
      </motion.div>
    </div>
  );
}