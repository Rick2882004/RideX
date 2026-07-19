"use client";

import { Car } from "lucide-react";

export default function Logo() {
  return (
    <div className="flex items-center gap-3">
      <div className="
      flex
      h-12
      w-12
      items-center
      justify-center
      rounded-2xl
      bg-gradient-to-br
      from-violet-600
      to-cyan-500
      shadow-lg
      shadow-violet-500/30
      ">
        <Car className="h-6 w-6 text-white" />
      </div>

      <div>
        <h1 className="text-2xl font-bold text-white">
          RideX
        </h1>

        <p className="text-xs tracking-[0.35em] text-cyan-300 uppercase">
          Premium Mobility
        </p>
      </div>
    </div>
  );
}