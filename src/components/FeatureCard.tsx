"use client";

import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

export default function FeatureCard({
  icon: Icon,
  title,
  description,
}: FeatureCardProps) {
  return (
    <motion.div
      whileHover={{
        y: -10,
        scale: 1.04,
      }}
      transition={{ duration: 0.3 }}
      className="
      group
      rounded-3xl
      border
      border-white/10
      bg-white/5
      backdrop-blur-3xl
      p-8
      transition-all
      duration-300
      hover:border-cyan-400/40
      hover:shadow-[0_0_40px_rgba(0,255,255,.25)]
      "
    >
      <div
        className="
        mb-6
        flex
        h-16
        w-16
        items-center
        justify-center
        rounded-2xl
        bg-gradient-to-r
        from-cyan-500
        to-purple-600
        "
      >
        <Icon
          size={30}
          className="text-white transition-transform duration-300 group-hover:rotate-12"
        />
      </div>

      <h2 className="text-2xl font-bold text-white">
        {title}
      </h2>

      <p className="mt-4 text-gray-400 leading-7">
        {description}
      </p>
    </motion.div>
  );
}