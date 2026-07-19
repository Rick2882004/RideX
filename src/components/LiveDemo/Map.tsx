"use client";

import { motion } from "framer-motion";

interface Props {
  progress: number;
}

export default function Map({ progress }: Props) {
  const positions = [
    { x: 0, y: 0, rotate: 0 },
    { x: 20, y: 15, rotate: 10 },
    { x: 55, y: 45, rotate: 20 },
    { x: 95, y: 80, rotate: 35 },
    { x: 140, y: 130, rotate: 45 },
    { x: 180, y: 170, rotate: 45 },
  ];

  const index = Math.min(
    Math.floor(progress / 20),
    positions.length - 1
  );

  return (
    <div className="relative h-80 rounded-3xl overflow-hidden border border-white/10 bg-gradient-to-br from-slate-800 via-slate-900 to-black">

      {/* Roads */}

      <div className="absolute top-8 left-6 w-64 h-[3px] bg-white/10 rotate-12" />
      <div className="absolute top-36 left-16 w-72 h-[3px] bg-white/10 -rotate-12" />
      <div className="absolute top-56 left-0 w-full h-[3px] bg-white/10 rotate-6" />
      <div className="absolute left-20 top-0 h-full w-[3px] bg-white/10" />
      <div className="absolute right-16 top-0 h-full w-[3px] bg-white/10" />

      {/* Route */}

      <svg className="absolute inset-0" viewBox="0 0 320 320">
        <path
          d="M60 50 C120 120 180 130 230 220"
          stroke="#22d3ee"
          strokeWidth="5"
          fill="transparent"
          strokeLinecap="round"
        />
      </svg>

      {/* Pickup */}

      <motion.div
        animate={{
          scale: [1, 1.25, 1],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
        }}
        className="absolute left-12 top-10 text-3xl"
      >
        📍
      </motion.div>

      {/* Destination */}

      <div className="absolute bottom-14 right-14 text-3xl">
        🏁
      </div>

      {/* Car */}

      <motion.div
        animate={positions[index]}
        transition={{
          duration: 1.2,
        }}
        className="absolute left-12 top-12 text-4xl"
      >
        🚗
      </motion.div>

    </div>
  );
}