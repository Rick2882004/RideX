"use client";

import { useEffect } from "react";
import { socket } from "@/lib/socket";

export default function SocketProvider() {
  useEffect(() => {
    if (!socket.connected) {
      socket.connect();
      console.log("Socket connection requested...");
    }

    const handleConnect = () => {
      console.log("Socket connected successfully with ID:", socket.id);
    };

    socket.on("connect", handleConnect);

    return () => {
      socket.off("connect", handleConnect);
    };
  }, []);

  return null;
}