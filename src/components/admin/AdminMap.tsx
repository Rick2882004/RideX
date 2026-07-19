"use client";

import { MapContainer, TileLayer, Marker, Popup, Circle } from "react-leaflet";
import L from "leaflet";

const pickupIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const driverIcon = new L.Icon({
  iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

interface AdminMapProps {
  activeRides: any[];
  drivers: any[];
  ridesForHeatmap: any[];
  showHeatmap: boolean;
}

export default function AdminMap({
  activeRides,
  drivers,
  ridesForHeatmap,
  showHeatmap,
}: AdminMapProps) {
  return (
    <div className="h-[550px] w-full rounded-3xl overflow-hidden border border-white/10 relative">
      <MapContainer
        center={[22.5726, 88.3639]}
        zoom={13}
        style={{ width: "100%", height: "100%" }}
      >
        <TileLayer
          attribution="© OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Heatmap Layer */}
        {showHeatmap &&
          ridesForHeatmap.map((ride) => {
            if (!ride.pickupLat || !ride.pickupLng) return null;
            return (
              <Circle
                key={`heat-${ride.id}`}
                center={[ride.pickupLat, ride.pickupLng]}
                radius={200}
                pathOptions={{
                  fillColor: "#ef4444",
                  color: "#ef4444",
                  fillOpacity: 0.18,
                  stroke: false,
                }}
              />
            );
          })}

        {/* Active Rides Pins */}
        {activeRides.map((ride) => {
          if (!ride.pickupLat || !ride.pickupLng) return null;
          return (
            <Marker
              key={`ride-${ride.id}`}
              position={[ride.pickupLat, ride.pickupLng]}
              icon={pickupIcon}
            >
              <Popup>
                <div className="text-black text-xs font-semibold p-1">
                  <p className="font-bold text-red-600">Active Booking</p>
                  <p className="mt-1">Rider: {ride.rider?.name || "User"}</p>
                  <p>Route: {ride.pickupAddress} ➔ {ride.destinationAddress}</p>
                  <p>Status: {ride.status}</p>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* Online Drivers Pins */}
        {drivers.map((driver) => {
          if (!driver.driverProfile?.currentLat || !driver.driverProfile?.currentLng) return null;
          return (
            <Marker
              key={`driver-${driver.id}`}
              position={[driver.driverProfile.currentLat, driver.driverProfile.currentLng]}
              icon={driverIcon}
            >
              <Popup>
                <div className="text-black text-xs font-semibold p-1">
                  <p className="font-bold text-green-600">Online Driver</p>
                  <p className="mt-1">Name: {driver.name}</p>
                  <p>License: {driver.driverProfile.licenseNumber}</p>
                  <p>Vehicle: {driver.driverProfile.vehicle?.plateNumber || "N/A"}</p>
                  <p>Duty: {driver.driverProfile.status}</p>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
