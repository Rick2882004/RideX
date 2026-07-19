"use client";

import { motion } from "framer-motion";

export default function BackgroundEffects() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">

      <motion.div
        animate={{
          x: [0, 150, 0],
          y: [0, 80, 0],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="
        absolute
        top-20
        left-20
        h-96
        w-96
        rounded-full
        bg-cyan-500/15
        blur-[140px]
        "
      />

      <motion.div
        animate={{
          x: [0, -180, 0],
          y: [0, -100, 0],
        }}
        transition={{
          duration: 22,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="
        absolute
        bottom-10
        right-10
        h-[500px]
        w-[500px]
        rounded-full
        bg-purple-600/15
        blur-[180px]
        "
      />

      <motion.div
        animate={{
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
        }}
        className="
        absolute
        top-1/2
        left-1/2
        h-80
        w-80
        -translate-x-1/2
        -translate-y-1/2
        rounded-full
        bg-cyan-400/5
        blur-[120px]
        "
      />

    </div>
  );
}