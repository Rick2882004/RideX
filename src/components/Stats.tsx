"use client";

import CountUp from "react-countup";
import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";

const stats = [
  {
    value: 25000,
    suffix: "+",
    title: "Happy Riders",
  },
  {
    value: 500,
    suffix: "+",
    title: "Drivers",
  },
  {
    value: 4.9,
    suffix: "★",
    decimals: 1,
    title: "Average Rating",
  },
  {
    value: 99.9,
    suffix: "%",
    decimals: 1,
    title: "Ride Success",
  },
];

export default function Stats() {
  const { ref, inView } = useInView({
    triggerOnce: true,
  });

  return (
    <section
      ref={ref}
      className="py-32 px-20"
    >
      <div
        className="
        rounded-[40px]
        border
        border-white/10
        bg-white/5
        backdrop-blur-3xl
        p-16
        "
      >
        <div className="grid grid-cols-2 gap-10 lg:grid-cols-4">

          {stats.map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{
                opacity: 0,
                y: 50,
              }}
              whileInView={{
                opacity: 1,
                y: 0,
              }}
              transition={{
                delay: index * 0.15,
                duration: 0.6,
              }}
              className="text-center"
            >
              <h1 className="text-6xl font-black text-cyan-400">

                {inView && (
                  <CountUp
                    end={stat.value}
                    duration={2}
                    decimals={stat.decimals || 0}
                  />
                )}

                {stat.suffix}

              </h1>

              <p className="mt-4 text-lg text-gray-400">
                {stat.title}
              </p>

            </motion.div>
          ))}

        </div>
      </div>
    </section>
  );
}