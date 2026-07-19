import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // 1. Clean up existing data to prevent duplicates (in reverse dependency order)
  await prisma.rating.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.rideStatus.deleteMany();
  await prisma.ride.deleteMany();
  await prisma.driver.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.account.deleteMany();
  await prisma.session.deleteMany();
  await prisma.verification.deleteMany();
  await prisma.user.deleteMany();

  // 2. Hash default password
  const hashedPassword = await bcrypt.hash("password123", 10);

  // 3. Create test rider
  const rider = await prisma.user.create({
    data: {
      id: "rider-test-id",
      name: "Rider Test",
      email: "rider@ridex.com",
      password: hashedPassword,
      role: "RIDER",
      emailVerified: true,
    },
  });
  console.log("✅ Created Rider:", rider.email);

  // Create corresponding Account record for Better Auth credentials login
  await prisma.account.create({
    data: {
      id: "rider-account-id",
      accountId: "rider@ridex.com",
      providerId: "credentials",
      userId: rider.id,
      password: hashedPassword,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });
  console.log("✅ Linked credentials account for Rider");

  // 4. Create test driver (Rahul Sharma)
  const driverUser = await prisma.user.create({
    data: {
      id: "driver-test-id",
      name: "Rahul Sharma",
      email: "rahul@ridex.com",
      password: hashedPassword,
      role: "DRIVER",
      emailVerified: true,
    },
  });
  console.log("✅ Created Driver User:", driverUser.email);

  // Create corresponding Account record for Better Auth credentials login
  await prisma.account.create({
    data: {
      id: "driver-account-id",
      accountId: "rahul@ridex.com",
      providerId: "credentials",
      userId: driverUser.id,
      password: hashedPassword,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });
  console.log("✅ Linked credentials account for Driver");

  // 5. Create Vehicle
  const vehicle = await prisma.vehicle.create({
    data: {
      model: "White Swift Dzire",
      plateNumber: "WB 06 AB 1234",
      color: "White",
      type: "MINI",
    },
  });
  console.log("✅ Created Vehicle:", vehicle.plateNumber);

  // 6. Create Driver Profile linked to Driver User and Vehicle
  const driverProfile = await prisma.driver.create({
    data: {
      userId: driverUser.id,
      licenseNumber: "DL-12345678",
      status: "AVAILABLE",
      currentLat: 22.5726,
      currentLng: 88.3639,
      vehicleId: vehicle.id,
    },
  });
  console.log("✅ Created Driver Profile and linked Vehicle");

  console.log("🎉 Seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
