// socket.js
import { io } from "socket.io-client";

const BACKEND = "http://localhost:8080";

// attach auth token from localStorage for server-side socket auth
const socket = io(BACKEND, {
  withCredentials: true,
  transports: ["websocket"],
  auth: {
    token: typeof window !== "undefined" ? localStorage.getItem("token") : null,
  },
});

export default socket;
