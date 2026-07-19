"use client";

import { useState, useEffect, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import { useRide } from "@/context/RideContext";
import RoutePolyline from "./RoutePolyline";

// Custom Pickup Icon (Pulsing Cyan dot)
const createPickupIcon = () => {
  return L.divIcon({
    html: `
      <div style="display: flex; align-items: center; justify-content: center; width: 32px; height: 32px;">
        <div style="position: relative; width: 16px; height: 16px; display: flex; align-items: center; justify-content: center;">
          <span style="position: absolute; width: 32px; height: 32px; border-radius: 50%; background-color: #22d3ee; opacity: 0.45; animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></span>
          <span style="position: absolute; width: 14px; height: 14px; border-radius: 50%; background-color: #06b6d4; border: 2.5px solid #ffffff; box-shadow: 0 0 10px rgba(6,182,212,0.8);"></span>
        </div>
      </div>
    `,
    className: "custom-pickup-marker",
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
};

// Custom Destination Icon (Pulsing Pink dot)
const createDestinationIcon = () => {
  return L.divIcon({
    html: `
      <div style="display: flex; align-items: center; justify-content: center; width: 32px; height: 32px;">
        <div style="position: relative; width: 16px; height: 16px; display: flex; align-items: center; justify-content: center;">
          <span style="position: absolute; width: 32px; height: 32px; border-radius: 50%; background-color: #f43f5e; opacity: 0.45; animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></span>
          <span style="position: absolute; width: 14px; height: 14px; border-radius: 50%; background-color: #e11d48; border: 2.5px solid #ffffff; box-shadow: 0 0 10px rgba(225,29,72,0.8);"></span>
        </div>
      </div>
    `,
    className: "custom-destination-marker",
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
};

// Custom Car Icon Generator with Rotation
const createCarIcon = (rotation: number) => {
  return L.divIcon({
    html: `
      <div style="transform: rotate(${rotation}deg); display: flex; align-items: center; justify-content: center; width: 44px; height: 44px; transition: transform 0.3s ease;">
        <svg width="44" height="44" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0px 6px 8px rgba(0,0,0,0.55));">
          <!-- Wheels -->
          <rect x="18" y="24" width="8" height="18" rx="3" fill="#111" />
          <rect x="74" y="24" width="8" height="18" rx="3" fill="#111" />
          <rect x="18" y="58" width="8" height="18" rx="3" fill="#111" />
          <rect x="74" y="58" width="8" height="18" rx="3" fill="#111" />
          <!-- Car Body -->
          <rect x="24" y="14" width="52" height="72" rx="15" fill="#22d3ee" stroke="#ffffff" stroke-width="2.5" />
          <!-- Windshield & Roof -->
          <rect x="30" y="32" width="40" height="34" rx="6" fill="#0f172a" />
          <path d="M30 32 L35 22 L65 22 L70 32 Z" fill="#0f172a" opacity="0.85" />
          <path d="M30 66 L35 74 L65 74 L70 66 Z" fill="#0f172a" opacity="0.85" />
          <!-- Headlights -->
          <rect x="30" y="9" width="8" height="6" rx="2" fill="#fbbf24" />
          <rect x="62" y="9" width="8" height="6" rx="2" fill="#fbbf24" />
          <!-- Tail lights -->
          <rect x="28" y="85" width="10" height="4" fill="#ef4444" />
          <rect x="62" y="85" width="10" height="4" fill="#ef4444" />
        </svg>
      </div>
    `,
    className: "custom-car-marker",
    iconSize: [44, 44],
    iconAnchor: [22, 22],
  });
};

function MapEvents() {
  const { setPickupLocation, rideStatus } = useRide();

  useMapEvents({
    click(e) {
      if (rideStatus === "idle") {
        setPickupLocation({
          lat: e.latlng.lat,
          lng: e.latlng.lng,
        });
      }
    },
  });

  return null;
}

function MapUpdater() {
  const map = useMap();
  const { pickupLocation, destination, driverLocation, rideStatus } = useRide();

  useEffect(() => {
    if (pickupLocation && rideStatus === "idle") {
      map.flyTo(
        [pickupLocation.lat, pickupLocation.lng],
        15,
        { duration: 1.2 }
      );
    }
  }, [pickupLocation, map, rideStatus]);

  useEffect(() => {
    if (pickupLocation && destination) {
      const bounds = L.latLngBounds([
        [pickupLocation.lat, pickupLocation.lng],
        [destination.lat, destination.lng],
      ]);

      map.fitBounds(bounds, {
        padding: [60, 60],
      });
    }
  }, [pickupLocation, destination, map]);

  // Camera auto-follow driver en-route
  useEffect(() => {
    if (
      driverLocation &&
      (rideStatus === "driverFound" ||
        rideStatus === "driverArrived" ||
        rideStatus === "tripStarted")
    ) {
      map.panTo([driverLocation.lat, driverLocation.lng], {
        animate: true,
        duration: 0.5,
      });
    }
  }, [driverLocation, rideStatus, map]);

  return null;
}

function LocateUser() {
  const { pickupLocation, setPickupLocation, rideStatus } = useRide();

  useEffect(() => {
    if (rideStatus === "idle") {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setPickupLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.log("Geolocation error:", error);
        },
        { enableHighAccuracy: true }
      );
    }
  }, [setPickupLocation, rideStatus]);

  if (!pickupLocation) return null;

  return (
    <Marker
      position={[pickupLocation.lat, pickupLocation.lng]}
      icon={createPickupIcon()}
    >
      <Popup>Your Location</Popup>
    </Marker>
  );
}

export default function LeafletMap() {
  const {
    pickupLocation,
    destination,
    driverLocation,
    driverRotation,
    isDarkMode,
  } = useRide();

  // Smooth Marker Gliding State
  const [animatedLoc, setAnimatedLoc] = useState<[number, number] | null>(null);

  useEffect(() => {
    if (!driverLocation) {
      setAnimatedLoc(null);
      return;
    }
    if (!animatedLoc) {
      setAnimatedLoc([driverLocation.lat, driverLocation.lng]);
      return;
    }

    const startLat = animatedLoc[0];
    const startLng = animatedLoc[1];
    const targetLat = driverLocation.lat;
    const targetLng = driverLocation.lng;

    if (startLat === targetLat && startLng === targetLng) return;

    let startTime: number | null = null;
    const duration = 1200; // Interpolate movements smoothly over 1.2 seconds

    let animFrameId: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease out quad
      const ease = progress * (2 - progress);

      const currentLat = startLat + (targetLat - startLat) * ease;
      const currentLng = startLng + (targetLng - startLng) * ease;

      setAnimatedLoc([currentLat, currentLng]);

      if (progress < 1) {
        animFrameId = requestAnimationFrame(animate);
      }
    };

    animFrameId = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animFrameId);
  }, [driverLocation]);

  // Premium map tiles (Dark Matter for Dark theme, standard for Light theme)
  const mapTileUrl = isDarkMode
    ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
    : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

  const mapTileAttribution = isDarkMode
    ? "© OpenStreetMap contributors, © CartoDB"
    : "© OpenStreetMap contributors";

  return (
    <MapContainer
      center={[22.5726, 88.3639]}
      zoom={13}
      style={{
        width: "100%",
        height: "100%",
      }}
    >
      <TileLayer
        attribution={mapTileAttribution}
        url={mapTileUrl}
      />

      <MapEvents />

      <LocateUser />

      <MapUpdater />

      <RoutePolyline />

      {pickupLocation && (
        <Marker
          position={[pickupLocation.lat, pickupLocation.lng]}
          icon={createPickupIcon()}
        >
          <Popup>Pickup Location</Popup>
        </Marker>
      )}

      {destination && (
        <Marker
          position={[destination.lat, destination.lng]}
          icon={createDestinationIcon()}
        >
          <Popup>Destination Location</Popup>
        </Marker>
      )}

      {animatedLoc && (
        <Marker
          position={animatedLoc}
          icon={createCarIcon(driverRotation)}
        >
          <Popup>Rahul Sharma (Driver)</Popup>
        </Marker>
      )}
    </MapContainer>
  );
}