"use client";

import {
  Brain,
  Globe,
  CreditCard,
  ShieldCheck,
  MapPinned,
  Zap,
} from "lucide-react";

import FeatureCard from "./FeatureCard";

const features = [
  {
    icon: MapPinned,
    title: "Live Ride Tracking",
    description:
      "Track your driver in real time with smooth GPS updates.",
  },
  {
    icon: Brain,
    title: "AI Driver Match",
    description:
      "Smart matching algorithm finds the nearest driver instantly.",
  },
  {
    icon: CreditCard,
    title: "Cashless Payment",
    description:
      "Secure online payments with multiple payment methods.",
  },
  {
    icon: ShieldCheck,
    title: "Ride Safety",
    description:
      "SOS alerts, live trip sharing and verified drivers.",
  },
  {
    icon: Zap,
    title: "Lightning Fast",
    description:
      "Book your ride in just a few seconds.",
  },
  {
    icon: Globe,
    title: "Available Everywhere",
    description:
      "Ride across cities with one seamless experience.",
  },
];

export default function Features() {
  return (
    <section className="px-20 py-32">

      <div className="mb-20 text-center">

        <p className="tracking-[6px] uppercase text-cyan-400">
          FEATURES
        </p>

        <h1 className="mt-4 text-5xl font-black text-white">
          Why RideX?
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-400">
          Everything you need for a premium ride-sharing experience,
          powered by modern technology.
        </p>

      </div>

      <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">

        {features.map((feature) => (
          <FeatureCard
            key={feature.title}
            icon={feature.icon}
            title={feature.title}
            description={feature.description}
          />
        ))}

      </div>

    </section>
  );
}