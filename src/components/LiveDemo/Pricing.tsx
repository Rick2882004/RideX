"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";

const plans = [
  {
    title: "RideX Basic",
    price: "Free",
    features: [
      "Book Rides",
      "Live Tracking",
      "Cash Payment",
      "Ride History",
    ],
  },
  {
    title: "RideX Premium",
    price: "₹199/mo",
    popular: true,
    features: [
      "Priority Drivers",
      "Premium Cars",
      "AI Matching",
      "24x7 Support",
      "Rewards",
    ],
  },
  {
    title: "Business",
    price: "Custom",
    features: [
      "Corporate Dashboard",
      "Employee Rides",
      "Invoices",
      "Analytics",
    ],
  },
];

export default function Pricing() {
  return (
    <section className="py-40 px-10">

      <motion.div
        initial={{ opacity: 0, y: 60 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
      >

        <p className="text-cyan-400 tracking-[8px] uppercase text-center mb-4">
  Pricing
</p>
        <h2 className="text-6xl font-black text-center text-white mt-5">
          Choose Your Plan
        </h2>

        <div className="grid md:grid-cols-3 gap-10 mt-20">

          {plans.map((plan) => (

            <motion.div
              whileHover={{
  y: -20,
  scale: 1.05,
  rotateX: 6,
}}
              key={plan.title}
              className={`rounded-[35px] border p-10 backdrop-blur-3xl transition
              ${
                plan.popular
                  ? "border-cyan-400 bg-cyan-500/10 shadow-[0_0_80px_rgba(0,255,255,.35)]"
                  : "border-white/10 bg-white/5"
              }`}
            >

              {plan.popular && (
                <div className="mb-6 inline-block rounded-full bg-cyan-500 px-4 py-2 text-black font-bold">
                  MOST POPULAR
                </div>
              )}

              <h3 className="text-3xl font-bold text-white">
                {plan.title}
              </h3>

              <div className="mt-4 text-5xl font-black text-cyan-400">
                {plan.price}
              </div>

              <div className="mt-10 space-y-5">

                {plan.features.map((item) => (

                  <div
                    key={item}
                    className="flex items-center gap-3 text-gray-300"
                  >
                    <Check className="text-cyan-400" />
                    {item}
                  </div>

                ))}

              </div>

              <button className="mt-10 w-full rounded-2xl bg-gradient-to-r from-purple-600 to-cyan-500 py-4 text-white font-bold">
                Get Started
              </button>

            </motion.div>

          ))}

        </div>

      </motion.div>

    </section>
  );
}