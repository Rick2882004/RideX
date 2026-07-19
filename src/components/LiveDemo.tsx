"use client";

import { motion, AnimatePresence } from "framer-motion";
import { TypeAnimation } from "react-type-animation";
import { useEffect, useState } from "react";

const steps = [
  {
    title: "Searching for Driver...",
    color: "bg-yellow-500",
  },
  {
    title: "Driver Found",
    color: "bg-green-500",
  },
  {
    title: "Ride Accepted",
    color: "bg-cyan-500",
  },
  {
    title: "Driver Arriving",
    color: "bg-blue-500",
  },
  {
    title: "Ride Started",
    color: "bg-purple-500",
  },
  {
    title: "Ride Completed",
    color: "bg-pink-500",
  },
];

export default function LiveDemo() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % steps.length);
    }, 2500);

    return () => clearInterval(interval);
  }, []);

  return (
    <section className="py-40 px-20">

      <div className="text-center mb-20">

        <p className="uppercase tracking-[8px] text-cyan-400">
          Live Demo
        </p>

        <h2 className="mt-5 text-6xl font-black text-white">
          Watch RideX Work
        </h2>

      </div>

      <div className="mx-auto max-w-4xl rounded-[40px] border border-white/10 bg-white/5 backdrop-blur-3xl p-10">

        <AnimatePresence mode="wait">

          <motion.div
            key={current}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            transition={{ duration: 0.5 }}
          >

            <div className="flex items-center gap-4">

              <div
                className={`h-5 w-5 rounded-full ${steps[current].color} animate-pulse`}
              />

              <h3 className="text-3xl font-bold text-white">
                {steps[current].title}
              </h3>

            </div>

            <div className="mt-12 rounded-3xl bg-black/30 p-10">

              <TypeAnimation
                sequence={[
                  "Connecting to nearest driver...",
                  1000,
                  "Checking ETA...",
                  1000,
                  "Updating ride...",
                  1000,
                ]}
                repeat={Infinity}
                speed={50}
                className="text-xl text-cyan-300"
              />

            </div>

          </motion.div>

        </AnimatePresence>

      </div>

    </section>
  );
}