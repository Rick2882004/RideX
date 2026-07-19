import Navbar from "@/components/rider/Navbar";
import Map from "@/components/rider/Map";
import BookingCard from "@/components/rider/BookingCard";
import NearbyDrivers from "@/components/rider/NearbyDrivers";

export default function RiderPage() {
  return (
    <main className="min-h-screen bg-black p-8">
      <Navbar />

      <div className="mt-8 grid grid-cols-3 gap-8">
        <div className="col-span-2">
          <Map />
        </div>

        <div className="space-y-8">
          <BookingCard />
          <NearbyDrivers />
        </div>
      </div>
    </main>
  );
}