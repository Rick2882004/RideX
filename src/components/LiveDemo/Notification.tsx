"use client";

import { motion, AnimatePresence } from "framer-motion";

interface Props {
  message: string;
}

export default function Notification({ message }: Props) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -40 }}
        transition={{ duration: 0.5 }}
        className="
          absolute
          top-5
          right-5
          rounded-2xl
          border
          border-cyan-400/20
          bg-white/10
          backdrop-blur-xl
          px-5
          py-3
          shadow-lg
        "
      >
        <p className="text-sm text-cyan-300 font-medium">
          {message}
        </p>
      </motion.div>
    </AnimatePresence>
  );
}