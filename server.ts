import { createServer } from "http";
import next from "next";
import { Server } from "socket.io";

const dev = process.env.NODE_ENV !== "production";

const hostname = "localhost";
const port = 3000;

const app = next({
  dev,
  hostname,
  port,
});

const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    handle(req, res);
  });

  const io = new Server(httpServer, {
    cors: {
      origin: "*",
    },
  });

  io.on("connection", (socket) => {
    console.log("✅ User Connected:", socket.id);

    // Join general driver pool room
    socket.on("join_drivers", () => {
      socket.join("drivers");
      console.log(`Driver socket ${socket.id} joined general driver pool`);
    });

    // Join specific ride room
    socket.on("join_ride", ({ rideId }) => {
      socket.join(`ride:${rideId}`);
      console.log(`Socket ${socket.id} joined room ride:${rideId}`);
    });

    // Rider requests a ride
    socket.on("request_ride", ({ ride }) => {
      console.log(`🚖 Ride requested: ${ride.id}`);
      io.to("drivers").emit("ride_requested", ride);
    });

    // Driver accepts the ride
    socket.on("accept_ride", ({ rideId, driver }) => {
      console.log(`✅ Ride ${rideId} accepted by driver ${driver.id}`);
      io.to(`ride:${rideId}`).emit("ride_accepted", { rideId, driver });
    });

    // Driver updates location during trip
    socket.on("update_location", ({ rideId, lat, lng, rotation }) => {
      io.to(`ride:${rideId}`).emit("location_updated", { lat, lng, rotation });
    });

    // Driver starts the trip
    socket.on("start_trip", ({ rideId }) => {
      console.log(`🚀 Trip ${rideId} started`);
      io.to(`ride:${rideId}`).emit("trip_started", { rideId });
    });

    // Driver completes the trip
    socket.on("complete_trip", ({ rideId }) => {
      console.log(`🏁 Trip ${rideId} completed`);
      io.to(`ride:${rideId}`).emit("trip_completed", { rideId });
    });

    // Rider or Driver cancels the ride
    socket.on("cancel_ride", ({ rideId }) => {
      console.log(`❌ Ride ${rideId} cancelled`);
      io.to(`ride:${rideId}`).emit("ride_cancelled", { rideId });
    });

    socket.on("disconnect", () => {
      console.log("❌ User Disconnected:", socket.id);
    });
  });

  httpServer.listen(port, () => {
    console.log(`🚀 Server running at http://${hostname}:${port}`);
  });
});