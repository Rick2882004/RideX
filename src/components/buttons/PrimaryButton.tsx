"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

interface Props {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  type?: "button" | "submit";
}

export default function PrimaryButton({
  children,
  className = "",
  onClick,
  type = "button",
}: Props) {
  return (
    <motion.button
      whileHover={{
        scale: 1.03,
      }}
      whileTap={{
        scale: 0.97,
      }}
      transition={{
        type: "spring",
        stiffness: 300,
      }}
      type={type}
      onClick={onClick}
      className={`
        w-full
        rounded-2xl
        bg-gradient-to-r
        from-violet-600
        to-cyan-500
        py-4
        font-semibold
        text-white
        shadow-lg
        hover:shadow-cyan-500/40
        transition-all
        duration-300
        ${className}
      `}
    >
      {children}
    </motion.button>
  );
}