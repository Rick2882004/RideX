export type Coordinates = [number, number]; // [lng, lat]

// Flat distance helper (meters)
function getFlatDistance(lat1: number, lng1: number, lat2: number, lng2: number) {
  const dy = lat2 - lat1;
  const dx = (lng2 - lng1) * Math.cos(((lat1 + lat2) * Math.PI) / 360);
  return Math.sqrt(dx * dx + dy * dy) * 111320;
}

// 1. AI ETA PREDICTION
// Predicts trip duration adjusting for traffic (time-of-day) and simulated weather
export function predictETA(
  pickup: Coordinates,
  destination: Coordinates,
  baseDurationSeconds: number
) {
  const currentHour = new Date().getHours();
  let trafficFactor = 1.0;
  
  // Peak commute hours: 8 AM - 10 AM & 5 PM - 7 PM
  if ((currentHour >= 8 && currentHour <= 10) || (currentHour >= 17 && currentHour <= 19)) {
    trafficFactor = 1.45; // 45% delay due to traffic
  } else if (currentHour >= 22 || currentHour <= 5) {
    trafficFactor = 0.85; // Light traffic late night
  }

  // Simulated weather choice based on current second (rainy, clear, foggy)
  const weatherChoices = ["CLEAR", "CLEAR", "RAIN", "CLEAR", "FOG"];
  const weather = weatherChoices[new Date().getSeconds() % weatherChoices.length];
  let weatherFactor = 1.0;

  if (weather === "RAIN") weatherFactor = 1.35; // 35% delay in rain
  else if (weather === "FOG") weatherFactor = 1.2;

  const predictedSeconds = Math.round(baseDurationSeconds * trafficFactor * weatherFactor);

  return {
    etaSeconds: predictedSeconds,
    trafficFactor,
    weather,
  };
}

// 2. DYNAMIC SURGE PRICING
// Adjusts fare based on localized ride demand, driver supply, peak times, and weather
export function calculateDynamicPricing(
  baseFare: number,
  demandCount: number, // active requests in area
  supplyCount: number, // available drivers in area
  weather: string,
  adminSurgeCap: number = 2.5
) {
  let surgeMultiplier = 1.0;

  // Surge based on supply shortage
  if (demandCount > 0 && supplyCount === 0) {
    surgeMultiplier += 0.5; // High scarcity surge
  } else if (demandCount > supplyCount && supplyCount > 0) {
    surgeMultiplier += (demandCount - supplyCount) * 0.15;
  }

  // Weather surcharge
  if (weather === "RAIN") {
    surgeMultiplier += 0.3;
  }

  // Peak time surcharge
  const currentHour = new Date().getHours();
  if ((currentHour >= 8 && currentHour <= 10) || (currentHour >= 17 && currentHour <= 19)) {
    surgeMultiplier += 0.2;
  }

  // Bound multiplier between 1.0 and admin cap
  surgeMultiplier = Math.max(1.0, Math.min(surgeMultiplier, adminSurgeCap));
  surgeMultiplier = parseFloat(surgeMultiplier.toFixed(2));

  // Determine pricing explanation
  let reason = "Standard rates apply";
  if (surgeMultiplier > 1.0) {
    const triggers = [];
    if (demandCount > supplyCount) triggers.push("high booking volume");
    if (weather === "RAIN") triggers.push("adverse weather conditions");
    if (currentHour >= 8 && currentHour <= 10 || currentHour >= 17 && currentHour <= 19) triggers.push("rush hour commute");
    reason = `Dynamic pricing active due to ${triggers.join(" & ") || "peak supply constraints"}`;
  }

  return {
    fare: Math.round(baseFare * surgeMultiplier),
    surgeMultiplier,
    reason,
  };
}

// 3. HEURISTIC FRAUD DETECTION
// Flags potentially anomalous or suspicious bookings
export function detectFraud(
  riderId: string,
  pickup: Coordinates,
  fare: number,
  paymentMethod: string,
  riderPastRides: any[]
) {
  // Scenario A: High-fare cash transactions (above ₹1500)
  if (paymentMethod === "CASH" && fare > 1500) {
    return {
      flagged: true,
      reason: "High fare cash booking (potential driver collusion risk)",
    };
  }

  // Scenario B: Teleportation GPS Spoofing
  if (riderPastRides && riderPastRides.length > 0) {
    const lastRide = riderPastRides[0];
    if (lastRide.pickupLat && lastRide.pickupLng) {
      const minutesSinceLastRide = (new Date().getTime() - new Date(lastRide.createdAt).getTime()) / 60000;
      
      if (minutesSinceLastRide < 15) {
        const dist = getFlatDistance(pickup[1], pickup[0], lastRide.pickupLat, lastRide.pickupLng);
        const speedKmh = (dist / 1000) / (minutesSinceLastRide / 60);

        if (speedKmh > 200 && dist > 5000) {
          return {
            flagged: true,
            reason: `GPS Spoofing / Teleportation detected: Speed ${Math.round(speedKmh)} km/h is physically impossible`,
          };
        }
      }
    }
  }

  // Scenario C: Excessive cancellations
  const cancelledLastHour = riderPastRides.filter((r) => {
    const hoursSinceRide = (new Date().getTime() - new Date(r.createdAt).getTime()) / 3600000;
    return hoursSinceRide < 1 && r.status === "CANCELLED";
  }).length;

  if (cancelledLastHour >= 3) {
    return {
      flagged: true,
      reason: `High cancellation rate detected: User cancelled ${cancelledLastHour} rides in the last hour (bot behavior flag)`,
    };
  }

  return {
    flagged: false,
    reason: null,
  };
}

// 4. SMART DRIVER ASSIGNMENT
// Ranks available drivers based on rating and proximity distance
export function findSmartDriverMatch(
  pickupLat: number,
  pickupLng: number,
  availableDrivers: any[]
) {
  if (availableDrivers.length === 0) return null;

  const scoredDrivers = availableDrivers.map((driver) => {
    // Determine distance in km
    const driverProfile = driver.driverProfile || {};
    const dLat = driverProfile.currentLat || pickupLat + 0.01;
    const dLng = driverProfile.currentLng || pickupLng + 0.01;
    
    const distanceKm = getFlatDistance(pickupLat, pickupLng, dLat, dLng) / 1000;
    const rating = driverProfile.user?.ratingsGiven?.[0]?.rating || 4.8; // default

    // Scoring: High ratings boost scores, high distance penalises it
    const score = (rating * 20) - (distanceKm * 5);

    return {
      driver,
      distanceKm,
      score,
    };
  });

  // Sort descending by score
  scoredDrivers.sort((a, b) => b.score - a.score);

  return scoredDrivers[0].driver;
}
