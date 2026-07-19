"use client";

import Phone from "./Phone";
import Map from "./Map";
import DriverCard from "./DriverCard";
import RideSimulation from "./RideSimulation";

export default function LiveDemo() {
  const ride = RideSimulation();

  return (
    <section className="py-40 flex justify-center">

      <Phone>

        <Map progress={ride.progress} />

        <DriverCard
          title={ride.title}
          eta={ride.eta}
          progress={ride.progress}
        />

      </Phone>

    </section>
  );
}