"use client";

import { useEffect, useState } from "react";
import { rideStates } from "./constants";

export default function RideSimulation() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setStep((prev) => (prev + 1) % rideStates.length);
    }, 2500);

    return () => clearInterval(interval);
  }, []);

  return rideStates[step];
}
