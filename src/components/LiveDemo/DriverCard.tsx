"use client";

import { motion } from "framer-motion";

interface Props {
  title: string;
  eta: string;
  progress: number;
}

export default function DriverCard({
  title,
  eta,
  progress,
}: Props) {
  return (
    <motion.div
      layout
      className="mt-6 rounded-3xl border border-white/10 bg-white/10 backdrop-blur-xl p-5"
    >
      <div className="flex justify-between">

        <div className="flex gap-4">

          <motion.div
            animate={{
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
            }}
            className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 text-3xl"
          >
            <motion.img
  initial={{ scale: 0 }}
  animate={{ scale: 1 }}
  transition={{ duration: 0.4 }}
  src="https://i.pravatar.cc/100?img=12"
  alt="Driver"
  className="h-16 w-16 rounded-full object-cover border-2 border-cyan-400"
/>
          </motion.div>

          <div>

            <h2 className="text-xl font-bold text-white">
              Rahul Sharma
            </h2>

            <p className="text-gray-400">
              ⭐ 4.98 • 1247 Trips
            </p>

            <p className="mt-2 text-cyan-400">
              {title}
            </p>

          </div>

        </div>

        <div className="text-3xl">
          🚗
        </div>

      </div>

      <div className="mt-5 h-3 rounded-full bg-white/10 overflow-hidden">

        <motion.div
          animate={{
            width: `${progress}%`,
          }}
          transition={{
            duration: 1,
          }}
          className="
h-full
rounded-full
bg-gradient-to-r
from-cyan-400
via-sky-400
to-purple-500
shadow-[0_0_25px_rgba(34,211,238,.8)]
"
        />

      </div>

      <div className="mt-5 flex justify-between">

        <span className="text-gray-400">
          ETA
        </span>

        <motion.span
          key={eta}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="font-bold text-cyan-400"
        >
          {eta}
        </motion.span>

      </div>

      <div className="mt-6 flex gap-4">

<motion.button
  whileHover={{ scale: 1.05 }}
  whileTap={{ scale: 0.95 }}
  className="..."
>
  Call
</motion.button>

<motion.button
  whileHover={{ scale: 1.05 }}
  whileTap={{ scale: 0.95 }}
  className="..."
>
  Chat
</motion.button>

      </div>

    </motion.div>
  );
}