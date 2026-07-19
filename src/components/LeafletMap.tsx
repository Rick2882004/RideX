"use client";

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
import { useEffect } from "react";
import RoutePolyline from "./RoutePolyline";

const markerIcon = new L.Icon({
  iconUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

// Custom Car Icon Generator with Rotation
const createCarIcon = (rotation: number) => {
  return L.divIcon({
    html: `
      <div style="transform: rotate(${rotation}deg); display: flex; align-items: center; justify-content: center; width: 44px; height: 44px; transition: transform 0.1s linear;">
        <svg width="44" height="44" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0px 4px 6px rgba(0,0,0,0.45));">
          <!-- Wheels -->
          <rect x="18" y="24" width="8" height="18" rx="3" fill="#111" />
          <rect x="74" y="24" width="8" height="18" rx="3" fill="#111" />
          <rect x="18" y="58" width="8" height="18" rx="3" fill="#111" />
          <rect x="74" y="58" width="8" height="18" rx="3" fill="#111" />
          <!-- Car Body -->
          <rect x="24" y="14" width="52" height="72" rx="15" fill="#a78bfa" stroke="#ffffff" stroke-width="2.5" />
          <!-- Windshield & Roof -->
          <rect x="30" y="32" width="40" height="34" rx="6" fill="#1e1b4b" />
          <path d="M30 32 L35 22 L65 22 L70 32 Z" fill="#1e1b4b" opacity="0.85" />
          <path d="M30 66 L35 74 L65 74 L70 66 Z" fill="#1e1b4b" opacity="0.85" />
          <!-- Headlights -->
          <rect x="30" y="9" width="8" height="6" rx="2" fill="#fbbf24" />
          <rect x="62" y="9" width="8" height="6" rx="2" fill="#fbbf24" />
          <!-- Tail lights -->
          <rect x="28" y="85" width="10" height="4" fill="#ef4444" />
          <rect x="62" y="85" width="10" height="4" fill="#ef4444" />
          <!-- Accent Decal -->
          <line x1="50" y1="18" x2="50" y2="28" stroke="#ffffff" stroke-width="2" stroke-linecap="round" opacity="0.5" />
        </svg>
      </div>
    `,
    className: "custom-car-marker",
    iconSize: [44, 44],
    iconAnchor: [22, 22],
  });
};

function MapEvents() {
  const { setPickupLocation } = useRide();

  useMapEvents({
    click(e) {
      setPickupLocation({
        lat: e.latlng.lat,
        lng: e.latlng.lng,
      });
    },
  });

  return null;
}

function MapUpdater() {
  const map = useMap();

  const { pickupLocation, destination, driverLocation, rideStatus } = useRide();

  useEffect(() => {
    if (pickupLocation) {
      map.flyTo(
        [pickupLocation.lat, pickupLocation.lng],
        15,
        {
          duration: 1.2,
        }
      );
    }
  }, [pickupLocation, map]);

  useEffect(() => {
    if (pickupLocation && destination) {
      const bounds = L.latLngBounds([
        [pickupLocation.lat, pickupLocation.lng],
        [destination.lat, destination.lng],
      ]);

      map.fitBounds(bounds, {
        padding: [80, 80],
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
        duration: 0.25,
      });
    }
  }, [driverLocation, rideStatus, map]);

  return null;
}

function LocateUser() {
  const { pickupLocation, setPickupLocation } = useRide();

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setPickupLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      (error) => {
        console.log(error);
      },
      {
        enableHighAccuracy: true,
      }
    );
  }, [setPickupLocation]);

  if (!pickupLocation) return null;

  return (
    <Marker
      position={[
        pickupLocation.lat,
        pickupLocation.lng,
      ]}
      icon={markerIcon}
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
  } = useRide();

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
        attribution="© OpenStreetMap contributors"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <MapEvents />

      <LocateUser />

      <MapUpdater />

      <RoutePolyline />

      {pickupLocation && (
        <Marker
          position={[
            pickupLocation.lat,
            pickupLocation.lng,
          ]}
          icon={markerIcon}
        >
          <Popup>Pickup</Popup>
        </Marker>
      )}

      {destination && (
        <Marker
          position={[
            destination.lat,
            destination.lng,
          ]}
          icon={markerIcon}
        >
          <Popup>Destination</Popup>
        </Marker>
      )}

      {driverLocation && (
        <Marker
          position={[
            driverLocation.lat,
            driverLocation.lng,
          ]}
          icon={createCarIcon(driverRotation)}
        >
          <Popup>Rahul Sharma (Driver)</Popup>
        </Marker>
      )}
    </MapContainer>
  );
}