"use client";

import { motion } from "framer-motion";

export default function Phone({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <motion.div
      animate={{
        y: [0, -12, 0],
        rotate: [-1, 1, -1],
      }}
      transition={{
        duration: 6,
        repeat: Infinity,
      }}
      className="
      relative
      h-[720px]
      w-[360px]
      rounded-[48px]
      border
      border-white/10
      bg-[#1e2733]
      shadow-[0_0_100px_rgba(0,255,255,.18)]
      overflow-hidden
      "
    >
      {/* Glow */}

      <div className="absolute inset-0 rounded-[48px] bg-gradient-to-br from-cyan-500/5 to-purple-500/5" />

      {/* Status Bar */}

      <div className="flex justify-between px-7 pt-5 text-white text-sm">

        <span>9:41</span>

        <span>📶 🔋</span>

      </div>

      {/* Dynamic Island */}

      <div className="mx-auto mt-3 h-8 w-40 rounded-full bg-black" />

      {/* Content */}

      <div className="relative mt-6 h-full px-5">

        {children}

      </div>

    </motion.div>
  );
}