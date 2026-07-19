"use client";

import { motion } from "framer-motion";
import PhoneMockup from "../PhoneMockup";

export default function Hero() {
  return (
    <section className="relative flex min-h-screen items-center justify-between px-24">

      {/* Background Glow */}

      <div className="absolute left-20 top-40 h-96 w-96 rounded-full bg-cyan-500/10 blur-[150px]" />

      <div className="absolute right-10 top-20 h-[500px] w-[500px] rounded-full bg-purple-600/10 blur-[180px]" />

      {/* LEFT */}

      <motion.div
        initial={{ opacity: 0, x: -80 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 1 }}
        className="max-w-xl"
      >
        <p className="mb-6 uppercase tracking-[8px] text-cyan-400">
          Future Of Mobility
        </p>

        <h1 className="text-8xl font-black leading-none text-white">
          Move
          <br />
          Smarter.
        </h1>

        <p className="mt-10 text-xl leading-9 text-gray-400">
          Experience premium ride booking with realtime tracking,
          AI driver matching, beautiful glass UI and lightning-fast
          performance.
        </p>

        <div className="mt-12 flex gap-6">

          <button
            className="
            rounded-2xl
            bg-gradient-to-r
            from-purple-600
            to-cyan-500
            px-10
            py-4
            font-semibold
            text-white
            transition
            hover:scale-105
            "
          >
            Get Started
          </button>

          <button
            className="
            rounded-2xl
            border
            border-white/20
            bg-white/10
            px-10
            py-4
            text-white
            backdrop-blur-xl
            transition
            hover:bg-white/20
            "
          >
            Live Demo
          </button>

        </div>

      </motion.div>

      {/* RIGHT */}

      <PhoneMockup />

    </section>
  );
}