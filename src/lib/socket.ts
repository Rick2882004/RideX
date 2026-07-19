"use client";

import { io } from "socket.io-client";

const SOCKET_URL = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";

export const socket = io(SOCKET_URL, {
  autoConnect: false,
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  timeout: 20000,
});