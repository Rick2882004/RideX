"use client";

import { motion } from "framer-motion";
import { Star } from "lucide-react";

const reviews = [
  {
    name: "Rahul Sharma",
    city: "Kolkata",
    avatar: "👨",
    review:
      "RideX is unbelievably smooth. Driver arrived in less than 3 minutes.",
  },
  {
    name: "Priya Das",
    city: "Delhi",
    avatar: "👩",
    review:
      "The interface feels premium. Booking rides has never been easier.",
  },
  {
    name: "Arjun Patel",
    city: "Mumbai",
    avatar: "🧑",
    review:
      "Live tracking is amazing. Everything feels incredibly responsive.",
  },
  {
    name: "Sneha Roy",
    city: "Bangalore",
    avatar: "👩‍💼",
    review:
      "Looks better than most ride-sharing apps I've used.",
  },
];

export default function Testimonials() {
  return (
    <section className="py-40 overflow-hidden">

      <p className="text-center uppercase tracking-[8px] text-cyan-400">
        Testimonials
      </p>

      <h2 className="mt-5 text-center text-6xl font-black text-white">
        Loved By Thousands
      </h2>

      <motion.div
        animate={{
          x: ["0%", "-50%"],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "linear",
        }}
        className="mt-20 flex gap-8 w-max"
      >
        {[...reviews, ...reviews].map((item, index) => (
          <motion.div
            key={index}
            whileHover={{
              y: -15,
              scale: 1.04,
            }}
            className="
              w-[420px]
              rounded-[35px]
              border
              border-white/10
              bg-white/5
              backdrop-blur-3xl
              p-8
              shadow-[0_0_50px_rgba(0,255,255,.08)]
            "
          >
            <div className="flex items-center gap-5">

              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-purple-600 to-cyan-500 text-3xl">
                {item.avatar}
              </div>

              <div>
                <h3 className="text-xl font-bold text-white">
                  {item.name}
                </h3>

                <p className="text-gray-400">
                  {item.city}
                </p>
              </div>

            </div>

            <div className="mt-6 flex gap-1">
              {[1,2,3,4,5].map((star)=>(
                <Star
                  key={star}
                  size={18}
                  className="fill-cyan-400 text-cyan-400"
                />
              ))}
            </div>

            <p className="mt-6 text-lg leading-8 text-gray-300">
              "{item.review}"
            </p>

          </motion.div>
        ))}
      </motion.div>

    </section>
  );
}